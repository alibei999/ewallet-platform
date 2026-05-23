package router

import (
	"database/sql"
	"time"

	"github.com/alibei999/ewallet-backend/internal/config"
	"github.com/alibei999/ewallet-backend/internal/handler"
	"github.com/alibei999/ewallet-backend/internal/middleware"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	jwtpkg "github.com/alibei999/ewallet-backend/pkg/jwt"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
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
	transactionRepo := repository.NewTransactionRepository(db)
	kycRepo := repository.NewKYCRepository(db)

	// Usecases
	authUC := usecase.NewAuthUsecase(authRepo, jwtManager)
	walletUC := usecase.NewWalletUsecase(walletRepo)
	transferUC := usecase.NewTransferUsecase(walletRepo, authRepo, transactionRepo)
	kycUC := usecase.NewKYCUsecase(kycRepo, authRepo)

	// Handlers
	authHandler := handler.NewAuthHandler(authUC)
	walletHandler := handler.NewWalletHandler(walletUC)
	transferHandler := handler.NewTransferHandler(transferUC)
	kycHandler := handler.NewKYCHandler(kycUC)

	// Routes
	api := r.Group("/api/v1")
	{
		// Auth routes
		auth := api.Group("/auth")
		{
			auth.POST("/register", authHandler.Register)
			auth.POST("/login", authHandler.Login)
			auth.POST("/refresh", authHandler.Refresh)
			auth.POST("/logout", authHandler.Logout)
			auth.GET("/me", authMiddleware.RequireAuth(), authHandler.Me)
		}

		// Wallet routes
		wallet := api.Group("/wallet", authMiddleware.RequireAuth())
		{
			wallet.POST("/create", walletHandler.Create)
			wallet.GET("/balance", walletHandler.GetBalance)
			wallet.POST("/deposit", walletHandler.MockDeposit)
			wallet.POST("/transfer", transferHandler.Transfer)
		}

		// KYC routes (user)
		kyc := api.Group("/kyc", authMiddleware.RequireAuth())
		{
			kyc.POST("/submit", kycHandler.Submit)
			kyc.GET("/status", kycHandler.GetStatus)
		}

		// Admin routes
		admin := api.Group("/admin", authMiddleware.RequireAuth(), authMiddleware.RequireAdmin())
		{
			admin.GET("/kyc/pending", kycHandler.GetAllPending)
			admin.POST("/kyc/:id/review", kycHandler.Review)
		}
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok", "service": "ewallet-backend"})
	})

	return r
}