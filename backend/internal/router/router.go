package router

import (
	"database/sql"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/alibei999/ewallet-backend/internal/config"
	"github.com/alibei999/ewallet-backend/internal/handler"
	"github.com/alibei999/ewallet-backend/internal/middleware"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	jwtpkg "github.com/alibei999/ewallet-backend/pkg/jwt"
)

func Setup(db *sql.DB, cfg *config.Config) *gin.Engine {
	r := gin.Default()

	// CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{cfg.FrontendURL, "http://localhost:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

	// JWT Manager
	jwtManager := jwtpkg.NewManager(
		cfg.JWT.AccessSecret,
		cfg.JWT.RefreshSecret,
		cfg.JWT.AccessTTL,
		cfg.JWT.RefreshTTL,
	)

	// Middleware
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	// Repositories
	authRepo := repository.NewAuthRepository(db)
	walletRepo := repository.NewWalletRepository(db)

	// Usecases
	authUC := usecase.NewAuthUsecase(authRepo, jwtManager)
	walletUC := usecase.NewWalletUsecase(walletRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authUC)
	walletHandler := handler.NewWalletHandler(walletUC)

	// Routes
	api := r.Group("/api/v1")
	{
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/me", authMiddleware.RequireAuth(), authHandler.Me)
		}

		wallet := api.Group("/wallet", authMiddleware.RequireAuth())
		{
			wallet.POST("/create", walletHandler.Create)
			wallet.GET("/balance", walletHandler.GetBalance)
			wallet.POST("/deposit", walletHandler.MockDeposit)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "ewallet-backend"})
	})

	return r
}