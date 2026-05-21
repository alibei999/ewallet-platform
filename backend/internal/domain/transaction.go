package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type TransactionType string
type TransactionStatus string

const (
	TransactionTypeTransfer         TransactionType = "transfer"
	TransactionTypeDeposit          TransactionType = "deposit"
	TransactionTypeWithdrawal       TransactionType = "withdrawal"
	TransactionTypePayment          TransactionType = "payment"
	TransactionTypeCryptoDeposit    TransactionType = "crypto_deposit"
	TransactionTypeCryptoWithdrawal TransactionType = "crypto_withdrawal"
	TransactionTypeRefund           TransactionType = "refund"
)

const (
	TransactionStatusPending   TransactionStatus = "pending"
	TransactionStatusSuccess   TransactionStatus = "success"
	TransactionStatusFailed    TransactionStatus = "failed"
	TransactionStatusCancelled TransactionStatus = "cancelled"
)

type Transaction struct {
	ID                  uuid.UUID         `db:"id"`
	WalletID            uuid.UUID         `db:"wallet_id"`
	CounterpartWalletID *uuid.UUID        `db:"counterpart_wallet_id"`
	Type                TransactionType   `db:"type"`
	Status              TransactionStatus `db:"status"`
	Amount              decimal.Decimal   `db:"amount"`
	Fee                 decimal.Decimal   `db:"fee"`
	Currency            Currency          `db:"currency"`
	Description         string            `db:"description"`
	ReferenceID         string            `db:"reference_id"`
	CreatedAt           time.Time         `db:"created_at"`
	UpdatedAt           time.Time         `db:"updated_at"`
}

type TransactionLog struct {
	ID            uuid.UUID `db:"id"`
	TransactionID uuid.UUID `db:"transaction_id"`
	Status        string    `db:"status"`
	Message       string    `db:"message"`
	CreatedAt     time.Time `db:"created_at"`
}