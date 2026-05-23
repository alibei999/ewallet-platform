package handler

import (
	"net/http"
	"strconv"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/usecase"
	"github.com/alibei999/ewallet-backend/pkg/response"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type MerchantHandler struct {
	merchantUC *usecase.MerchantUsecase
	invoiceUC  *usecase.InvoiceUsecase
}

func NewMerchantHandler(merchantUC *usecase.MerchantUsecase, invoiceUC *usecase.InvoiceUsecase) *MerchantHandler {
	return &MerchantHandler{merchantUC: merchantUC, invoiceUC: invoiceUC}
}

// POST /api/v1/merchant/register
func (h *MerchantHandler) Register(c *gin.Context) {
	userID, _ := c.Get("user_id")

	var req dto.RegisterMerchantRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.merchantUC.RegisterMerchant(userID.(string), req)
	if err != nil {
		switch err.Error() {
		case "merchant account already registered for this user":
			response.Err(c, http.StatusConflict, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusCreated, "merchant registered successfully", result)
}

// GET /api/v1/merchant/info
func (h *MerchantHandler) GetInfo(c *gin.Context) {
	userID, _ := c.Get("user_id")

	result, err := h.merchantUC.GetMerchantInfo(userID.(string))
	if err != nil {
		if err.Error() == "merchant account not found" {
			response.Err(c, http.StatusNotFound, err.Error())
			return
		}
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "ok", result)
}

// GET /api/v1/merchant/invoices
func (h *MerchantHandler) GetInvoices(c *gin.Context) {
	userID, _ := c.Get("user_id")

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	result, err := h.merchantUC.GetInvoices(userID.(string), limit, offset)
	if err != nil {
		if err.Error() == "merchant account not found" {
			response.Err(c, http.StatusNotFound, err.Error())
			return
		}
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "ok", result)
}

// POST /api/v1/merchant/invoice  (requires X-API-Key)
func (h *MerchantHandler) CreateInvoice(c *gin.Context) {
	merchantIDStr, _ := c.Get("merchant_id")

	merchantID, err := uuid.Parse(merchantIDStr.(string))
	if err != nil {
		response.Err(c, http.StatusInternalServerError, "invalid merchant id in context")
		return
	}

	var req dto.CreateInvoiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		response.Err(c, http.StatusBadRequest, err.Error())
		return
	}

	result, err := h.invoiceUC.CreateInvoice(merchantID, req)
	if err != nil {
		switch err.Error() {
		case "amount must be positive", "unsupported currency":
			response.Err(c, http.StatusBadRequest, err.Error())
		case "invoice with this order_id already exists for this merchant":
			response.Err(c, http.StatusConflict, err.Error())
		default:
			response.Err(c, http.StatusInternalServerError, err.Error())
		}
		return
	}

	response.OK(c, http.StatusCreated, "invoice created", result)
}

// POST /api/v1/invoices/:id/pay  (requires JWT)
func (h *MerchantHandler) PayInvoice(c *gin.Context) {
	userID, _ := c.Get("user_id")
	invoiceID := c.Param("id")

	// Body is optional (wallet_currency for future use), silently ignore bind errors
	var req dto.PayInvoiceRequest
	_ = c.ShouldBindJSON(&req)

	result, err := h.invoiceUC.PayInvoice(userID.(string), invoiceID)
	if err != nil {
		switch err.Error() {
		case "invoice not found":
			response.Err(c, http.StatusNotFound, err.Error())
		case "payer wallet not found":
			response.Err(c, http.StatusNotFound, err.Error())
		case "invoice has expired":
			response.Err(c, http.StatusGone, err.Error())
		case "cannot pay your own invoice":
			response.Err(c, http.StatusBadRequest, err.Error())
		default:
			// Check for status errors (invoice is paid/expired/failed)
			for _, s := range []domain.InvoiceStatus{
				domain.InvoiceStatusPaid, domain.InvoiceStatusExpired, domain.InvoiceStatusFailed,
			} {
				if err.Error() == "invoice is "+string(s)+" and cannot be paid" {
					response.Err(c, http.StatusConflict, err.Error())
					return
				}
			}
			// insufficient balance or other errors
			response.Err(c, http.StatusBadRequest, err.Error())
		}
		return
	}

	response.OK(c, http.StatusOK, "payment successful", result)
}

// GET /api/v1/invoices/:id/status  (public)
func (h *MerchantHandler) GetInvoiceStatus(c *gin.Context) {
	invoiceID := c.Param("id")

	result, err := h.invoiceUC.GetInvoiceStatus(invoiceID)
	if err != nil {
		if err.Error() == "invoice not found" {
			response.Err(c, http.StatusNotFound, err.Error())
			return
		}
		response.Err(c, http.StatusInternalServerError, err.Error())
		return
	}

	response.OK(c, http.StatusOK, "ok", result)
}
