import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { getAll } from '@/api/transactions';
import type { Transaction, TransactionFilters } from '@/types';

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

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'];
const PAGE_LIMIT = 20;

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Omit<TransactionFilters, 'page' | 'limit'>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getAll({ ...filters, page, limit: PAGE_LIMIT })
      .then((res) => {
        setTransactions(res.data);
        setTotal(res.total);
      })
      .catch(() => setError('Failed to load transactions.'))
      .finally(() => setIsLoading(false));
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  function updateFilter<K extends keyof typeof filters>(
    key: K,
    value: (typeof filters)[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Transactions</h1>
        <p className="text-[#9ca3af] mt-1">Your complete transaction history</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Filters */}
      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-4 flex flex-wrap gap-3">
        <select
          value={filters.type ?? ''}
          onChange={(e) =>
            updateFilter('type', e.target.value as Transaction['type'] | undefined)
          }
          className="bg-[#111111] border border-[#222222] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
        >
          <option value="">All Types</option>
          {TRANSACTION_TYPES.map((t) => (
            <option key={t} value={t}>{TYPE_LABELS[t]}</option>
          ))}
        </select>

        <select
          value={filters.status ?? ''}
          onChange={(e) =>
            updateFilter('status', e.target.value as Transaction['status'] | undefined)
          }
          className="bg-[#111111] border border-[#222222] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
        >
          <option value="">All Statuses</option>
          {TRANSACTION_STATUSES.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>

        <select
          value={filters.currency ?? ''}
          onChange={(e) => updateFilter('currency', e.target.value || undefined)}
          className="bg-[#111111] border border-[#222222] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
        >
          <option value="">All Currencies</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <input
          type="date"
          value={filters.start_date ?? ''}
          onChange={(e) => updateFilter('start_date', e.target.value || undefined)}
          className="bg-[#111111] border border-[#222222] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.end_date ?? ''}
          onChange={(e) => updateFilter('end_date', e.target.value || undefined)}
          className="bg-[#111111] border border-[#222222] text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#6366f1] transition-colors"
          placeholder="To"
        />

        {Object.values(filters).some(Boolean) && (
          <button
            onClick={() => { setFilters({}); setPage(1); }}
            className="text-sm text-[#9ca3af] hover:text-white transition-colors underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <LoadingSpinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-[#9ca3af] text-sm text-center py-16">No transactions found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#222222]">
                  {['Date', 'Type', 'Amount', 'Currency', 'Fee', 'Status', 'Description'].map(
                    (h) => (
                      <th
                        key={h}
                        className={`text-xs font-medium text-[#9ca3af] px-4 py-3 ${
                          h === 'Amount' || h === 'Fee' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr
                    key={tx.id}
                    onClick={() => navigate(`/transactions/${tx.id}`)}
                    className="border-b border-[#222222] last:border-0 hover:bg-[#222222]/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-[#9ca3af] whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[tx.type]}`}
                      >
                        {TYPE_LABELS[tx.type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-white whitespace-nowrap">
                      {fmtNum(tx.amount)}
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af]">{tx.currency}</td>
                    <td className="px-4 py-3 text-right text-sm text-[#9ca3af] whitespace-nowrap">
                      {fmtNum(tx.fee)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[tx.status]}`}
                      >
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af] max-w-[200px] truncate">
                      {tx.description || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[#9ca3af]">
            Page {page} of {totalPages} · {total} total
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[#9ca3af] hover:text-white bg-[#1a1a1a] border border-[#222222] hover:border-[#6366f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm text-[#9ca3af] hover:text-white bg-[#1a1a1a] border border-[#222222] hover:border-[#6366f1] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
