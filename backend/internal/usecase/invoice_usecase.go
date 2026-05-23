package usecase

import (
	"errors"
	"fmt"
	"time"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

var merchantFeeRate = decimal.NewFromFloat(0.015) // 1.5%

type InvoiceUsecase struct {
	invoiceRepo  *repository.InvoiceRepository
	merchantRepo *repository.MerchantRepository
	walletRepo   *repository.WalletRepository
	txRepo       *repository.TransactionRepository
	webhookUC    *WebhookUsecase
	baseURL      string
}

func NewInvoiceUsecase(
	invoiceRepo *repository.InvoiceRepository,
	merchantRepo *repository.MerchantRepository,
	walletRepo *repository.WalletRepository,
	txRepo *repository.TransactionRepository,
	webhookUC *WebhookUsecase,
	baseURL string,
) *InvoiceUsecase {
	return &InvoiceUsecase{
		invoiceRepo:  invoiceRepo,
		merchantRepo: merchantRepo,
		walletRepo:   walletRepo,
		txRepo:       txRepo,
		webhookUC:    webhookUC,
		baseURL:      baseURL,
	}
}

func (u *InvoiceUsecase) CreateInvoice(merchantID uuid.UUID, req dto.CreateInvoiceRequest) (*dto.CreateInvoiceResponse, error) {
	if req.Amount.LessThanOrEqual(decimal.Zero) {
		return nil, errors.New("amount must be positive")
	}

	currency := domain.Currency(req.Currency)
	validCurrency := false
	for _, c := range domain.SupportedCurrencies {
		if c == currency {
			validCurrency = true
			break
		}
	}
	if !validCurrency {
		return nil, errors.New("unsupported currency")
	}

	existing, err := u.invoiceRepo.GetByOrderID(merchantID, req.OrderID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, errors.New("invoice with this order_id already exists for this merchant")
	}

	expiresAt := time.Now().Add(time.Duration(req.ExpiresInMinutes) * time.Minute)

	inv := &domain.Invoice{
		ID:          uuid.New(),
		MerchantID:  merchantID,
		OrderID:     req.OrderID,
		Amount:      req.Amount,
		Currency:    currency,
		Status:      domain.InvoiceStatusPending,
		Description: req.Description,
		ExpiresAt:   expiresAt,
	}

	if err := u.invoiceRepo.Create(inv); err != nil {
		return nil, err
	}

	paymentURL := fmt.Sprintf("%s/api/v1/invoices/%s/pay", u.baseURL, inv.ID.String())

	return &dto.CreateInvoiceResponse{
		ID:         inv.ID.String(),
		OrderID:    inv.OrderID,
		Amount:     inv.Amount,
		Currency:   string(inv.Currency),
		Status:     string(inv.Status),
		PaymentURL: paymentURL,
		ExpiresAt:  inv.ExpiresAt,
	}, nil
}

func (u *InvoiceUsecase) PayInvoice(userIDStr, invoiceIDStr string) (*dto.PayInvoiceResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	invoiceID, err := uuid.Parse(invoiceIDStr)
	if err != nil {
		return nil, errors.New("invalid invoice id")
	}

	// Load invoice
	inv, err := u.invoiceRepo.GetByID(invoiceID)
	if err != nil {
		return nil, err
	}
	if inv == nil {
		return nil, errors.New("invoice not found")
	}
	if inv.Status != domain.InvoiceStatusPending {
		return nil, fmt.Errorf("invoice is %s and cannot be paid", inv.Status)
	}
	if time.Now().After(inv.ExpiresAt) {
		_ = u.invoiceRepo.UpdateStatus(invoiceID, domain.InvoiceStatusExpired)
		return nil, errors.New("invoice has expired")
	}

	// Get merchant
	merchant, err := u.merchantRepo.GetByID(inv.MerchantID)
	if err != nil || merchant == nil {
		return nil, errors.New("merchant not found")
	}

	// Get or create merchant wallet
	merchantWallet, err := u.walletRepo.GetWalletByUserID(merchant.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get merchant wallet: %w", err)
	}
	if merchantWallet == nil {
		merchantWallet, err = u.walletRepo.CreateWallet(merchant.UserID)
		if err != nil {
			return nil, fmt.Errorf("failed to create merchant wallet: %w", err)
		}
	}

	// Get payer wallet
	payerWallet, err := u.walletRepo.GetWalletByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get payer wallet: %w", err)
	}
	if payerWallet == nil {
		return nil, errors.New("payer wallet not found")
	}
	if payerWallet.ID == merchantWallet.ID {
		return nil, errors.New("cannot pay your own invoice")
	}

	currency := inv.Currency

	// Check payer balance
	payerBalance, err := u.walletRepo.GetBalance(payerWallet.ID, currency)
	if err != nil {
		return nil, fmt.Errorf("failed to get payer balance: %w", err)
	}
	if payerBalance == nil {
		return nil, fmt.Errorf("no %s balance found in payer wallet", currency)
	}
	if payerBalance.Balance.LessThan(inv.Amount) {
		return nil, fmt.Errorf("insufficient balance: have %s %s, need %s %s",
			payerBalance.Balance, currency, inv.Amount, currency)
	}

	// Calculate fee: 1.5% taken from merchant's side
	fee := inv.Amount.Mul(merchantFeeRate).Round(8)
	merchantReceives := inv.Amount.Sub(fee)

	// BEGIN ACID TRANSACTION
	db := u.txRepo.GetDB()
	tx, err := db.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// 1. Debit payer (full invoice amount)
	if err := u.walletRepo.UpdateBalance(tx, payerWallet.ID, currency, inv.Amount.Neg()); err != nil {
		return nil, fmt.Errorf("failed to debit payer: %w", err)
	}

	// 2. Credit merchant (amount minus platform fee)
	if err := u.walletRepo.UpdateBalance(tx, merchantWallet.ID, currency, merchantReceives); err != nil {
		return nil, fmt.Errorf("failed to credit merchant: %w", err)
	}

	// 3. Create payer transaction record
	merchantWalletID := merchantWallet.ID
	payerTx, err := u.txRepo.CreateTransaction(
		tx,
		payerWallet.ID,
		&merchantWalletID,
		domain.TransactionTypePayment,
		domain.TransactionStatusSuccess,
		inv.Amount,
		fee,
		currency,
		fmt.Sprintf("Invoice payment: %s (order: %s)", inv.ID, inv.OrderID),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create payer transaction: %w", err)
	}

	// 4. Create merchant transaction record
	payerWalletID := payerWallet.ID
	_, err = u.txRepo.CreateTransaction(
		tx,
		merchantWallet.ID,
		&payerWalletID,
		domain.TransactionTypePayment,
		domain.TransactionStatusSuccess,
		merchantReceives,
		decimal.Zero,
		currency,
		fmt.Sprintf("Invoice received: %s (order: %s)", inv.ID, inv.OrderID),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to create merchant transaction: %w", err)
	}

	// 5. Update invoice status inside the same transaction
	pwID := payerWallet.ID
	if err := u.invoiceRepo.UpdateStatusTx(tx, invoiceID, domain.InvoiceStatusPaid, &pwID); err != nil {
		return nil, fmt.Errorf("failed to update invoice status: %w", err)
	}

	// COMMIT
	if err := tx.Commit(); err != nil {
		return nil, fmt.Errorf("failed to commit payment: %w", err)
	}

	// Send webhook asynchronously
	paidInvoice := *inv
	paidInvoice.Status = domain.InvoiceStatusPaid
	go func() {
		_ = u.webhookUC.SendWebhook(&paidInvoice, payerTx.ID)
	}()

	return &dto.PayInvoiceResponse{
		InvoiceID:     inv.ID.String(),
		TransactionID: payerTx.ID.String(),
		Amount:        inv.Amount,
		Fee:           fee,
		Currency:      string(currency),
		Status:        string(domain.InvoiceStatusPaid),
	}, nil
}

func (u *InvoiceUsecase) GetInvoiceStatus(invoiceIDStr string) (*dto.InvoiceStatusResponse, error) {
	invoiceID, err := uuid.Parse(invoiceIDStr)
	if err != nil {
		return nil, errors.New("invalid invoice id")
	}

	inv, err := u.invoiceRepo.GetByID(invoiceID)
	if err != nil {
		return nil, err
	}
	if inv == nil {
		return nil, errors.New("invoice not found")
	}

	// Auto-expire if past expiry and still pending
	if inv.Status == domain.InvoiceStatusPending && time.Now().After(inv.ExpiresAt) {
		_ = u.invoiceRepo.UpdateStatus(invoiceID, domain.InvoiceStatusExpired)
		inv.Status = domain.InvoiceStatusExpired
	}

	return &dto.InvoiceStatusResponse{
		ID:       inv.ID.String(),
		OrderID:  inv.OrderID,
		Status:   string(inv.Status),
		Amount:   inv.Amount,
		Currency: string(inv.Currency),
		PaidAt:   inv.PaidAt,
	}, nil
}
