package handler

import (
	"net/http"

	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	"github.com/alibei999/ewallet-backend/pkg/response"
	"github.com/gin-gonic/gin"
)

type KYCHandler struct {
	usecase *usecase.KYCUsecase
}

func NewKYCHandler(uc *usecase.KYCUsecase) *KYCHandler {
	return &KYCHandler{usecase: uc}
}

// POST /api/v1/kyc/submit
func (h *KYCHandler) Submit(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.KYCSubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.usecase.Submit(userID.(string), req)
	if err != nil {
		switch err.Error() {
		case "kyc already submitted and pending review", "kyc already approved":
			response.Err(c, http.StatusConflict, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusCreated, "kyc submitted successfully", result)
}

// GET /api/v1/kyc/status
func (h *KYCHandler) GetStatus(c *gin.Context) {
	userID, _ := c.Get("user_id")

	result, err := h.usecase.GetStatus(userID.(string))
	if err != nil {
		if err.Error() == "kyc not found" {
			response.Err(c, http.StatusNotFound, err.Error())
			return
		}
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "ok", result)
}

// GET /api/v1/admin/kyc/pending
func (h *KYCHandler) GetAllPending(c *gin.Context) {
	list, err := h.usecase.GetAllPending()
	if err != nil {
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "ok", list)
}

// POST /api/v1/admin/kyc/:id/review
func (h *KYCHandler) Review(c *gin.Context) {
	adminID, _ := c.Get("user_id")
	kycID := c.Param("id")

	var req dto.KYCReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.usecase.Review(adminID.(string), kycID, req)
	if err != nil {
		switch err.Error() {
		case "kyc request not found":
			response.Err(c, http.StatusNotFound, err.Error())
		case "kyc request is not pending", "reject_reason is required when rejecting":
			response.Err(c, http.StatusBadRequest, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusOK, "kyc reviewed", result)
}