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
	Amount     decimal.Decimal `json:"amount" binding:"required"`
	Currency   string          `json:"currency" binding:"required,oneof=KZT USD EUR RUB"`
	CardNumber string          `json:"card_number"`
}

type WithdrawRequest struct {
	Amount      decimal.Decimal `json:"amount" binding:"required"`
	Currency    string          `json:"currency" binding:"required,oneof=KZT USD EUR RUB"`
	CardNumber  string          `json:"card_number"`
	Description string          `json:"description"`
}