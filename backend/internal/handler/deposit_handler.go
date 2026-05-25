package handler

import (
	"net/http"

	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	"github.com/alibei999/ewallet-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type DepositHandler struct {
	usecase *usecase.DepositUsecase
}

func NewDepositHandler(uc *usecase.DepositUsecase) *DepositHandler {
	return &DepositHandler{usecase: uc}
}

// POST /api/v1/wallet/deposit
func (h *DepositHandler) Deposit(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.usecase.Deposit(userID.(string), req)
	if err != nil {
		switch err.Error() {
		case "wallet not found":
			response.Err(c, http.StatusNotFound, err.Error())
		case "invalid amount", "amount exceeds maximum deposit limit of 1,000,000":
			response.Err(c, http.StatusBadRequest, err.Error())
		case "currency balance not found for wallet":
			response.Err(c, http.StatusBadRequest, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusOK, "deposit successful", result)
}

// POST /api/v1/wallet/withdraw
func (h *DepositHandler) Withdraw(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.WithdrawRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.usecase.Withdraw(userID.(string), req)
	if err != nil {
		switch err.Error() {
		case "wallet not found":
			response.Err(c, http.StatusNotFound, err.Error())
		case "kyc verification required for withdrawal":
			response.Err(c, http.StatusForbidden, err.Error())
		case "invalid amount":
			response.Err(c, http.StatusBadRequest, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusOK, "withdrawal successful", result)
}