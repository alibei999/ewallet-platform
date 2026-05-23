package usecase

import (
	"crypto/rand"
	"encoding/hex"
	"errors"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/google/uuid"
)

type MerchantUsecase struct {
	merchantRepo *repository.MerchantRepository
	invoiceRepo  *repository.InvoiceRepository
}

func NewMerchantUsecase(
	merchantRepo *repository.MerchantRepository,
	invoiceRepo *repository.InvoiceRepository,
) *MerchantUsecase {
	return &MerchantUsecase{
		merchantRepo: merchantRepo,
		invoiceRepo:  invoiceRepo,
	}
}

func (u *MerchantUsecase) RegisterMerchant(userIDStr string, req dto.RegisterMerchantRequest) (*dto.RegisterMerchantResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	existing, err := u.merchantRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("merchant account already registered for this user")
	}

	apiKey, err := generateAPIKey()
	if err != nil {
		return nil, errors.New("failed to generate api key")
	}

	merchant := &domain.Merchant{
		ID:           uuid.New(),
		UserID:       userID,
		BusinessName: req.BusinessName,
		APIKey:       apiKey,
		WebhookURL:   req.WebhookURL,
		IsActive:     true,
	}

	if err := u.merchantRepo.Create(merchant); err != nil {
		return nil, err
	}

	return &dto.RegisterMerchantResponse{
		ID:           merchant.ID.String(),
		BusinessName: merchant.BusinessName,
		APIKey:       merchant.APIKey,
		WebhookURL:   merchant.WebhookURL,
		CreatedAt:    merchant.CreatedAt,
	}, nil
}

func (u *MerchantUsecase) GetMerchantInfo(userIDStr string) (*dto.MerchantInfoResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	merchant, err := u.merchantRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}
	if merchant == nil {
		return nil, errors.New("merchant account not found")
	}

	return &dto.MerchantInfoResponse{
		ID:           merchant.ID.String(),
		BusinessName: merchant.BusinessName,
		WebhookURL:   merchant.WebhookURL,
		IsActive:     merchant.IsActive,
		CreatedAt:    merchant.CreatedAt,
	}, nil
}

func (u *MerchantUsecase) GetInvoices(userIDStr string, limit, offset int) (*dto.InvoiceListResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	merchant, err := u.merchantRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}
	if merchant == nil {
		return nil, errors.New("merchant account not found")
	}

	if limit <= 0 {
		limit = 20
	}
	if limit > 100 {
		limit = 100
	}

	invoices, total, err := u.invoiceRepo.GetByMerchantID(merchant.ID, limit, offset)
	if err != nil {
		return nil, err
	}

	items := make([]dto.InvoiceStatusResponse, 0, len(invoices))
	for _, inv := range invoices {
		items = append(items, dto.InvoiceStatusResponse{
			ID:       inv.ID.String(),
			OrderID:  inv.OrderID,
			Status:   string(inv.Status),
			Amount:   inv.Amount,
			Currency: string(inv.Currency),
			PaidAt:   inv.PaidAt,
		})
	}

	return &dto.InvoiceListResponse{
		Invoices: items,
		Total:    total,
		Limit:    limit,
		Offset:   offset,
	}, nil
}

func generateAPIKey() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}
