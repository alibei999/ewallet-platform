package usecase

import (
	"errors"

	"github.com/alibei999/ewallet-backend/internal/domain"
	"github.com/alibei999/ewallet-backend/internal/dto"
	"github.com/alibei999/ewallet-backend/internal/repository"
	"github.com/google/uuid"
)

type KYCUsecase struct {
	kycRepo  *repository.KYCRepository
	authRepo *repository.AuthRepository
}

func NewKYCUsecase(kycRepo *repository.KYCRepository, authRepo *repository.AuthRepository) *KYCUsecase {
	return &KYCUsecase{kycRepo: kycRepo, authRepo: authRepo}
}

func (u *KYCUsecase) Submit(userIDStr string, req dto.KYCSubmitRequest) (*dto.KYCResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	// Check if already submitted
	existing, err := u.kycRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		if existing.Status == domain.KYCStatusPending {
			return nil, errors.New("kyc already submitted and pending review")
		}
		if existing.Status == domain.KYCStatusApproved {
			return nil, errors.New("kyc already approved")
		}
		// rejected — allow resubmit (will create new record)
	}

	kyc := &domain.KYCRequest{
		ID:        uuid.New(),
		UserID:    userID,
		FullName:  req.FullName,
		BirthDate: req.BirthDate,
		IDNumber:  req.IDNumber,
		PhotoURL:  req.PhotoURL,
		Status:    domain.KYCStatusPending,
	}

	if err := u.kycRepo.Create(kyc); err != nil {
		return nil, err
	}

	return toKYCResponse(kyc), nil
}

func (u *KYCUsecase) GetStatus(userIDStr string) (*dto.KYCResponse, error) {
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return nil, errors.New("invalid user id")
	}

	kyc, err := u.kycRepo.GetByUserID(userID)
	if err != nil {
		return nil, err
	}
	if kyc == nil {
		return nil, errors.New("kyc not found")
	}

	return toKYCResponse(kyc), nil
}

// Admin: get all pending KYC requests
func (u *KYCUsecase) GetAllPending() ([]dto.KYCResponse, error) {
	list, err := u.kycRepo.GetAllPending()
	if err != nil {
		return nil, err
	}

	result := make([]dto.KYCResponse, 0, len(list))
	for _, kyc := range list {
		k := kyc
		result = append(result, *toKYCResponse(&k))
	}
	return result, nil
}

// Admin: approve or reject KYC
func (u *KYCUsecase) Review(adminIDStr string, kycIDStr string, req dto.KYCReviewRequest) (*dto.KYCResponse, error) {
	adminID, err := uuid.Parse(adminIDStr)
	if err != nil {
		return nil, errors.New("invalid admin id")
	}

	kycID, err := uuid.Parse(kycIDStr)
	if err != nil {
		return nil, errors.New("invalid kyc id")
	}

	kyc, err := u.kycRepo.GetByID(kycID)
	if err != nil {
		return nil, err
	}
	if kyc == nil {
		return nil, errors.New("kyc request not found")
	}
	if kyc.Status != domain.KYCStatusPending {
		return nil, errors.New("kyc request is not pending")
	}

	if req.Status == "rejected" && req.RejectReason == "" {
		return nil, errors.New("reject_reason is required when rejecting")
	}

	newStatus := domain.KYCStatus(req.Status)
	if err := u.kycRepo.UpdateStatus(kycID, newStatus, req.RejectReason, adminID); err != nil {
		return nil, err
	}

	// If approved — mark user as verified
	if newStatus == domain.KYCStatusApproved {
		if err := u.authRepo.SetVerified(kyc.UserID); err != nil {
			return nil, err
		}
	}

	kyc.Status = newStatus
	kyc.RejectReason = req.RejectReason
	return toKYCResponse(kyc), nil
}

func toKYCResponse(kyc *domain.KYCRequest) *dto.KYCResponse {
	return &dto.KYCResponse{
		ID:           kyc.ID.String(),
		UserID:       kyc.UserID.String(),
		FullName:     kyc.FullName,
		BirthDate:    kyc.BirthDate,
		IDNumber:     kyc.IDNumber,
		PhotoURL:     kyc.PhotoURL,
		Status:       string(kyc.Status),
		RejectReason: kyc.RejectReason,
		ReviewedAt:   kyc.ReviewedAt,
		CreatedAt:    kyc.CreatedAt,
	}
}