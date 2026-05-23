package middleware

import (
	"net/http"

	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/alibei999/ewallet-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type APIKeyMiddleware struct {
	merchantRepo *repository.MerchantRepository
}

func NewAPIKeyMiddleware(merchantRepo *repository.MerchantRepository) *APIKeyMiddleware {
	return &APIKeyMiddleware{merchantRepo: merchantRepo}
}

func (m *APIKeyMiddleware) RequireAPIKey() gin.HandlerFunc {
	return func(c *gin.Context) {
		apiKey := c.GetHeader("X-API-Key")
		if apiKey == "" {
			response.Err(c, http.StatusUnauthorized, "X-API-Key header required")
			c.Abort()
			return
		}

		merchant, err := m.merchantRepo.GetByAPIKey(apiKey)
		if err != nil {
			response.Err(c, http.StatusInternalServerError, "failed to validate api key")
			c.Abort()
			return
		}
		if merchant == nil {
			response.Err(c, http.StatusUnauthorized, "invalid api key")
			c.Abort()
			return
		}
		if !merchant.IsActive {
			response.Err(c, http.StatusForbidden, "merchant account is inactive")
			c.Abort()
			return
		}

		c.Set("merchant_id", merchant.ID.String())
		c.Set("merchant", merchant)
		c.Next()
	}
}
