package handler

import (
	"net/http"

	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	"github.com/alibei999/ewallet-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type WalletHandler struct {
	usecase *usecase.WalletUsecase
}

func NewWalletHandler(uc *usecase.WalletUsecase) *WalletHandler {
	return &WalletHandler{usecase: uc}
}

// POST /api/v1/wallet/create
func (h *WalletHandler) Create(c *gin.Context) {
	userID, _ := c.Get("user_id")

	wallet, err := h.usecase.CreateWallet(userID.(string))
	if err != nil {
		if err.Error() == "wallet already exists" {
			response.Err(c, http.StatusConflict, err.Error())
			return
		}
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusCreated, "wallet created", wallet)
}

// GET /api/v1/wallet/balance
func (h *WalletHandler) GetBalance(c *gin.Context) {
	userID, _ := c.Get("user_id")

	wallet, err := h.usecase.GetWallet(userID.(string))
	if err != nil {
		if err.Error() == "wallet not found" {
			response.Err(c, http.StatusNotFound, err.Error())
			return
		}
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "ok", wallet)
}

// POST /api/v1/wallet/deposit (mock)
// POST /api/v1/wallet/deposit (mock)
func (h *WalletHandler) MockDeposit(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.DepositRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	wallet, err := h.usecase.MockDeposit(userID.(string), req.Currency, req.Amount)
	if err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "deposit successful", wallet)
}