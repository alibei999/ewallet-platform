package repository

import (
	"database/sql"
	"errors"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type WalletRepository struct {
	db *sql.DB
}

func NewWalletRepository(db *sql.DB) *WalletRepository {
	return &WalletRepository{db: db}
}

func (r *WalletRepository) CreateWallet(userID uuid.UUID) (*domain.Wallet, error) {
	wallet := &domain.Wallet{
		ID:       uuid.New(),
		UserID:   userID,
		IsActive: true,
	}

	tx, err := r.db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		INSERT INTO wallets (id, user_id, is_active)
		VALUES ($1, $2, $3)
	`, wallet.ID, wallet.UserID, wallet.IsActive)
	if err != nil {
		return nil, err
	}

	// Create zero balances for all currencies
	for _, currency := range domain.SupportedCurrencies {
		_, err = tx.Exec(`
			INSERT INTO wallet_balances (id, wallet_id, currency, amount, frozen)
			VALUES ($1, $2, $3, $4, $5)
		`, uuid.New(), wallet.ID, currency, decimal.Zero, decimal.Zero)
		if err != nil {
			return nil, err
		}
	}

	return wallet, tx.Commit()
}

func (r *WalletRepository) GetWalletByUserID(userID uuid.UUID) (*domain.Wallet, error) {
	wallet := &domain.Wallet{}
	err := r.db.QueryRow(`
		SELECT id, user_id, is_active, created_at, updated_at
		FROM wallets WHERE user_id = $1
	`, userID).Scan(&wallet.ID, &wallet.UserID, &wallet.IsActive, &wallet.CreatedAt, &wallet.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return wallet, err
}

func (r *WalletRepository) GetWalletByID(walletID uuid.UUID) (*domain.Wallet, error) {
	wallet := &domain.Wallet{}
	err := r.db.QueryRow(`
		SELECT id, user_id, is_active, created_at, updated_at
		FROM wallets WHERE id = $1
	`, walletID).Scan(&wallet.ID, &wallet.UserID, &wallet.IsActive, &wallet.CreatedAt, &wallet.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return wallet, err
}

func (r *WalletRepository) GetBalances(walletID uuid.UUID) ([]domain.WalletBalance, error) {
	rows, err := r.db.Query(`
		SELECT id, wallet_id, currency, amount, frozen, updated_at
		FROM wallet_balances WHERE wallet_id = $1
		ORDER BY currency
	`, walletID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var balances []domain.WalletBalance
	for rows.Next() {
		var b domain.WalletBalance
		if err := rows.Scan(&b.ID, &b.WalletID, &b.Currency, &b.Balance, &b.FrozenAmount, &b.UpdatedAt); err != nil {
			return nil, err
		}
		balances = append(balances, b)
	}
	return balances, nil
}

func (r *WalletRepository) GetBalance(walletID uuid.UUID, currency domain.Currency) (*domain.WalletBalance, error) {
	b := &domain.WalletBalance{}
	err := r.db.QueryRow(`
		SELECT id, wallet_id, currency, amount, frozen, updated_at
		FROM wallet_balances WHERE wallet_id = $1 AND currency = $2
	`, walletID, currency).Scan(&b.ID, &b.WalletID, &b.Currency, &b.Balance, &b.FrozenAmount, &b.UpdatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return b, err
}

func (r *WalletRepository) UpdateBalance(tx *sql.Tx, walletID uuid.UUID, currency domain.Currency, amount decimal.Decimal) error {
	_, err := tx.Exec(`
		UPDATE wallet_balances
		SET amount = amount + $1, updated_at = NOW()
		WHERE wallet_id = $2 AND currency = $3
	`, amount, walletID, currency)
	return err
}

func (r *WalletRepository) GetDB() *sql.DB {
	return r.db
}

// AddBalance — adds amount to wallet balance (used in deposit)
func (r *WalletRepository) AddBalance(walletID uuid.UUID, currency domain.Currency, amount decimal.Decimal) error {
	_, err := r.db.Exec(`
		UPDATE wallet_balances
		SET amount = amount + $1, updated_at = NOW()
		WHERE wallet_id = $2 AND currency = $3
	`, amount, walletID, currency)
	return err
}

// SubtractBalance — deducts amount, fails if insufficient
func (r *WalletRepository) SubtractBalance(walletID uuid.UUID, currency domain.Currency, amount decimal.Decimal) error {
	result, err := r.db.Exec(`
		UPDATE wallet_balances
		SET amount = amount - $1, updated_at = NOW()
		WHERE wallet_id = $2
		  AND currency = $3
		  AND amount >= $1
	`, amount, walletID, currency)
	if err != nil {
		return err
	}
	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rows == 0 {
		return errors.New("insufficient balance or currency not found")
	}
	return nil
}

// GetByUserID — alias used by deposit/withdraw usecases
func (r *WalletRepository) GetByUserID(userID uuid.UUID) (*domain.Wallet, error) {
	return r.GetWalletByUserID(userID)
}