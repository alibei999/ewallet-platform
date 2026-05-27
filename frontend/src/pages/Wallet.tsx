import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Upload, Copy, MoreHorizontal, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useAppData } from '@/context/AppDataContext';
import { useActionModals } from '@/context/ActionModalContext';
import { useToast } from '@/context/ToastContext';

const CCY_META: Record<string, { name: string; symbol: string }> = {
  KZT: { name: 'Kazakhstani Tenge', symbol: '₸' },
  USD: { name: 'US Dollar',         symbol: '$' },
  EUR: { name: 'Euro',              symbol: '€' },
  RUB: { name: 'Russian Ruble',     symbol: '₽' },
  GBP: { name: 'Pound Sterling',    symbol: '£' },
};

function fmt(n: number, ccy = 'USD') {
  const sym = CCY_META[ccy]?.symbol ?? '';
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TYPE_BADGE: Record<string, string> = {
  deposit: 'badge badge-deposit', withdrawal: 'badge badge-withdraw',
  transfer_in: 'badge badge-transfer', transfer_out: 'badge badge-transfer',
  payment: 'badge badge-pending', refund: 'badge badge-neutral',
};
const TYPE_LABEL: Record<string, string> = {
  deposit: 'Deposit', withdrawal: 'Withdrawal',
  transfer_in: 'Transfer In', transfer_out: 'Transfer Out',
  payment: 'Payment', refund: 'Refund',
};
const STATUS_BADGE: Record<string, string> = {
  completed: 'badge badge-success', pending: 'badge badge-pending',
  failed: 'badge badge-failed', cancelled: 'badge badge-neutral',
};

export default function WalletPage() {
  const navigate = useNavigate();
  const { balances, transactions } = useAppData();
  const { openAddCurrency, openTransfer, openDeposit, openWithdraw } = useActionModals();
  const { notify } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header__text">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="vault-grid-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bal-card">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-9 w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Wallet"
        subtitle="Multi-currency balances and recent wallet activity."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="md" onClick={openAddCurrency}>
              <Plus size={14} /> Add currency
            </Button>
            <Button variant="primary" size="md" onClick={() => openTransfer()}>
              <Send size={14} /> Send money
            </Button>
          </div>
        }
      />

      <div className="vault-grid-2">
        {balances.map((b) => {
          const meta = CCY_META[b.currency] ?? { name: b.currency, symbol: '' };
          return (
            <div key={b.currency} className="bal-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{b.currency}</div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{meta.name} · IBAN •••• 9821</div>
                </div>
                <button
                  onClick={() => notify({ title: 'Account options', description: 'Additional account management features are coming soon.', tone: 'info' })}
                  aria-label="Account options"
                  style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-2)', position: 'relative', zIndex: 1 }}
                >
                  <MoreHorizontal size={14} />
                </button>
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 18, color: 'var(--text)' }}>{fmt(b.balance, b.currency)}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {b.locked_balance > 0 ? `${fmt(b.locked_balance, b.currency)} locked · 1 pending transfer` : 'No funds on hold'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20, position: 'relative', zIndex: 1 }}>
                <button onClick={() => openTransfer(b.currency)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Send size={13} /> Send
                </button>
                <button onClick={() => openDeposit(b.currency)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Plus size={13} /> Add
                </button>
                <button onClick={() => openWithdraw(b.currency)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  <Upload size={13} /> Withdraw
                </button>
                <button
                  onClick={() => notify({ title: `${b.currency} details copied`, description: 'Account details are ready to share.', tone: 'success' })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer', marginLeft: 'auto' }}
                >
                  <Copy size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent activity */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', marginTop: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)', letterSpacing: '-0.01em' }}>Recent activity</h2>
          <button onClick={() => navigate('/transactions')} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            View all <ChevronRight size={12} />
          </button>
        </div>
        {transactions.length === 0 ? (
          <EmptyState
            icon={Copy}
            title="No transactions yet"
            description="Start with a deposit or send a transfer to see activity here."
            action={
              <Button variant="primary" size="sm" onClick={() => openDeposit()}>
                Add funds
              </Button>
            }
          />
        ) : (
          <table className="tbl">
            <thead><tr><th>Reference</th><th>Type</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th></tr></thead>
            <tbody>
              {transactions.slice(0, 8).map((tx) => (
                <tr key={tx.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/${tx.id}`)}>
                  <td className="txt mono">#{tx.id}</td>
                  <td><span className={TYPE_BADGE[tx.type] ?? 'badge badge-neutral'}>{TYPE_LABEL[tx.type] ?? tx.type}</span></td>
                  <td><span className={STATUS_BADGE[tx.status] ?? 'badge badge-neutral'}><span className="badge-dot" />{tx.status}</span></td>
                  <td style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }} className="txt">{fmt(tx.amount, tx.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
