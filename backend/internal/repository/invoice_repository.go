package repository

import (
	"database/sql"
	"errors"
	"time"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/google/uuid"
)

type InvoiceRepository struct {
	db *sql.DB
}

func NewInvoiceRepository(db *sql.DB) *InvoiceRepository {
	return &InvoiceRepository{db: db}
}

func (r *InvoiceRepository) GetDB() *sql.DB {
	return r.db
}

func (r *InvoiceRepository) Create(inv *domain.Invoice) error {
	_, err := r.db.Exec(`
		INSERT INTO invoices (id, merchant_id, order_id, amount, currency, status, description, expires_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
	`, inv.ID, inv.MerchantID, inv.OrderID, inv.Amount, string(inv.Currency),
		string(inv.Status), inv.Description, inv.ExpiresAt)
	if err != nil {
		return err
	}
	return r.db.QueryRow(`SELECT created_at FROM invoices WHERE id = $1`, inv.ID).Scan(&inv.CreatedAt)
}

func (r *InvoiceRepository) GetByID(id uuid.UUID) (*domain.Invoice, error) {
	inv := &domain.Invoice{}
	err := r.db.QueryRow(`
		SELECT id, merchant_id, order_id, amount, currency, status, description,
		       payer_wallet_id, paid_at, expires_at, created_at
		FROM invoices WHERE id = $1
	`, id).Scan(
		&inv.ID, &inv.MerchantID, &inv.OrderID, &inv.Amount, &inv.Currency,
		&inv.Status, &inv.Description, &inv.PayerWalletID, &inv.PaidAt,
		&inv.ExpiresAt, &inv.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return inv, err
}

func (r *InvoiceRepository) GetByOrderID(merchantID uuid.UUID, orderID string) (*domain.Invoice, error) {
	inv := &domain.Invoice{}
	err := r.db.QueryRow(`
		SELECT id, merchant_id, order_id, amount, currency, status, description,
		       payer_wallet_id, paid_at, expires_at, created_at
		FROM invoices WHERE merchant_id = $1 AND order_id = $2
	`, merchantID, orderID).Scan(
		&inv.ID, &inv.MerchantID, &inv.OrderID, &inv.Amount, &inv.Currency,
		&inv.Status, &inv.Description, &inv.PayerWalletID, &inv.PaidAt,
		&inv.ExpiresAt, &inv.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return inv, err
}

// UpdateStatusTx updates invoice status inside an existing SQL transaction.
func (r *InvoiceRepository) UpdateStatusTx(
	tx *sql.Tx,
	id uuid.UUID,
	status domain.InvoiceStatus,
	payerWalletID *uuid.UUID,
) error {
	now := time.Now()
	_, err := tx.Exec(`
		UPDATE invoices
		SET status = $1, payer_wallet_id = $2, paid_at = $3
		WHERE id = $4
	`, string(status), payerWalletID, now, id)
	return err
}

// UpdateStatus updates invoice status without a transaction (e.g., marking expired).
func (r *InvoiceRepository) UpdateStatus(
	id uuid.UUID,
	status domain.InvoiceStatus,
) error {
	_, err := r.db.Exec(`
		UPDATE invoices SET status = $1 WHERE id = $2
	`, string(status), id)
	return err
}

func (r *InvoiceRepository) GetByMerchantID(merchantID uuid.UUID, limit, offset int) ([]domain.Invoice, int, error) {
	var total int
	if err := r.db.QueryRow(
		`SELECT COUNT(*) FROM invoices WHERE merchant_id = $1`, merchantID,
	).Scan(&total); err != nil {
		return nil, 0, err
	}

	rows, err := r.db.Query(`
		SELECT id, merchant_id, order_id, amount, currency, status, description,
		       payer_wallet_id, paid_at, expires_at, created_at
		FROM invoices WHERE merchant_id = $1
		ORDER BY created_at DESC
		LIMIT $2 OFFSET $3
	`, merchantID, limit, offset)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var invoices []domain.Invoice
	for rows.Next() {
		var inv domain.Invoice
		if err := rows.Scan(
			&inv.ID, &inv.MerchantID, &inv.OrderID, &inv.Amount, &inv.Currency,
			&inv.Status, &inv.Description, &inv.PayerWalletID, &inv.PaidAt,
			&inv.ExpiresAt, &inv.CreatedAt,
		); err != nil {
			return nil, 0, err
		}
		invoices = append(invoices, inv)
	}
	return invoices, total, nil
}

func (r *InvoiceRepository) CreateWebhookLog(log *domain.WebhookLog) error {
	_, err := r.db.Exec(`
		INSERT INTO webhook_logs (id, invoice_id, merchant_id, url, payload, status_code, response, attempt)
		VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)
	`, log.ID, log.InvoiceID, log.MerchantID, log.URL,
		log.Payload, log.StatusCode, log.Response, log.Attempt)
	return err
}
