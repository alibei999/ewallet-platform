package dto

import (
	"time"

	"github.com/shopspring/decimal"
)

type RegisterMerchantRequest struct {
	BusinessName string `json:"business_name" binding:"required"`
	WebhookURL   string `json:"webhook_url"`
}

type RegisterMerchantResponse struct {
	ID           string `json:"id"`
	BusinessName string `json:"business_name"`
	APIKey       string `json:"api_key"`
	WebhookURL   string `json:"webhook_url"`
	CreatedAt    time.Time `json:"created_at"`
}

type MerchantInfoResponse struct {
	ID           string    `json:"id"`
	BusinessName string    `json:"business_name"`
	WebhookURL   string    `json:"webhook_url"`
	IsActive     bool      `json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
}

type CreateInvoiceRequest struct {
	OrderID          string          `json:"order_id" binding:"required"`
	Amount           decimal.Decimal `json:"amount" binding:"required"`
	Currency         string          `json:"currency" binding:"required"`
	Description      string          `json:"description"`
	ExpiresInMinutes int             `json:"expires_in_minutes" binding:"required,min=1"`
}

type CreateInvoiceResponse struct {
	ID         string          `json:"id"`
	OrderID    string          `json:"order_id"`
	Amount     decimal.Decimal `json:"amount"`
	Currency   string          `json:"currency"`
	Status     string          `json:"status"`
	PaymentURL string          `json:"payment_url"`
	ExpiresAt  time.Time       `json:"expires_at"`
}

type PayInvoiceRequest struct {
	WalletCurrency string `json:"wallet_currency"`
}

type PayInvoiceResponse struct {
	InvoiceID     string          `json:"invoice_id"`
	TransactionID string          `json:"transaction_id"`
	Amount        decimal.Decimal `json:"amount"`
	Fee           decimal.Decimal `json:"fee"`
	Currency      string          `json:"currency"`
	Status        string          `json:"status"`
}

type InvoiceStatusResponse struct {
	ID       string          `json:"id"`
	OrderID  string          `json:"order_id"`
	Status   string          `json:"status"`
	Amount   decimal.Decimal `json:"amount"`
	Currency string          `json:"currency"`
	PaidAt   *time.Time      `json:"paid_at,omitempty"`
}

type InvoiceListResponse struct {
	Invoices []InvoiceStatusResponse `json:"invoices"`
	Total    int                     `json:"total"`
	Limit    int                     `json:"limit"`
	Offset   int                     `json:"offset"`
}

// webhookPayloadSigned is used to compute the HMAC signature (no signature field).
type WebhookPayloadSigned struct {
	Event         string          `json:"event"`
	InvoiceID     string          `json:"invoice_id"`
	OrderID       string          `json:"order_id"`
	Amount        decimal.Decimal `json:"amount"`
	Currency      string          `json:"currency"`
	Status        string          `json:"status"`
	TransactionID string          `json:"transaction_id"`
	Timestamp     int64           `json:"timestamp"`
}

type WebhookPayload struct {
	Event         string          `json:"event"`
	InvoiceID     string          `json:"invoice_id"`
	OrderID       string          `json:"order_id"`
	Amount        decimal.Decimal `json:"amount"`
	Currency      string          `json:"currency"`
	Status        string          `json:"status"`
	TransactionID string          `json:"transaction_id"`
	Timestamp     int64           `json:"timestamp"`
	Signature     string          `json:"signature"`
}
