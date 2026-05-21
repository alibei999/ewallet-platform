package middleware

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	jwtpkg "github.com/alibei999/ewallet-backend/pkg/jwt"
	"github.com/alibei999/ewallet-backend/pkg/response"
)

type AuthMiddleware struct {
	jwtManager *jwtpkg.Manager
}

func NewAuthMiddleware(jwtManager *jwtpkg.Manager) *AuthMiddleware {
	return &AuthMiddleware{jwtManager: jwtManager}
}

func (m *AuthMiddleware) RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			response.Err(c, http.StatusUnauthorized, "authorization header required")
			c.Abort()
			return
		}

		tokenStr := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := m.jwtManager.ParseAccessToken(tokenStr)
		if err != nil {
			response.Err(c, http.StatusUnauthorized, "invalid or expired token")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("email", claims.Email)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func (m *AuthMiddleware) RequireRole(roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		role, exists := c.Get("role")
		if !exists {
			response.Err(c, http.StatusForbidden, "access denied")
			c.Abort()
			return
		}

		roleStr := role.(string)
		for _, r := range roles {
			if r == roleStr {
				c.Next()
				return
			}
		}

		response.Err(c, http.StatusForbidden, "insufficient permissions")
		c.Abort()
	}
}