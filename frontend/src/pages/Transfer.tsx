import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { sendTransfer } from '@/api/transfer';
import type { Transaction } from '@/types';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const;
const FEE_RATE = 0.005;

type Step = 'form' | 'confirm' | 'success';

interface FormData {
  recipient_email: string;
  currency: string;
  amount: string;
  description: string;
}

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Transfer() {
  const [step, setStep] = useState<Step>('form');
  const [form, setForm] = useState<FormData>({
    recipient_email: '',
    currency: 'KZT',
    amount: '',
    description: '',
  });
  const [result, setResult] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(form.amount) || 0;
  const fee = amountNum * FEE_RATE;
  const total = amountNum + fee;

  function handleField(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    if (amountNum <= 0) {
      setError('Amount must be greater than 0.');
      return;
    }
    setError(null);
    setStep('confirm');
  }

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await sendTransfer({
        recipient_email: form.recipient_email,
        amount: amountNum,
        currency: form.currency,
        description: form.description || undefined,
      });
      setResult(res.transaction);
      setStep('success');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Transfer failed.',
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
      setStep('form');
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 'success' && result) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Transfer</h1>
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-400 mx-auto" />
          <div>
            <p className="text-white font-semibold text-lg">Transfer Successful</p>
            <p className="text-[#9ca3af] text-sm mt-1">
              Transaction ID:{' '}
              <span className="text-white font-medium">#{result.id}</span>
            </p>
          </div>
          <div className="bg-[#111111] rounded-lg p-4 text-left space-y-2">
            <Row label="Recipient" value={form.recipient_email} />
            <Row label="Amount" value={`${form.currency} ${fmtNum(amountNum)}`} />
            <Row label="Fee" value={`${form.currency} ${fmtNum(fee)}`} />
            <Row label="Total" value={`${form.currency} ${fmtNum(total)}`} />
            <Row label="Status" value={result.status} />
          </div>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setForm({ recipient_email: '', currency: 'KZT', amount: '', description: '' });
                setStep('form');
              }}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
            >
              New Transfer
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

  if (step === 'confirm') {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Confirm Transfer</h1>
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4">
          <p className="text-[#9ca3af] text-sm">Please review before confirming.</p>
          <div className="bg-[#111111] rounded-lg p-4 space-y-2">
            <Row label="Recipient" value={form.recipient_email} />
            <Row label="Currency" value={form.currency} />
            <Row label="Amount" value={`${form.currency} ${fmtNum(amountNum)}`} />
            <Row label="Fee (0.5%)" value={`${form.currency} ${fmtNum(fee)}`} />
            <div className="border-t border-[#222222] pt-2">
              <Row label="Total Deducted" value={`${form.currency} ${fmtNum(total)}`} bold />
            </div>
            {form.description && <Row label="Note" value={form.description} />}
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('form')}
              className="flex items-center gap-2 flex-1 justify-center bg-[#111111] border border-[#222222] text-white font-semibold py-3 rounded-lg transition-colors hover:border-[#6366f1] text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  Sending…
                </>
              ) : (
                'Confirm & Send'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-white">Transfer</h1>
      <p className="text-[#9ca3af] -mt-4">Send funds to another user</p>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <form onSubmit={handleFormSubmit} className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">
            Recipient Email
          </label>
          <input
            type="email"
            value={form.recipient_email}
            onChange={(e) => handleField('recipient_email', e.target.value)}
            required
            placeholder="recipient@example.com"
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
          />
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">Currency</label>
          <select
            value={form.currency}
            onChange={(e) => handleField('currency', e.target.value)}
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
            value={form.amount}
            onChange={(e) => handleField('amount', e.target.value)}
            required
            placeholder="0.00"
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
          />
          {amountNum > 0 && (
            <p className="text-xs text-[#9ca3af] mt-1.5">
              Fee: {form.currency} {fmtNum(fee)} · Total: {form.currency} {fmtNum(total)}
            </p>
          )}
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">
            Description{' '}
            <span className="text-[#9ca3af]/60 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={form.description}
            onChange={(e) => handleField('description', e.target.value)}
            placeholder="What's this for?"
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold py-3 px-6 rounded-lg transition-colors mt-2"
        >
          Review Transfer
        </button>
      </form>
    </div>
  );
}

function Row({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-[#9ca3af]">{label}</span>
      <span className={`text-sm ${bold ? 'font-bold text-white' : 'text-white'} text-right`}>
        {value}
      </span>
    </div>
  );
}
