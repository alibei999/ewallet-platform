package usecase

import (
	"errors"
	"fmt"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

type DepositUsecase struct {
	walletRepo      *repository.WalletRepository
	transactionRepo *repository.TransactionRepository
	kycRepo         *repository.KYCRepository
}

func NewDepositUsecase(
	walletRepo *repository.WalletRepository,
	transactionRepo *repository.TransactionRepository,
	kycRepo *repository.KYCRepository,
) *DepositUsecase {
	return &DepositUsecase{
		walletRepo:      walletRepo,
		transactionRepo: transactionRepo,
		kycRepo:         kycRepo,
	}
}

func (u *DepositUsecase) Deposit(userIDStr string, req dto.DepositRequest) (*dto.TransactionResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	amount, err := decimal.NewFromString(req.Amount)
	if err != nil || amount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("invalid amount")
	}

	maxDeposit := decimal.NewFromFloat(1000000)
	if amount.GreaterThan(maxDeposit) {
		return nil, errors.New("amount exceeds maximum deposit limit of 1,000,000")
	}

	wallet, err := u.walletRepo.GetByUserID(userID)
	if err != nil || wallet == nil {
		return nil, errors.New("wallet not found")
	}

	currency := domain.Currency(req.Currency)

	if err := u.walletRepo.AddBalance(wallet.ID, currency, amount); err != nil {
		return nil, fmt.Errorf("failed to add balance: %w", err)
	}

	tx := &domain.Transaction{
		ID:          uuid.New(),
		WalletID:    wallet.ID,
		Type:        domain.TransactionTypeDeposit,
		Status:      domain.TransactionStatusSuccess,
		Amount:      amount,
		Fee:         decimal.Zero,
		Currency:    currency,
		Description: fmt.Sprintf("Mock bank deposit via card *%s", lastFour(req.CardNumber)),
		ReferenceID: uuid.New().String(),
	}

	if err := u.transactionRepo.CreateWithDB(tx); err != nil {
		return nil, fmt.Errorf("failed to record transaction: %w", err)
	}

	return toTxResponse(tx), nil
}

func (u *DepositUsecase) Withdraw(userIDStr string, req dto.WithdrawRequest) (*dto.TransactionResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	amount, err := decimal.NewFromString(req.Amount)
	if err != nil || amount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("invalid amount")
	}

	// KYC check
	kyc, err := u.kycRepo.GetByUserID(userID)
	if err != nil {
		return nil, errors.New("failed to check kyc status")
	}
	if kyc == nil || kyc.Status != domain.KYCStatusApproved {
		return nil, errors.New("kyc verification required for withdrawal")
	}

	wallet, err := u.walletRepo.GetByUserID(userID)
	if err != nil || wallet == nil {
		return nil, errors.New("wallet not found")
	}

	currency := domain.Currency(req.Currency)

	// Fee: 1%
	fee := amount.Mul(decimal.NewFromFloat(0.01)).Round(8)
	totalDeducted := amount.Add(fee)

	// Check balance
	balance, err := u.walletRepo.GetBalance(wallet.ID, currency)
	if err != nil {
		return nil, errors.New("failed to get balance")
	}
	if balance == nil || balance.Balance.LessThan(totalDeducted) {
		return nil, fmt.Errorf("insufficient balance: need %s %s (including 1%% fee)",
			totalDeducted.String(), req.Currency)
	}

	if err := u.walletRepo.SubtractBalance(wallet.ID, currency, totalDeducted); err != nil {
		return nil, fmt.Errorf("failed to deduct balance: %w", err)
	}

	description := req.Description
	if description == "" {
		description = fmt.Sprintf("Mock bank withdrawal to card *%s", lastFour(req.CardNumber))
	}

	tx := &domain.Transaction{
		ID:          uuid.New(),
		WalletID:    wallet.ID,
		Type:        domain.TransactionTypeWithdrawal,
		Status:      domain.TransactionStatusSuccess,
		Amount:      amount,
		Fee:         fee,
		Currency:    currency,
		Description: description,
		ReferenceID: uuid.New().String(),
	}

	if err := u.transactionRepo.CreateWithDB(tx); err != nil {
		return nil, fmt.Errorf("failed to record transaction: %w", err)
	}

	return toTxResponse(tx), nil
}

func lastFour(s string) string {
	if len(s) >= 4 {
		return s[len(s)-4:]
	}
	return s
}

func toTxResponse(t *domain.Transaction) *dto.TransactionResponse {
	return &dto.TransactionResponse{
		ID:          t.ID.String(),
		Type:        string(t.Type),
		Status:      string(t.Status),
		Amount:      t.Amount,
		Fee:         t.Fee,
		Currency:    string(t.Currency),
		Description: t.Description,
		CreatedAt:   t.CreatedAt,
	}
}