package usecase

import (
	"errors"

	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/google/uuid"
)

type TransactionUsecase struct {
	txRepo     *repository.TransactionRepository
	walletRepo *repository.WalletRepository
}

func NewTransactionUsecase(
	txRepo *repository.TransactionRepository,
	walletRepo *repository.WalletRepository,
) *TransactionUsecase {
	return &TransactionUsecase{txRepo: txRepo, walletRepo: walletRepo}
}

func (u *TransactionUsecase) GetHistory(
	userIDStr string,
	txType string,
	status string,
	limit int,
	offset int,
) (*dto.TransactionListResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	wallet, err := u.walletRepo.GetByUserID(userID)
	if err != nil || wallet == nil {
		return nil, errors.New("wallet not found")
	}

	if limit <= 0 || limit > 100 {
		limit = 20
	}
	if offset < 0 {
		offset = 0
	}

	txs, total, err := u.txRepo.GetByUserWallet(wallet.ID, txType, status, limit, offset)
	if err != nil {
		return nil, err
	}

	var items []dto.TransactionResponse
	for _, t := range txs {
		items = append(items, dto.TransactionResponse{
			ID:          t.ID.String(),
			Type:        string(t.Type),
			Status:      string(t.Status),
			Amount:      t.Amount,
			Fee:         t.Fee,
			Currency:    string(t.Currency),
			Description: t.Description,
			CreatedAt:   t.CreatedAt,
		})
	}

	return &dto.TransactionListResponse{
		Total:  total,
		Limit:  limit,
		Offset: offset,
		Items:  items,
	}, nil
}

func (u *TransactionUsecase) GetByID(userIDStr string, txIDStr string) (*dto.TransactionResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	txID, err := uuid.Parse(txIDStr)
	if err != nil {
		return nil, errors.New("invalid transaction id")
	}

	wallet, err := u.walletRepo.GetByUserID(userID)
	if err != nil || wallet == nil {
		return nil, errors.New("wallet not found")
	}

	t, err := u.txRepo.GetByID(txID)
	if err != nil || t == nil {
		return nil, errors.New("transaction not found")
	}

	if t.WalletID != wallet.ID {
		return nil, errors.New("transaction not found")
	}

	return &dto.TransactionResponse{
		ID:          t.ID.String(),
		Type:        string(t.Type),
		Status:      string(t.Status),
		Amount:      t.Amount,
		Fee:         t.Fee,
		Currency:    string(t.Currency),
		Description: t.Description,
		CreatedAt:   t.CreatedAt,
	}, nil
}
