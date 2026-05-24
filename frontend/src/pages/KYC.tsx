import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { getStatus, submit } from '@/api/kyc';
import type { KYCStatus } from '@/types';

const ID_TYPES = [
  { value: 'passport', label: 'Passport' },
  { value: 'national_id', label: 'National ID' },
  { value: 'drivers_license', label: "Driver's License" },
] as const;

export default function KYC() {
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [address, setAddress] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [idType, setIdType] = useState<'passport' | 'national_id' | 'drivers_license'>(
    'passport',
  );

  useEffect(() => {
    getStatus()
      .then(setKycStatus)
      .catch(() => setError('Failed to load KYC status.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await submit({
        full_name: fullName,
        date_of_birth: dob,
        address,
        id_number: idNumber,
        id_type: idType,
      });
      setKycStatus(updated);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Submission failed.',
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">KYC Verification</h1>
        <p className="text-[#9ca3af] mt-1">Verify your identity to unlock all features</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {kycStatus?.status === 'approved' && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">KYC Approved</p>
            {kycStatus.full_name && (
              <p className="text-xs mt-0.5 text-green-300/80">
                Verified as {kycStatus.full_name}
              </p>
            )}
          </div>
        </div>
      )}

      {kycStatus?.status === 'pending' && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
          <Clock className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Your KYC is under review</p>
            <p className="text-xs mt-0.5 text-yellow-300/80">
              We'll notify you once the review is complete. This usually takes 1–2 business days.
            </p>
          </div>
        </div>
      )}

      {kycStatus?.status === 'rejected' && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
          <XCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">KYC Rejected</p>
            <p className="text-xs mt-0.5 text-red-300/80">
              Your submission was rejected. Please review and resubmit with accurate information.
            </p>
          </div>
        </div>
      )}

      {(kycStatus?.status === 'not_submitted' || kycStatus?.status === 'rejected') && (
        <form
          onSubmit={handleSubmit}
          className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-white font-semibold">
            {kycStatus.status === 'rejected' ? 'Resubmit KYC' : 'Submit KYC'}
          </h2>

          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              Full Name (as on ID)
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              placeholder="John Doe"
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
            />
          </div>

          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              Date of Birth
            </label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              required
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="123 Main St, City, Country"
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
            />
          </div>

          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">ID Type</label>
            <select
              value={idType}
              onChange={(e) =>
                setIdType(e.target.value as typeof idType)
              }
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
            >
              {ID_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">ID Number</label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              required
              placeholder="Document number"
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="sm" />
                Submitting…
              </>
            ) : (
              'Submit for Review'
            )}
          </button>
        </form>
      )}
    </div>
  );
}
