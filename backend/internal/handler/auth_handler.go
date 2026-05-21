package handler

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	"github.com/alibei999/ewallet-backend/pkg/response"
)

type AuthHandler struct {
	usecase *usecase.AuthUsecase
}

func NewAuthHandler(uc *usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{usecase: uc}
}

// POST /api/v1/auth/register
func (h *AuthHandler) Register(c *gin.Context) {
	var req dto.RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.usecase.Register(&req)
	if err != nil {
		if err.Error() == "email already registered" {
			response.Err(c, http.StatusConflict, err.Error())
			return
		}
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusCreated, "registered successfully", res)
}

// POST /api/v1/auth/login
func (h *AuthHandler) Login(c *gin.Context) {
	var req dto.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.usecase.Login(&req)
	if err != nil {
		response.Err(c, http.StatusUnauthorized, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "login successful", res)
}

// POST /api/v1/auth/refresh
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	res, err := h.usecase.Refresh(&req)
	if err != nil {
		response.Err(c, http.StatusUnauthorized, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "token refreshed", res)
}

// POST /api/v1/auth/logout
func (h *AuthHandler) Logout(c *gin.Context) {
	var req dto.RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Try to get from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			response.Err(c, http.StatusBadRequest, "refresh_token required")
			return
		}
	}

	if err := h.usecase.Logout(req.RefreshToken); err != nil {
		response.Err(c, http.StatusInternalServerError, "logout failed")
		return
	}

	response.OK(c, http.StatusOK, "logged out successfully", nil)
}

// GET /api/v1/auth/me
func (h *AuthHandler) Me(c *gin.Context) {
	userID, _ := c.Get("user_id")
	email, _ := c.Get("email")
	role, _ := c.Get("role")

	response.OK(c, http.StatusOK, "ok", gin.H{
		"user_id": userID,
		"email":   email,
		"role":    role,
	})
}