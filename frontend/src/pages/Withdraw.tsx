import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { withdraw } from '@/api/wallet';
import { getStatus } from '@/api/kyc';
import type { KYCStatus } from '@/types';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const;

const METHODS = [
  { value: 'bank', label: 'Bank Transfer' },
  { value: 'crypto', label: 'Crypto Wallet' },
] as const;

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Withdraw() {
  const [kyc, setKyc] = useState<KYCStatus | null>(null);
  const [currency, setCurrency] = useState('KZT');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'crypto'>('bank');
  const [destination, setDestination] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [kycLoading, setKycLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);

  useEffect(() => {
    getStatus()
      .then(setKyc)
      .catch(() => {/* allow submit if KYC check fails */})
      .finally(() => setKycLoading(false));
  }, []);

  const kycApproved = kyc?.status === 'approved';
  const submitDisabled = isLoading || (kyc !== null && !kycApproved);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const res = await withdraw({ amount: amountNum, currency });
      setTransactionId(res.transaction_id);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Withdrawal failed.',
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (transactionId !== null) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Withdraw</h1>
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <div>
            <p className="text-white font-semibold text-lg">Withdrawal Submitted</p>
            <p className="text-[#9ca3af] text-sm mt-1">
              Transaction ID:{' '}
              <span className="text-white font-medium">#{transactionId}</span>
            </p>
          </div>
          <div className="bg-[#111111] rounded-lg p-4 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-[#9ca3af]">Amount</span>
              <span className="text-sm text-white">
                {currency} {fmtNum(parseFloat(amount))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-[#9ca3af]">Method</span>
              <span className="text-sm text-white capitalize">
                {METHODS.find((m) => m.value === method)?.label}
              </span>
            </div>
            {destination && (
              <div className="flex justify-between gap-4">
                <span className="text-xs text-[#9ca3af] shrink-0">Destination</span>
                <span className="text-sm text-white text-right break-all">{destination}</span>
              </div>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setAmount('');
                setDestination('');
                setTransactionId(null);
              }}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              New Withdrawal
            </button>
            <Link
              to="/transactions"
              className="bg-[#111111] border border-[#222222] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm hover:border-[#6366f1]"
            >
              View Transactions
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Withdraw</h1>
        <p className="text-[#9ca3af] mt-1">Withdraw funds from your wallet</p>
      </div>

      {!kycLoading && kyc && !kycApproved && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <span className="text-sm">
            KYC verification required to withdraw.{' '}
            <Link to="/kyc" className="underline font-medium">
              Complete KYC
            </Link>{' '}
            first.
          </span>
        </div>
      )}

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <form
        onSubmit={handleSubmit}
        className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
      >
        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">Currency</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">Amount</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            placeholder="0.00"
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
          />
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">
            Withdrawal Method
          </label>
          <div className="space-y-2">
            {METHODS.map((m) => (
              <label
                key={m.value}
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  method === m.value
                    ? 'border-[#6366f1] bg-[#6366f1]/10'
                    : 'border-[#222222] hover:border-[#444444]'
                }`}
              >
                <input
                  type="radio"
                  name="method"
                  value={m.value}
                  checked={method === m.value}
                  onChange={() => setMethod(m.value)}
                  className="accent-[#6366f1]"
                />
                <span className="text-sm text-white">{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">
            {method === 'bank' ? 'Bank Account Number' : 'Crypto Address'}
          </label>
          <input
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            required
            placeholder={
              method === 'bank' ? 'IBAN or account number' : 'Wallet address'
            }
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
          />
        </div>

        <button
          type="submit"
          disabled={submitDisabled}
          className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Processing…
            </>
          ) : (
            'Withdraw Funds'
          )}
        </button>
      </form>
    </div>
  );
}
