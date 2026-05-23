package repository

import (
	"database/sql"
	"errors"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/google/uuid"
)

type MerchantRepository struct {
	db *sql.DB
}

func NewMerchantRepository(db *sql.DB) *MerchantRepository {
	return &MerchantRepository{db: db}
}

func (r *MerchantRepository) Create(m *domain.Merchant) error {
	_, err := r.db.Exec(`
		INSERT INTO merchants (id, user_id, business_name, api_key, webhook_url, is_active)
		VALUES ($1, $2, $3, $4, $5, $6)
	`, m.ID, m.UserID, m.BusinessName, m.APIKey, m.WebhookURL, m.IsActive)
	if err != nil {
		return err
	}
	return r.db.QueryRow(`SELECT created_at FROM merchants WHERE id = $1`, m.ID).Scan(&m.CreatedAt)
}

func (r *MerchantRepository) GetByID(id uuid.UUID) (*domain.Merchant, error) {
	m := &domain.Merchant{}
	err := r.db.QueryRow(`
		SELECT id, user_id, business_name, api_key, webhook_url, is_active, created_at
		FROM merchants WHERE id = $1
	`, id).Scan(&m.ID, &m.UserID, &m.BusinessName, &m.APIKey, &m.WebhookURL, &m.IsActive, &m.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return m, err
}

func (r *MerchantRepository) GetByAPIKey(apiKey string) (*domain.Merchant, error) {
	m := &domain.Merchant{}
	err := r.db.QueryRow(`
		SELECT id, user_id, business_name, api_key, webhook_url, is_active, created_at
		FROM merchants WHERE api_key = $1 AND is_active = true
	`, apiKey).Scan(&m.ID, &m.UserID, &m.BusinessName, &m.APIKey, &m.WebhookURL, &m.IsActive, &m.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return m, err
}

func (r *MerchantRepository) GetByUserID(userID uuid.UUID) (*domain.Merchant, error) {
	m := &domain.Merchant{}
	err := r.db.QueryRow(`
		SELECT id, user_id, business_name, api_key, webhook_url, is_active, created_at
		FROM merchants WHERE user_id = $1
	`, userID).Scan(&m.ID, &m.UserID, &m.BusinessName, &m.APIKey, &m.WebhookURL, &m.IsActive, &m.CreatedAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return m, err
}
