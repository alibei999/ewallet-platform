import { useEffect, useState } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/api/axios';
import type { Transaction } from '@/types';

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

const TRANSACTION_TYPES: Transaction['type'][] = [
  'deposit',
  'withdrawal',
  'transfer_in',
  'transfer_out',
  'payment',
  'refund',
];

const TRANSACTION_STATUSES: Transaction['status'][] = [
  'completed',
  'pending',
  'failed',
  'cancelled',
];

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<Transaction['type'] | ''>('');
  const [statusFilter, setStatusFilter] = useState<Transaction['status'] | ''>('');

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string> = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;

    api
      .get<{ data: Transaction[]; total: number }>('/admin/transactions', { params })
      .then(({ data }) => {
        setTransactions(data.data);
        setTotal(data.total);
      })
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setIsLoading(false));
  }, [typeFilter, statusFilter]);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">All Transactions</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">
            ADMIN
          </span>
        </div>
        <p className="text-[#9ca3af] mt-1">
          {isLoading
            ? 'Loading…'
            : `${total} total transaction${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-4 flex flex-wrap gap-3">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as Transaction['type'] | '')}
          className="bg-[#111111] border border-[#222222] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
        >
          <option value="">All Types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>
              {TYPE_LABELS[t]}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Transaction['status'] | '')}
          className="bg-[#111111] border border-[#222222] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
        >
          <option value="">All Statuses</option>
          {TRANSACTION_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>

        {(typeFilter || statusFilter) && (
          <button
            onClick={() => {
              setTypeFilter('');
              setStatusFilter('');
            }}
            className="text-sm text-[#9ca3af] hover:text-white transition-colors underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-[#9ca3af] text-sm text-center py-16">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[650px]">
              <thead>
                <tr className="border-b border-[#222222]">
                  {['ID', 'Type', 'Amount', 'Currency', 'Status', 'Date'].map((h) => (
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
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[#222222] last:border-0">
                    <td className="px-4 py-3 text-sm text-[#9ca3af] font-mono">
                      #{String(tx.id).padStart(6, '0')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[tx.type]}`}
                      >
                        {TYPE_LABELS[tx.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white text-right font-medium whitespace-nowrap">
                      {fmtNum(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af]">{tx.currency}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af] whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
