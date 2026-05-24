import { useEffect, useState } from 'react';
import { RefreshCw, Wallet as WalletIcon, Lock } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { getBalance } from '@/api/wallet';
import type { WalletBalance } from '@/types';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const;

const CURRENCY_META: Record<string, { flag: string; name: string }> = {
  KZT: { flag: '🇰🇿', name: 'Kazakhstani Tenge' },
  USD: { flag: '🇺🇸', name: 'US Dollar' },
  EUR: { flag: '🇪🇺', name: 'Euro' },
  RUB: { flag: '🇷🇺', name: 'Russian Ruble' },
};

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Wallet() {
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load(refresh = false) {
    if (refresh) setIsRefreshing(true);
    else setIsLoading(true);

    getBalance()
      .then(setBalances)
      .catch(() => setError('Failed to load balances.'))
      .finally(() => {
        setIsLoading(false);
        setIsRefreshing(false);
      });
  }

  useEffect(() => {
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Wallet</h1>
          <p className="text-[#9ca3af] mt-1">Your balances across all currencies</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={isRefreshing}
          className="flex items-center gap-2 text-sm text-[#9ca3af] hover:text-white bg-[#1a1a1a] border border-[#222222] hover:border-[#6366f1] px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CURRENCIES.map((currency) => {
          const bal = balances.find((b) => b.currency === currency);
          const meta = CURRENCY_META[currency];
          const balance = bal?.balance ?? 0;
          const locked = bal?.locked_balance ?? 0;
          const available = balance - locked;

          return (
            <div
              key={currency}
              className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{meta.flag}</span>
                <div>
                  <p className="text-white font-semibold">{currency}</p>
                  <p className="text-[#9ca3af] text-xs">{meta.name}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-[#9ca3af] mb-1">Total Balance</p>
                <p className="text-2xl font-bold text-white">
                  {fmtNum(balance)}{' '}
                  <span className="text-base font-normal text-[#9ca3af]">{currency}</span>
                </p>
              </div>

              <div className="border-t border-[#222222] pt-4 grid grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <WalletIcon className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#9ca3af]">Available</p>
                    <p className="text-sm font-semibold text-white">{fmtNum(available)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-yellow-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-[#9ca3af]">Locked</p>
                    <p className="text-sm font-semibold text-white">{fmtNum(locked)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
