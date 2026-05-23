package handler

import (
	"net/http"
	"strconv"

	"github.com/alibei999/ewallet-backend/internal/usecase"
	"github.com/alibei999/ewallet-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type TransactionHandler struct {
	usecase *usecase.TransactionUsecase
}

func NewTransactionHandler(uc *usecase.TransactionUsecase) *TransactionHandler {
	return &TransactionHandler{usecase: uc}
}

// GET /api/v1/transactions
func (h *TransactionHandler) GetHistory(c *gin.Context) {
	userID, _ := c.Get("user_id")

	txType := c.Query("type")
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	result, err := h.usecase.GetHistory(userID.(string), txType, status, limit, offset)
	if err != nil {
		switch err.Error() {
		case "wallet not found":
			response.Err(c, http.StatusNotFound, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusOK, "ok", result)
}

// GET /api/v1/transactions/:id
func (h *TransactionHandler) GetByID(c *gin.Context) {
	userID, _ := c.Get("user_id")
	txID := c.Param("id")

	result, err := h.usecase.GetByID(userID.(string), txID)
	if err != nil {
		switch err.Error() {
		case "transaction not found":
			response.Err(c, http.StatusNotFound, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusOK, "ok", result)
}