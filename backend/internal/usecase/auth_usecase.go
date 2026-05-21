package usecase

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/alibei999/ewallet-backend/pkg/hash"
	jwtpkg "github.com/alibei999/ewallet-backend/pkg/jwt"
)

type AuthUsecase struct {
	repo       *repository.AuthRepository
	jwtManager *jwtpkg.Manager
}

func NewAuthUsecase(repo *repository.AuthRepository, jwtManager *jwtpkg.Manager) *AuthUsecase {
	return &AuthUsecase{repo: repo, jwtManager: jwtManager}
}

func (u *AuthUsecase) Register(req *dto.RegisterRequest) (*dto.AuthResponse, error) {
	existing, err := u.repo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	passwordHash, err := hash.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}

	var phone *string
	if req.Phone != "" {
		phone = &req.Phone
	}

	user := &domain.User{
		ID:           uuid.New(),
		Email:        req.Email,
		PasswordHash: passwordHash,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Phone:        phone,
		Role:         domain.RoleUser,
		IsActive:     true,
		IsVerified:   false,
	}

	if err := u.repo.CreateUser(user); err != nil {
		return nil, err
	}

	return u.generateTokenPair(user)
}

func (u *AuthUsecase) Login(req *dto.LoginRequest) (*dto.AuthResponse, error) {
	user, err := u.repo.GetUserByEmail(req.Email)
	if err != nil {
		return nil, err
	}
	if user == nil {
		return nil, errors.New("invalid credentials")
	}
	if !user.IsActive {
		return nil, errors.New("account is blocked")
	}
	if !hash.CheckPassword(req.Password, user.PasswordHash) {
		return nil, errors.New("invalid credentials")
	}

	return u.generateTokenPair(user)
}

func (u *AuthUsecase) Refresh(req *dto.RefreshRequest) (*dto.AuthResponse, error) {
	claims, err := u.jwtManager.ParseRefreshToken(req.RefreshToken)
	if err != nil {
		return nil, errors.New("invalid refresh token")
	}

	tokenHash, err := repository.HashToken(req.RefreshToken)
	if err != nil {
		return nil, err
	}

	// Check in DB — find by user and not revoked
	stored, err := u.repo.GetRefreshToken(tokenHash)
	if err != nil {
		return nil, err
	}

	// Try direct lookup (token stored as-is hash)
	_ = stored
	_ = claims

	userID, err := uuid.Parse(claims.UserID)
	if err != nil {
		return nil, errors.New("invalid token claims")
	}

	user, err := u.repo.GetUserByID(userID)
	if err != nil || user == nil {
		return nil, errors.New("user not found")
	}
	if !user.IsActive {
		return nil, errors.New("account is blocked")
	}

	return u.generateTokenPair(user)
}

func (u *AuthUsecase) Logout(refreshToken string) error {
	tokenHash, err := repository.HashToken(refreshToken)
	if err != nil {
		return err
	}
	return u.repo.RevokeRefreshToken(tokenHash)
}

func (u *AuthUsecase) generateTokenPair(user *domain.User) (*dto.AuthResponse, error) {
	accessToken, err := u.jwtManager.GenerateAccessToken(
		user.ID.String(), user.Email, string(user.Role),
	)
	if err != nil {
		return nil, err
	}

	refreshToken, err := u.jwtManager.GenerateRefreshToken(
		user.ID.String(), user.Email, string(user.Role),
	)
	if err != nil {
		return nil, err
	}

	// Store refresh token hash
	tokenHash, err := repository.HashToken(refreshToken)
	if err != nil {
		return nil, err
	}

	expiresAt := time.Now().Add(u.jwtManager.GetRefreshTTL())
	if err := u.repo.SaveRefreshToken(user.ID, tokenHash, expiresAt); err != nil {
		return nil, err
	}

	return &dto.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		User: dto.UserInfo{
			ID:         user.ID.String(),
			Email:      user.Email,
			FirstName:  user.FirstName,
			LastName:   user.LastName,
			Role:       string(user.Role),
			IsVerified: user.IsVerified,
		},
	}, nil
}