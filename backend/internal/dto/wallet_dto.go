package dto

import "github.com/shopspring/decimal"

type WalletResponse struct {
	ID       string            `json:"id"`
	UserID   string            `json:"user_id"`
	IsActive bool              `json:"is_active"`
	Balances []BalanceResponse `json:"balances"`
}

type BalanceResponse struct {
	Currency     string          `json:"currency"`
	Balance      decimal.Decimal `json:"balance"`
	FrozenAmount decimal.Decimal `json:"frozen_amount"`
}

type DepositRequest struct {
	Currency string          `json:"currency" binding:"required"`
	Amount   decimal.Decimal `json:"amount" binding:"required"`
}