import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import PageLoader from '@/components/ui/PageLoader';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ErrorMessage';
import { getById } from '@/api/transactions';
import type { Transaction } from '@/types';

const TYPE_LABELS: Record<Transaction['type'], string> = {
  deposit: 'Deposit',
  withdrawal: 'Withdrawal',
  transfer_in: 'Transfer in',
  transfer_out: 'Transfer out',
  payment: 'Payment',
  refund: 'Refund',
};

const TYPE_BADGE: Record<Transaction['type'], string> = {
  deposit: 'badge badge-deposit',
  withdrawal: 'badge badge-withdraw',
  transfer_in: 'badge badge-transfer',
  transfer_out: 'badge badge-transfer',
  payment: 'badge badge-pending',
  refund: 'badge badge-neutral',
};

const STATUS_BADGE: Record<Transaction['status'], string> = {
  completed: 'badge badge-success',
  pending: 'badge badge-pending',
  failed: 'badge badge-failed',
  cancelled: 'badge badge-neutral',
};

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="detail-row">
      <span className="detail-row__label">{label}</span>
      <div className="detail-row__value">{children}</div>
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

  if (isLoading) return <PageLoader label="Loading transaction…" />;

  if (error || !transaction) {
    return (
      <div style={{ maxWidth: 520, margin: '0 auto' }}>
        <Link to="/transactions" className="vault-link" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13 }}>
          <ArrowLeft size={14} />
          Back to transactions
        </Link>
        <ErrorMessage message={error ?? 'Transaction not found.'} />
      </div>
    );
  }

  const isCredit = transaction.type === 'deposit' || transaction.type === 'transfer_in';

  return (
    <div style={{ maxWidth: 560, margin: '0 auto' }}>
      <PageHeader
        title={`Transaction #${transaction.id}`}
        subtitle={new Date(transaction.created_at).toLocaleString(undefined, {
          dateStyle: 'medium',
          timeStyle: 'short',
        })}
        action={
          <Button variant="ghost" size="sm" onClick={() => navigate('/transactions')}>
            <ArrowLeft size={14} />
            Back
          </Button>
        }
      />

      <Card>
        <DetailRow label="Type">
          <span className={TYPE_BADGE[transaction.type]}>
            <span className="badge-dot" />
            {TYPE_LABELS[transaction.type]}
          </span>
        </DetailRow>
        <DetailRow label="Status">
          <span className={STATUS_BADGE[transaction.status]}>
            <span className="badge-dot" />
            {transaction.status}
          </span>
        </DetailRow>
        <DetailRow label="Amount">
          <span style={{ color: isCredit ? 'var(--success)' : 'var(--text)' }}>
            {isCredit ? '+' : '−'}
            {transaction.currency} {fmtNum(transaction.amount)}
          </span>
        </DetailRow>
        <DetailRow label="Fee">
          {transaction.currency} {fmtNum(transaction.fee)}
        </DetailRow>
        <DetailRow label="Net">
          {transaction.currency} {fmtNum(transaction.amount - transaction.fee)}
        </DetailRow>
        <DetailRow label="Description">
          {transaction.description || <span style={{ color: 'var(--text-muted)' }}>—</span>}
        </DetailRow>
        <DetailRow label="Reference">
          <span className="mono">#{transaction.id}</span>
        </DetailRow>
      </Card>
    </div>
  );
}
