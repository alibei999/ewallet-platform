import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { deposit } from '@/api/wallet';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const;

const METHODS = [
  { value: 'card', label: 'Credit / Debit Card' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
] as const;

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Deposit() {
  const [currency, setCurrency] = useState('KZT');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'card' | 'bank_transfer'>('card');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<number | null>(null);

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
      const res = await deposit({ amount: amountNum, currency });
      setTransactionId(res.transaction_id);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Deposit failed.',
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
        <h1 className="text-2xl font-bold text-white">Deposit</h1>
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <div>
            <p className="text-white font-semibold text-lg">Deposit Initiated</p>
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
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setAmount('');
                setTransactionId(null);
              }}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              New Deposit
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
        <h1 className="text-2xl font-bold text-white">Deposit</h1>
        <p className="text-[#9ca3af] mt-1">Add funds to your wallet</p>
      </div>

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
            Payment Method
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

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Processing…
            </>
          ) : (
            'Deposit Funds'
          )}
        </button>
      </form>
    </div>
  );
}
