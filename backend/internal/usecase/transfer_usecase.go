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

var transferFeeRate = decimal.NewFromFloat(0.005) // 0.5%

type TransferUsecase struct {
	walletRepo      *repository.WalletRepository
	authRepo        *repository.AuthRepository
	transactionRepo *repository.TransactionRepository
}

func NewTransferUsecase(
	walletRepo *repository.WalletRepository,
	authRepo *repository.AuthRepository,
	transactionRepo *repository.TransactionRepository,
) *TransferUsecase {
	return &TransferUsecase{
		walletRepo:      walletRepo,
		authRepo:        authRepo,
		transactionRepo: transactionRepo,
	}
}

func (u *TransferUsecase) Transfer(senderUserIDStr string, req dto.TransferRequest) (*dto.TransactionResponse, error) {
	senderUserID, err := uuid.Parse(senderUserIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	// Validate amount
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("amount must be positive")
	}

	// Validate currency
	currency := domain.Currency(req.Currency)
	valid := false
	for _, c := range domain.SupportedCurrencies {
		if c == currency {
			valid = true
			break
		}
	}
	if !valid {
		return nil, errors.New("unsupported currency")
	}

	// Get sender wallet
	senderWallet, err := u.walletRepo.GetWalletByUserID(senderUserID)
	if err != nil {
		return nil, err
	}
	if senderWallet == nil {
		return nil, errors.New("sender wallet not found")
	}
	if !senderWallet.IsActive {
		return nil, errors.New("sender wallet is inactive")
	}

	// Get receiver by email
	receiverUser, err := u.authRepo.GetUserByEmail(req.ToEmail)
	if err != nil {
		return nil, err
	}
	if receiverUser == nil {
		return nil, errors.New("recipient not found")
	}
	if receiverUser.ID == senderUserID {
		return nil, errors.New("cannot transfer to yourself")
	}

	// Get receiver wallet
	receiverWallet, err := u.walletRepo.GetWalletByUserID(receiverUser.ID)
	if err != nil {
		return nil, err
	}
	if receiverWallet == nil {
		return nil, errors.New("recipient wallet not found")
	}
	if !receiverWallet.IsActive {
		return nil, errors.New("recipient wallet is inactive")
	}

	// Calculate fee
	fee := req.Amount.Mul(transferFeeRate).Round(8)
	totalDebit := req.Amount.Add(fee)

	// Check sender balance
	senderBalance, err := u.walletRepo.GetBalance(senderWallet.ID, currency)
	if err != nil {
		return nil, err
	}
	if senderBalance == nil {
		return nil, errors.New("sender balance not found")
	}
	if senderBalance.Balance.LessThan(totalDebit) {
		return nil, fmt.Errorf("insufficient balance: have %s, need %s", senderBalance.Balance, totalDebit)
	}

	// BEGIN ACID TRANSACTION
	db := u.transactionRepo.GetDB()
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Debit sender (amount + fee)
	if err := u.walletRepo.UpdateBalance(tx, senderWallet.ID, currency, totalDebit.Neg()); err != nil {
		return nil, fmt.Errorf("failed to debit sender: %w", err)
	}

	// 2. Credit receiver (amount only)
	if err := u.walletRepo.UpdateBalance(tx, receiverWallet.ID, currency, req.Amount); err != nil {
		return nil, fmt.Errorf("failed to credit receiver: %w", err)
	}

	// 3. Create sender transaction record
	counterpartID := receiverWallet.ID
	senderTx, err := u.transactionRepo.CreateTransaction(
		tx,
		senderWallet.ID,
		&counterpartID,
		domain.TransactionTypeTransfer,
		domain.TransactionStatusSuccess,
		req.Amount,
		fee,
		currency,
		fmt.Sprintf("Transfer to %s: %s", req.ToEmail, req.Description),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create sender transaction: %w", err)
	}

	// 4. Create receiver transaction record
	senderWalletID := senderWallet.ID
	_, err = u.transactionRepo.CreateTransaction(
		tx,
		receiverWallet.ID,
		&senderWalletID,
		domain.TransactionTypeTransfer,
		domain.TransactionStatusSuccess,
		req.Amount,
		decimal.Zero,
		currency,
		fmt.Sprintf("Transfer from %s", senderUserIDStr),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create receiver transaction: %w", err)
	}

	// 5. Log the transaction
	if err := u.transactionRepo.CreateLog(tx, senderTx.ID, "success", "transfer completed"); err != nil {
		return nil, fmt.Errorf("failed to create log: %w", err)
	}

	// COMMIT
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit: %w", err)
	}

	return &dto.TransactionResponse{
		ID:                  senderTx.ID.String(),
		Type:                string(senderTx.Type),
		Status:              string(senderTx.Status),
		Amount:              senderTx.Amount,
		Fee:                 senderTx.Fee,
		Currency:            string(senderTx.Currency),
		Description:         senderTx.Description,
		CounterpartWalletID: counterpartID.String(),
		CreatedAt:           senderTx.CreatedAt,
	}, nil
}