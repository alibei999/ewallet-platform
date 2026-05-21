package domain

import (
	"time"

	"github.com/google/uuid"
)

type UserRole string

const (
	RoleUser     UserRole = "user"
	RoleMerchant UserRole = "merchant"
	RoleAdmin    UserRole = "admin"
)

type User struct {
	ID           uuid.UUID `db:"id"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	FirstName    string    `db:"first_name"`
	LastName     string    `db:"last_name"`
	Phone        *string   `db:"phone"`
	Role         UserRole  `db:"role"`
	IsActive     bool      `db:"is_active"`
	IsVerified   bool      `db:"is_verified"`
	CreatedAt    time.Time `db:"created_at"`
	UpdatedAt    time.Time `db:"updated_at"`
}

type RefreshToken struct {
	ID        uuid.UUID `db:"id"`
	UserID    uuid.UUID `db:"user_id"`
	TokenHash string    `db:"token_hash"`
	ExpiresAt time.Time `db:"expires_at"`
	IsRevoked bool      `db:"is_revoked"`
	CreatedAt time.Time `db:"created_at"`
}