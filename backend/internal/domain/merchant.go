package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type InvoiceStatus string

const (
	InvoiceStatusPending InvoiceStatus = "pending"
	InvoiceStatusPaid    InvoiceStatus = "paid"
	InvoiceStatusExpired InvoiceStatus = "expired"
	InvoiceStatusFailed  InvoiceStatus = "failed"
)

type Merchant struct {
	ID           uuid.UUID `db:"id"`
	UserID       uuid.UUID `db:"user_id"`
	BusinessName string    `db:"business_name"`
	APIKey       string    `db:"api_key"`
	WebhookURL   string    `db:"webhook_url"`
	IsActive     bool      `db:"is_active"`
	CreatedAt    time.Time `db:"created_at"`
}

type Invoice struct {
	ID            uuid.UUID       `db:"id"`
	MerchantID    uuid.UUID       `db:"merchant_id"`
	OrderID       string          `db:"order_id"`
	Amount        decimal.Decimal `db:"amount"`
	Currency      Currency        `db:"currency"`
	Status        InvoiceStatus   `db:"status"`
	Description   string          `db:"description"`
	PayerWalletID *uuid.UUID      `db:"payer_wallet_id"`
	PaidAt        *time.Time      `db:"paid_at"`
	ExpiresAt     time.Time       `db:"expires_at"`
	CreatedAt     time.Time       `db:"created_at"`
}

type WebhookLog struct {
	ID         uuid.UUID `db:"id"`
	InvoiceID  uuid.UUID `db:"invoice_id"`
	MerchantID uuid.UUID `db:"merchant_id"`
	URL        string    `db:"url"`
	Payload    string    `db:"payload"`
	StatusCode *int      `db:"status_code"`
	Response   string    `db:"response"`
	Attempt    int       `db:"attempt"`
	SentAt     time.Time `db:"sent_at"`
}
