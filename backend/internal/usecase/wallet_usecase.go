package usecase

import (
	"errors"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type WalletUsecase struct {
	repo *repository.WalletRepository
}

func NewWalletUsecase(repo *repository.WalletRepository) *WalletUsecase {
	return &WalletUsecase{repo: repo}
}

func (u *WalletUsecase) CreateWallet(userIDStr string) (*dto.WalletResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	// Check if wallet already exists
	existing, err := u.repo.GetWalletByUserID(userID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("wallet already exists")
	}

	wallet, err := u.repo.CreateWallet(userID)
	if err != nil {
		return nil, err
	}

	balances, err := u.repo.GetBalances(wallet.ID)
	if err != nil {
		return nil, err
	}

	return toWalletResponse(wallet, balances), nil
}

func (u *WalletUsecase) GetWallet(userIDStr string) (*dto.WalletResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	wallet, err := u.repo.GetWalletByUserID(userID)
	if err != nil {
		return nil, err
	}
	if wallet == nil {
		return nil, errors.New("wallet not found")
	}

	balances, err := u.repo.GetBalances(wallet.ID)
	if err != nil {
		return nil, err
	}

	return toWalletResponse(wallet, balances), nil
}

func (u *WalletUsecase) MockDeposit(userIDStr string, currency string, amount decimal.Decimal) (*dto.WalletResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	if amount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("amount must be positive")
	}

	cur := domain.Currency(currency)
	valid := false
	for _, c := range domain.SupportedCurrencies {
		if c == cur {
			valid = true
			break
		}
	}
	if !valid {
		return nil, errors.New("unsupported currency")
	}

	wallet, err := u.repo.GetWalletByUserID(userID)
	if err != nil {
		return nil, err
	}
	if wallet == nil {
		return nil, errors.New("wallet not found")
	}

	// Use DB directly for mock deposit (no real transaction needed for mock)
	db := u.repo.GetDB()
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	if err := u.repo.UpdateBalance(tx, wallet.ID, cur, amount); err != nil {
		return nil, err
	}

	if err := tx.Commit(); err != nil {
		return nil, err
	}

	balances, err := u.repo.GetBalances(wallet.ID)
	if err != nil {
		return nil, err
	}

	return toWalletResponse(wallet, balances), nil
}

func toWalletResponse(wallet *domain.Wallet, balances []domain.WalletBalance) *dto.WalletResponse {
	resp := &dto.WalletResponse{
		ID:       wallet.ID.String(),
		UserID:   wallet.UserID.String(),
		IsActive: wallet.IsActive,
		Balances: make([]dto.BalanceResponse, 0, len(balances)),
	}
	for _, b := range balances {
		resp.Balances = append(resp.Balances, dto.BalanceResponse{
			Currency:     string(b.Currency),
			Balance:      b.Balance,
			FrozenAmount: b.FrozenAmount,
		})
	}
	return resp
}