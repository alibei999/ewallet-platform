package usecase

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/google/uuid"
)

type WebhookUsecase struct {
	invoiceRepo  *repository.InvoiceRepository
	merchantRepo *repository.MerchantRepository
}

func NewWebhookUsecase(
	invoiceRepo *repository.InvoiceRepository,
	merchantRepo *repository.MerchantRepository,
) *WebhookUsecase {
	return &WebhookUsecase{
		invoiceRepo:  invoiceRepo,
		merchantRepo: merchantRepo,
	}
}

func (u *WebhookUsecase) SendWebhook(invoice *domain.Invoice, transactionID uuid.UUID) error {
	merchant, err := u.merchantRepo.GetByID(invoice.MerchantID)
	if err != nil || merchant == nil {
		return fmt.Errorf("merchant not found for webhook")
	}

	if merchant.WebhookURL == "" {
		return nil
	}

	signed := dto.WebhookPayloadSigned{
		Event:         "invoice.paid",
		InvoiceID:     invoice.ID.String(),
		OrderID:       invoice.OrderID,
		Amount:        invoice.Amount,
		Currency:      string(invoice.Currency),
		Status:        string(invoice.Status),
		TransactionID: transactionID.String(),
		Timestamp:     time.Now().Unix(),
	}

	signedBytes, err := json.Marshal(signed)
	if err != nil {
		return fmt.Errorf("failed to marshal webhook payload: %w", err)
	}

	mac := hmac.New(sha256.New, []byte(merchant.APIKey))
	mac.Write(signedBytes)
	signature := hex.EncodeToString(mac.Sum(nil))

	payload := dto.WebhookPayload{
		Event:         signed.Event,
		InvoiceID:     signed.InvoiceID,
		OrderID:       signed.OrderID,
		Amount:        signed.Amount,
		Currency:      signed.Currency,
		Status:        signed.Status,
		TransactionID: signed.TransactionID,
		Timestamp:     signed.Timestamp,
		Signature:     signature,
	}

	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return fmt.Errorf("failed to marshal final webhook payload: %w", err)
	}

	statusCode, respBody, sendErr := u.postWebhook(merchant.WebhookURL, payloadBytes, 1)
	if sendErr != nil {
		// retry once
		statusCode, respBody, sendErr = u.postWebhook(merchant.WebhookURL, payloadBytes, 2)
	}

	attempt := 1
	if sendErr != nil {
		attempt = 2
	}

	log := &domain.WebhookLog{
		ID:         uuid.New(),
		InvoiceID:  invoice.ID,
		MerchantID: merchant.ID,
		URL:        merchant.WebhookURL,
		Payload:    string(payloadBytes),
		Response:   respBody,
		Attempt:    attempt,
	}
	if statusCode != 0 {
		log.StatusCode = &statusCode
	}

	_ = u.invoiceRepo.CreateWebhookLog(log)
	return sendErr
}

func (u *WebhookUsecase) postWebhook(url string, payload []byte, attempt int) (int, string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(payload))
	if err != nil {
		return 0, "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Webhook-Attempt", fmt.Sprintf("%d", attempt))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return 0, "", err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(io.LimitReader(resp.Body, 4096))
	return resp.StatusCode, string(body), nil
}
