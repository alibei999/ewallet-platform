package repository

import (
	"crypto/sha256"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/google/uuid"
)

type AuthRepository struct {
	db *sql.DB
}

func NewAuthRepository(db *sql.DB) *AuthRepository {
	return &AuthRepository{db: db}
}

func (r *AuthRepository) CreateUser(user *domain.User) error {
	query := `
		INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, is_verified)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
	`
	_, err := r.db.Exec(query,
		user.ID, user.Email, user.PasswordHash,
		user.FirstName, user.LastName, user.Phone,
		user.Role, user.IsActive, user.IsVerified,
	)
	return err
}

func (r *AuthRepository) GetUserByEmail(email string) (*domain.User, error) {
	user := &domain.User{}
	query := `
		SELECT id, email, password_hash, first_name, last_name, phone,
		       role, is_active, is_verified, created_at, updated_at
		FROM users WHERE email = $1
	`
	err := r.db.QueryRow(query, email).Scan(
		&user.ID, &user.Email, &user.PasswordHash,
		&user.FirstName, &user.LastName, &user.Phone,
		&user.Role, &user.IsActive, &user.IsVerified,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return user, err
}

func (r *AuthRepository) GetUserByID(id uuid.UUID) (*domain.User, error) {
	user := &domain.User{}
	query := `
		SELECT id, email, password_hash, first_name, last_name, phone,
		       role, is_active, is_verified, created_at, updated_at
		FROM users WHERE id = $1
	`
	err := r.db.QueryRow(query, id).Scan(
		&user.ID, &user.Email, &user.PasswordHash,
		&user.FirstName, &user.LastName, &user.Phone,
		&user.Role, &user.IsActive, &user.IsVerified,
		&user.CreatedAt, &user.UpdatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return user, err
}

func (r *AuthRepository) SaveRefreshToken(userID uuid.UUID, tokenHash string, expiresAt time.Time) error {
	query := `
		INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
		VALUES ($1, $2, $3, $4)
	`
	_, err := r.db.Exec(query, uuid.New(), userID, tokenHash, expiresAt)
	return err
}

func (r *AuthRepository) GetRefreshToken(tokenHash string) (*domain.RefreshToken, error) {
	rt := &domain.RefreshToken{}
	query := `
		SELECT id, user_id, token_hash, expires_at, is_revoked, created_at
		FROM refresh_tokens WHERE token_hash = $1
	`
	err := r.db.QueryRow(query, tokenHash).Scan(
		&rt.ID, &rt.UserID, &rt.TokenHash,
		&rt.ExpiresAt, &rt.IsRevoked, &rt.CreatedAt,
	)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, nil
	}
	return rt, err
}

func (r *AuthRepository) RevokeRefreshToken(tokenHash string) error {
	query := `UPDATE refresh_tokens SET is_revoked = true WHERE token_hash = $1`
	_, err := r.db.Exec(query, tokenHash)
	return err
}

func (r *AuthRepository) RevokeAllUserTokens(userID uuid.UUID) error {
	query := `UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1`
	_, err := r.db.Exec(query, userID)
	return err
}

// HashToken creates SHA-256 hash of the refresh token for secure storage
func HashToken(token string) (string, error) {
	hash := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", hash), nil
}

func CheckTokenHash(token, hashStr string) bool {
	h := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", h) == hashStr
}
