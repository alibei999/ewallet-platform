package repository

import (
	"database/sql"
	"fmt"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type TransactionRepository struct {
	db *sql.DB
}

func NewTransactionRepository(db *sql.DB) *TransactionRepository {
	return &TransactionRepository{db: db}
}

func (r *TransactionRepository) GetDB() *sql.DB {
	return r.db
}

func (r *TransactionRepository) CreateTransaction(
	tx *sql.Tx,
	walletID uuid.UUID,
	counterpartWalletID *uuid.UUID,
	txType domain.TransactionType,
	status domain.TransactionStatus,
	amount decimal.Decimal,
	fee decimal.Decimal,
	currency domain.Currency,
	description string,
) (*domain.Transaction, error) {
	t := &domain.Transaction{
		ID:                  uuid.New(),
		WalletID:            walletID,
		CounterpartWalletID: counterpartWalletID,
		Type:                txType,
		Status:              status,
		Amount:              amount,
		Fee:                 fee,
		Currency:            currency,
		Description:         description,
		ReferenceID:         uuid.New().String(),
	}

	_, err := tx.Exec(`
		INSERT INTO transactions 
			(id, wallet_id, counterpart_wallet_id, type, status, amount, fee, currency, description, reference_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`,
		t.ID,
		t.WalletID,
		t.CounterpartWalletID,
		t.Type,
		t.Status,
		t.Amount,
		t.Fee,
		t.Currency,
		t.Description,
		t.ReferenceID,
	)
	if err != nil {
		return nil, err
	}

	// Fetch created_at from DB after insert
	err = tx.QueryRow(`SELECT created_at FROM transactions WHERE id = $1`, t.ID).Scan(&t.CreatedAt)
	if err != nil {
		return nil, err
	}

	return t, nil
}

func (r *TransactionRepository) CreateLog(
	tx *sql.Tx,
	transactionID uuid.UUID,
	status string,
	message string,
) error {
	_, err := tx.Exec(`
		INSERT INTO transaction_logs (id, transaction_id, status, message)
		VALUES ($1, $2, $3, $4)
	`, uuid.New(), transactionID, status, message)
	return err
}

func (r *TransactionRepository) UpdateTransactionStatus(
	tx *sql.Tx,
	transactionID uuid.UUID,
	status domain.TransactionStatus,
) error {
	_, err := tx.Exec(`
		UPDATE transactions SET status = $1, updated_at = NOW()
		WHERE id = $2
	`, status, transactionID)
	return err
}

func (r *TransactionRepository) GetTransactionsByWalletID(walletID uuid.UUID) ([]domain.Transaction, error) {
	rows, err := r.db.Query(`
		SELECT id, wallet_id, counterpart_wallet_id, type, status,
		       amount, fee, currency, description, reference_id, created_at, updated_at
		FROM transactions
		WHERE wallet_id = $1
		ORDER BY created_at DESC
		LIMIT 100
	`, walletID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var txs []domain.Transaction
	for rows.Next() {
		var t domain.Transaction
		if err := rows.Scan(
			&t.ID, &t.WalletID, &t.CounterpartWalletID,
			&t.Type, &t.Status, &t.Amount, &t.Fee,
			&t.Currency, &t.Description, &t.ReferenceID,
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, err
		}
		txs = append(txs, t)
	}
	return txs, nil
}

// CreateWithDB — creates transaction without external sql.Tx (for deposit/withdraw)
func (r *TransactionRepository) CreateWithDB(t *domain.Transaction) error {
	_, err := r.db.Exec(`
		INSERT INTO transactions 
			(id, wallet_id, counterpart_wallet_id, type, status, amount, fee, currency, description, reference_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
	`,
		t.ID,
		t.WalletID,
		t.CounterpartWalletID,
		string(t.Type),
		string(t.Status),
		t.Amount,
		t.Fee,
		string(t.Currency),
		t.Description,
		t.ReferenceID,
	)
	if err != nil {
		return err
	}

	return r.db.QueryRow(`SELECT created_at FROM transactions WHERE id = $1`, t.ID).Scan(&t.CreatedAt)
}

// GetByUserWallet — транзакции пользователя с фильтрами и пагинацией
func (r *TransactionRepository) GetByUserWallet(
	walletID uuid.UUID,
	txType string,
	status string,
	limit int,
	offset int,
) ([]domain.Transaction, int, error) {
	query := `
		SELECT id, wallet_id, counterpart_wallet_id, type, status,
		       amount, fee, currency, description, reference_id, created_at, updated_at
		FROM transactions
		WHERE wallet_id = $1
	`
	countQuery := `SELECT COUNT(*) FROM transactions WHERE wallet_id = $1`
	args := []interface{}{walletID}
	argIdx := 2

	if txType != "" {
		query += fmt.Sprintf(" AND type = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND type = $%d", argIdx)
		args = append(args, txType)
		argIdx++
	}
	if status != "" {
		query += fmt.Sprintf(" AND status = $%d", argIdx)
		countQuery += fmt.Sprintf(" AND status = $%d", argIdx)
		args = append(args, status)
		argIdx++
	}

	query += fmt.Sprintf(" ORDER BY created_at DESC LIMIT $%d OFFSET $%d", argIdx, argIdx+1)
	args = append(args, limit, offset)

	var total int
	if err := r.db.QueryRow(countQuery, args[:argIdx-1]...).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var txs []domain.Transaction
	for rows.Next() {
		var t domain.Transaction
		if err := rows.Scan(
			&t.ID, &t.WalletID, &t.CounterpartWalletID,
			&t.Type, &t.Status, &t.Amount, &t.Fee,
			&t.Currency, &t.Description, &t.ReferenceID,
			&t.CreatedAt, &t.UpdatedAt,
		); err != nil {
			return nil, 0, err
		}
		txs = append(txs, t)
	}
	return txs, total, nil
}

// GetByID — одна транзакция по ID
func (r *TransactionRepository) GetByID(id uuid.UUID) (*domain.Transaction, error) {
	t := &domain.Transaction{}
	err := r.db.QueryRow(`
		SELECT id, wallet_id, counterpart_wallet_id, type, status,
		       amount, fee, currency, description, reference_id, created_at, updated_at
		FROM transactions WHERE id = $1
	`, id).Scan(
		&t.ID, &t.WalletID, &t.CounterpartWalletID,
		&t.Type, &t.Status, &t.Amount, &t.Fee,
		&t.Currency, &t.Description, &t.ReferenceID,
		&t.CreatedAt, &t.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return t, err
}