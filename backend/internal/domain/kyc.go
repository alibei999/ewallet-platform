package domain

import (
	"time"

	"github.com/google/uuid"
)

type KYCStatus string

const (
	KYCStatusPending  KYCStatus = "pending"
	KYCStatusApproved KYCStatus = "approved"
	KYCStatusRejected KYCStatus = "rejected"
)

type KYCRequest struct {
	ID           uuid.UUID  `db:"id"`
	UserID       uuid.UUID  `db:"user_id"`
	FullName     string     `db:"full_name"`
	BirthDate    string     `db:"birth_date"`
	IDNumber     string     `db:"id_number"`
	PhotoURL     string     `db:"photo_url"`
	Status       KYCStatus  `db:"status"`
	RejectReason string     `db:"reject_reason"`
	ReviewedBy   *uuid.UUID `db:"reviewed_by"`
	ReviewedAt   *time.Time `db:"reviewed_at"`
	CreatedAt    time.Time  `db:"created_at"`
	UpdatedAt    time.Time  `db:"updated_at"`
}