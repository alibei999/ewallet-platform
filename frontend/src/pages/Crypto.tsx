import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Copy, Check, AlertTriangle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/api/axios';

type CryptoCurrency = 'BTC' | 'USDT';
type Tab = 'deposit' | 'withdraw';

const DEPOSIT_ADDRESSES: Record<CryptoCurrency, string> = {
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  USDT: 'TN3W4T9XYXK2K5V5U1TBD1P5WYGQMFZ7J',
};

const NETWORK_FEES: Record<CryptoCurrency, string> = {
  BTC: '0.0001 BTC',
  USDT: '1 USDT',
};

export default function Crypto() {
  const [tab, setTab] = useState<Tab>('deposit');

  // Deposit tab
  const [depositCurrency, setDepositCurrency] = useState<CryptoCurrency>('BTC');
  const [copied, setCopied] = useState(false);

  // Withdraw tab
  const [withdrawCurrency, setWithdrawCurrency] = useState<CryptoCurrency>('BTC');
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(DEPOSIT_ADDRESSES[depositCurrency]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleWithdraw(e: FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setError('Enter a valid amount greater than 0.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/crypto/withdraw', {
        currency: withdrawCurrency,
        amount: amountNum,
        destination,
      });
      setSuccess(true);
      setAmount('');
      setDestination('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Withdrawal failed.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'deposit', label: 'Deposit' },
    { key: 'withdraw', label: 'Withdraw' },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Crypto</h1>
        <p className="text-[#9ca3af] mt-1">Deposit or withdraw cryptocurrency</p>
      </div>

      <div className="flex border-b border-[#222222] gap-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-[#6366f1] text-white'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'deposit' && (
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-5">
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">Currency</label>
            <select
              value={depositCurrency}
              onChange={(e) => {
                setDepositCurrency(e.target.value as CryptoCurrency);
                setCopied(false);
              }}
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
            >
              <option value="BTC">BTC – Bitcoin</option>
              <option value="USDT">USDT – Tether</option>
            </select>
          </div>

          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">
              Deposit Address
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={DEPOSIT_ADDRESSES[depositCurrency]}
                className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 flex-1 text-sm font-mono focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="p-3 rounded-lg bg-[#111111] border border-[#222222] text-[#9ca3af] hover:text-white transition-colors shrink-0"
                title="Copy address"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="w-40 h-40 bg-[#111111] border border-[#222222] rounded-xl flex items-center justify-center">
              <span className="text-[#9ca3af] text-sm">QR Code</span>
            </div>
            <p className="text-xs text-[#9ca3af]">{depositCurrency} deposit address</p>
          </div>

          <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10">
            <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">
              Send only <strong>{depositCurrency}</strong> to this address. Sending any other
              cryptocurrency may result in permanent loss of funds.
            </p>
          </div>
        </div>
      )}

      {tab === 'withdraw' && (
        <div className="space-y-4">
          {success && (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400">
              <Check className="w-5 h-5 shrink-0" />
              <p className="text-sm font-semibold">Withdrawal submitted successfully!</p>
            </div>
          )}
          {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
          <form
            onSubmit={handleWithdraw}
            className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
          >
            <div>
              <label className="block text-[#9ca3af] text-sm font-medium mb-2">Currency</label>
              <select
                value={withdrawCurrency}
                onChange={(e) => {
                  setWithdrawCurrency(e.target.value as CryptoCurrency);
                  setSuccess(false);
                }}
                className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
              >
                <option value="BTC">BTC – Bitcoin</option>
                <option value="USDT">USDT – Tether</option>
              </select>
            </div>

            <div>
              <label className="block text-[#9ca3af] text-sm font-medium mb-2">Amount</label>
              <input
                type="number"
                step="0.00000001"
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
                Destination Address
              </label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                placeholder={withdrawCurrency === 'BTC' ? 'bc1q…' : 'T…'}
                className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
              />
            </div>

            <div className="flex justify-between items-center py-2 border-t border-[#222222]">
              <span className="text-sm text-[#9ca3af]">Network Fee</span>
              <span className="text-sm text-white">{NETWORK_FEES[withdrawCurrency]}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Submitting…
                </>
              ) : (
                'Withdraw'
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
