package dto

import (
	"time"

	"github.com/shopspring/decimal"
)

type TransferRequest struct {
	ToEmail     string          `json:"to_email" binding:"required,email"`
	Currency    string          `json:"currency" binding:"required"`
	Amount      decimal.Decimal `json:"amount" binding:"required"`
	Description string          `json:"description"`
}

type TransactionResponse struct {
	ID                  string          `json:"id"`
	Type                string          `json:"type"`
	Status              string          `json:"status"`
	Amount              decimal.Decimal `json:"amount"`
	Fee                 decimal.Decimal `json:"fee"`
	Currency            string          `json:"currency"`
	Description         string          `json:"description"`
	CounterpartWalletID string          `json:"counterpart_wallet_id,omitempty"`
	CreatedAt           time.Time       `json:"created_at"`
}

type TransactionListResponse struct {
	Total  int                   `json:"total"`
	Limit  int                   `json:"limit"`
	Offset int                   `json:"offset"`
	Items  []TransactionResponse `json:"items"`
}