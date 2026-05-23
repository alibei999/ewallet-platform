package dto

import "time"

type KYCSubmitRequest struct {
	FullName  string `json:"full_name" binding:"required"`
	BirthDate string `json:"birth_date" binding:"required"` // format: 2006-01-02
	IDNumber  string `json:"id_number" binding:"required"`
	PhotoURL  string `json:"photo_url"`
}

type KYCResponse struct {
	ID           string     `json:"id"`
	UserID       string     `json:"user_id"`
	FullName     string     `json:"full_name"`
	BirthDate    string     `json:"birth_date"`
	IDNumber     string     `json:"id_number"`
	PhotoURL     string     `json:"photo_url"`
	Status       string     `json:"status"`
	RejectReason string     `json:"reject_reason,omitempty"`
	ReviewedAt   *time.Time `json:"reviewed_at,omitempty"`
	CreatedAt    time.Time  `json:"created_at"`
}

type KYCReviewRequest struct {
	Status       string `json:"status" binding:"required,oneof=approved rejected"`
	RejectReason string `json:"reject_reason"`
}