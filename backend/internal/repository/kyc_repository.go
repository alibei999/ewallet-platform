package repository

import (
	"database/sql"
	"errors"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/google/uuid"
)

type KYCRepository struct {
	db *sql.DB
}

func NewKYCRepository(db *sql.DB) *KYCRepository {
	return &KYCRepository{db: db}
}

func (r *KYCRepository) Create(kyc *domain.KYCRequest) error {
	err := r.db.QueryRow(`
		INSERT INTO kyc_requests
			(id, user_id, full_name, birth_date, id_number, photo_url, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at
	`,
		kyc.ID,
		kyc.UserID,
		kyc.FullName,
		kyc.BirthDate,
		kyc.IDNumber,
		kyc.PhotoURL,
		kyc.Status,
	).Scan(&kyc.CreatedAt)
	return err
}

func (r *KYCRepository) GetByUserID(userID uuid.UUID) (*domain.KYCRequest, error) {
	kyc := &domain.KYCRequest{}
	var rejectReason sql.NullString
	err := r.db.QueryRow(`
		SELECT id, user_id, full_name, birth_date, id_number, photo_url,
		       status, reject_reason, reviewed_by, reviewed_at, created_at, updated_at
		FROM kyc_requests
		WHERE user_id = $1
		ORDER BY created_at DESC
		LIMIT 1
	`, userID).Scan(
		&kyc.ID, &kyc.UserID, &kyc.FullName, &kyc.BirthDate,
		&kyc.IDNumber, &kyc.PhotoURL, &kyc.Status, &rejectReason,
		&kyc.ReviewedBy, &kyc.ReviewedAt, &kyc.CreatedAt, &kyc.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	kyc.RejectReason = rejectReason.String
	return kyc, nil
}

func (r *KYCRepository) GetByID(id uuid.UUID) (*domain.KYCRequest, error) {
	kyc := &domain.KYCRequest{}
	var rejectReason sql.NullString
	err := r.db.QueryRow(`
		SELECT id, user_id, full_name, birth_date, id_number, photo_url,
		       status, reject_reason, reviewed_by, reviewed_at, created_at, updated_at
		FROM kyc_requests
		WHERE id = $1
	`, id).Scan(
		&kyc.ID, &kyc.UserID, &kyc.FullName, &kyc.BirthDate,
		&kyc.IDNumber, &kyc.PhotoURL, &kyc.Status, &rejectReason,
		&kyc.ReviewedBy, &kyc.ReviewedAt, &kyc.CreatedAt, &kyc.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	kyc.RejectReason = rejectReason.String
	return kyc, nil
}

func (r *KYCRepository) UpdateStatus(
	id uuid.UUID,
	status domain.KYCStatus,
	rejectReason string,
	reviewedBy uuid.UUID,
) error {
	_, err := r.db.Exec(`
		UPDATE kyc_requests
		SET status = $1,
		    reject_reason = $2,
		    reviewed_by = $3,
		    reviewed_at = NOW(),
		    updated_at = NOW()
		WHERE id = $4
	`, status, rejectReason, reviewedBy, id)
	return err
}

func (r *KYCRepository) GetAllPending() ([]domain.KYCRequest, error) {
	rows, err := r.db.Query(`
		SELECT id, user_id, full_name, birth_date, id_number, photo_url,
		       status, reject_reason, reviewed_by, reviewed_at, created_at, updated_at
		FROM kyc_requests
		WHERE status = 'pending'
		ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []domain.KYCRequest
	for rows.Next() {
		var kyc domain.KYCRequest
		var rejectReason sql.NullString
		if err := rows.Scan(
			&kyc.ID, &kyc.UserID, &kyc.FullName, &kyc.BirthDate,
			&kyc.IDNumber, &kyc.PhotoURL, &kyc.Status, &rejectReason,
			&kyc.ReviewedBy, &kyc.ReviewedAt, &kyc.CreatedAt, &kyc.UpdatedAt,
		); err != nil {
			return nil, err
		}
		kyc.RejectReason = rejectReason.String
		list = append(list, kyc)
	}
	return list, nil
}