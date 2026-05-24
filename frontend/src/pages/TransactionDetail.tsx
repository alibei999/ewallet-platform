import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { getById } from '@/api/transactions';
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

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3 border-b border-[#222222] last:border-0">
      <span className="text-sm text-[#9ca3af] shrink-0 w-32">{label}</span>
      <div className="text-sm text-white text-right">{children}</div>
    </div>
  );
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    getById(Number(id))
      .then(setTransaction)
      .catch(() => setError('Transaction not found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="max-w-lg mx-auto space-y-4">
        <button
          onClick={() => navigate('/transactions')}
          className="flex items-center gap-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Transactions
        </button>
        <ErrorMessage message={error ?? 'Transaction not found.'} />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <button
        onClick={() => navigate('/transactions')}
        className="flex items-center gap-2 text-sm text-[#9ca3af] hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Transactions
      </button>

      <div>
        <h1 className="text-2xl font-bold text-white">Transaction #{transaction.id}</h1>
        <p className="text-[#9ca3af] mt-1">
          {new Date(transaction.created_at).toLocaleString()}
        </p>
      </div>

      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6">
        <DetailRow label="Transaction ID">
          <span className="font-mono">#{transaction.id}</span>
        </DetailRow>

        <DetailRow label="Type">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[transaction.type]}`}
          >
            {TYPE_LABELS[transaction.type]}
          </span>
        </DetailRow>

        <DetailRow label="Status">
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[transaction.status]}`}
          >
            {transaction.status}
          </span>
        </DetailRow>

        <DetailRow label="Amount">
          <span className="font-semibold">
            {transaction.currency} {fmtNum(transaction.amount)}
          </span>
        </DetailRow>

        <DetailRow label="Fee">
          {transaction.currency} {fmtNum(transaction.fee)}
        </DetailRow>

        <DetailRow label="Net Amount">
          <span className="font-semibold">
            {transaction.currency}{' '}
            {fmtNum(transaction.amount - transaction.fee)}
          </span>
        </DetailRow>

        <DetailRow label="Currency">{transaction.currency}</DetailRow>

        <DetailRow label="Description">
          {transaction.description || <span className="text-[#9ca3af]">—</span>}
        </DetailRow>

        <DetailRow label="Date">
          {new Date(transaction.created_at).toLocaleString()}
        </DetailRow>
      </div>
    </div>
  );
}
