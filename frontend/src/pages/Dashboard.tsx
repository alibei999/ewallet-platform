import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeftRight,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  TrendingUp,
  Activity,
  AlertTriangle,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { getBalance } from '@/api/wallet';
import { getAll } from '@/api/transactions';
import { getStatus } from '@/api/kyc';
import type { WalletBalance, Transaction, KYCStatus } from '@/types';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const;

const CURRENCY_FLAGS: Record<string, string> = {
  KZT: '🇰🇿',
  USD: '🇺🇸',
  EUR: '🇪🇺',
  RUB: '🇷🇺',
};

const TYPE_LABELS: Record<Transaction['type'], string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  payment: 'Payment',
  refund: 'Refund',
};

const TYPE_COLORS: Record<Transaction['type'], string> = {
  deposit: 'bg-green-500/15 text-green-400',
  withdrawal: 'bg-red-500/15 text-red-400',
  transfer_in: 'bg-indigo-500/15 text-indigo-400',
  transfer_out: 'bg-indigo-500/15 text-indigo-400',
  payment: 'bg-yellow-500/15 text-yellow-400',
  refund: 'bg-purple-500/15 text-purple-400',
};

const STATUS_COLORS: Record<Transaction['status'], string> = {
  completed: 'bg-green-500/15 text-green-400',
  pending: 'bg-yellow-500/15 text-yellow-400',
  failed: 'bg-red-500/15 text-red-400',
  cancelled: 'bg-gray-500/15 text-gray-400',
};

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function Dashboard() {
  const { user } = useAuth();
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [kyc, setKyc] = useState<KYCStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getBalance(), getAll({ limit: 100 }), getStatus()])
      .then(([bal, txRes, kycStatus]) => {
        setBalances(bal);
        setTransactions(txRes.data);
        setKyc(kycStatus);
      })
      .catch(() => setError('Failed to load dashboard data.'))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalDeposited = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSpent = transactions
    .filter(
      (t) =>
        (t.type === 'withdrawal' || t.type === 'transfer_out') &&
        t.status === 'completed',
    )
    .reduce((sum, t) => sum + t.amount, 0);

  const thisMonthCount = transactions.filter(
    (t) => new Date(t.created_at) >= thisMonthStart,
  ).length;

  const recent = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">
          {getGreeting()}, {user?.first_name || 'there'}
        </h1>
        <p className="text-[#9ca3af] mt-1">{"Here's your financial overview"}</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {kyc && kyc.status !== 'approved' && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 text-yellow-400">
          <AlertTriangle className="w-5 h-5 mt-0.5 shrink-0" />
          <span className="text-sm">
            {kyc.status === 'not_submitted' && (
              <>
                Your identity is not verified.{' '}
                <Link to="/kyc" className="underline font-medium">
                  Complete KYC
                </Link>{' '}
                to unlock all features.
              </>
            )}
            {kyc.status === 'pending' &&
              "Your KYC is under review. We'll notify you once approved."}
            {kyc.status === 'rejected' && (
              <>
                Your KYC was rejected.{' '}
                <Link to="/kyc" className="underline font-medium">
                  Resubmit
                </Link>{' '}
                with correct information.
              </>
            )}
          </span>
        </div>
      )}

      <div>
        <h2 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
          Wallet Balances
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CURRENCIES.map((currency) => {
            const bal = balances.find((b) => b.currency === currency);
            return (
              <StatCard
                key={currency}
                label={`${CURRENCY_FLAGS[currency]} ${currency}`}
                value={fmtNum(bal?.balance ?? 0)}
                subLabel="Locked"
                subValue={fmtNum(bal?.locked_balance ?? 0)}
                icon={<Wallet className="w-5 h-5" />}
              />
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Deposited"
          value={fmtNum(totalDeposited)}
          icon={<TrendingUp className="w-5 h-5" />}
          trend="up"
          trendLabel="All time"
        />
        <StatCard
          label="Total Spent"
          value={fmtNum(totalSpent)}
          icon={<ArrowUpCircle className="w-5 h-5" />}
          trend="neutral"
          trendLabel="All time"
        />
        <StatCard
          label="This Month"
          value={String(thisMonthCount)}
          subLabel="Period"
          subValue={now.toLocaleString('default', { month: 'long', year: 'numeric' })}
          icon={<Activity className="w-5 h-5" />}
        />
      </div>

      <div>
        <h2 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider mb-3">
          Quick Actions
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/transfer"
            className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            <ArrowLeftRight className="w-4 h-4" />
            Send Money
          </Link>
          <Link
            to="/deposit"
            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#222222] hover:border-[#6366f1] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            <ArrowDownCircle className="w-4 h-4" />
            Deposit
          </Link>
          <Link
            to="/withdraw"
            className="flex items-center gap-2 bg-[#1a1a1a] border border-[#222222] hover:border-[#6366f1] text-white font-semibold py-2.5 px-5 rounded-lg transition-colors text-sm"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Withdraw
          </Link>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">
            Recent Transactions
          </h2>
          <Link to="/transactions" className="text-sm text-[#6366f1] hover:underline">
            View all
          </Link>
        </div>
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl overflow-hidden">
          {recent.length === 0 ? (
            <p className="text-[#9ca3af] text-sm text-center py-10">No transactions yet</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#222222]">
                  {['Date', 'Type', 'Amount', 'Status'].map((h) => (
                    <th
                      key={h}
                      className={`text-xs font-medium text-[#9ca3af] px-4 py-3 ${
                        h === 'Amount' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#222222] last:border-0">
                    <td className="px-4 py-3 text-sm text-[#9ca3af]">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[tx.type]}`}
                      >
                        {TYPE_LABELS[tx.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white">
                      {tx.currency} {fmtNum(tx.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
