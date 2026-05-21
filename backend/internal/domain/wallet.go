package domain

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type Currency string

const (
	CurrencyKZT Currency = "KZT"
	CurrencyUSD Currency = "USD"
	CurrencyEUR Currency = "EUR"
	CurrencyRUB Currency = "RUB"
)

var SupportedCurrencies = []Currency{CurrencyKZT, CurrencyUSD, CurrencyEUR, CurrencyRUB}

type Wallet struct {
	ID        uuid.UUID `db:"id"`
	UserID    uuid.UUID `db:"user_id"`
	IsActive  bool      `db:"is_active"`
	CreatedAt time.Time `db:"created_at"`
	UpdatedAt time.Time `db:"updated_at"`
}

type WalletBalance struct {
	ID           uuid.UUID       `db:"id"`
	WalletID     uuid.UUID       `db:"wallet_id"`
	Currency     Currency        `db:"currency"`
	Balance      decimal.Decimal `db:"balance"`
	FrozenAmount decimal.Decimal `db:"frozen_amount"`
	UpdatedAt    time.Time       `db:"updated_at"`
}