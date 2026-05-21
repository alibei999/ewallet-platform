package handler

import (
	"net/http"
	"strings"

	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	"github.com/alibei999/ewallet-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type TransferHandler struct {
	usecase *usecase.TransferUsecase
}

func NewTransferHandler(uc *usecase.TransferUsecase) *TransferHandler {
	return &TransferHandler{usecase: uc}
}

// POST /api/v1/wallet/transfer
func (h *TransferHandler) Transfer(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.usecase.Transfer(userID.(string), req)
	if err != nil {
		msg := err.Error()
		switch {
		case msg == "recipient not found" ||
			msg == "sender wallet not found" ||
			msg == "recipient wallet not found":
			response.Err(c, http.StatusNotFound, msg)
		case msg == "cannot transfer to yourself" ||
			msg == "amount must be positive" ||
			msg == "unsupported currency" ||
			strings.HasPrefix(msg, "insufficient balance"):
			response.Err(c, http.StatusBadRequest, msg)
		default:
			response.Err(c, http.StatusInternalServerError, msg)
		}
		return
	}

	response.OK(c, http.StatusOK, "transfer successful", result)
}