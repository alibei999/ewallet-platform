import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Plus, Upload, Copy, MoreHorizontal, ChevronRight, FileText, Lock, Unlock, Shield } from 'lucide-react';
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

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: (e: React.MouseEvent) => void;
  danger?: boolean;
}) {
  return (
    <button
      onMouseDown={(e) => e.stopPropagation()}
      onClick={onClick}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = danger
          ? 'rgba(239,68,68,0.08)'
          : 'rgba(99,102,241,0.09)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
      }}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        width: '100%', padding: '9px 14px',
        background: 'transparent', border: 'none',
        color: danger ? 'var(--error, #ef4444)' : 'var(--text)',
        fontSize: 13, fontWeight: 500, cursor: 'pointer', textAlign: 'left',
      }}
    >
      <Icon
        size={14}
        style={{ color: danger ? 'var(--error, #ef4444)' : 'var(--accent)', flexShrink: 0 }}
      />
      {label}
    </button>
  );
}

export default function WalletPage() {
  const navigate = useNavigate();
  const { balances, transactions } = useAppData();
  const { openAddCurrency, openTransfer, openDeposit, openWithdraw } = useActionModals();
  const { notify } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [frozenAccounts, setFrozenAccounts] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!openMenu) return;
    const handler = () => setOpenMenu(null);
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenu]);

  function toggleMenu(e: React.MouseEvent, ccy: string) {
    e.stopPropagation();
    e.preventDefault();
    setOpenMenu((prev) => (prev === ccy ? null : ccy));
  }

  function copyDetails(e: React.MouseEvent, ccy: string) {
    e.stopPropagation();
    setOpenMenu(null);
    navigator.clipboard.writeText(`${ccy}12 3456 7890 1234 5678 9821`).catch(() => {});
    notify({ title: 'Account details copied', description: `${ccy} IBAN has been copied to your clipboard.`, tone: 'success' });
  }

  function requestStatement(e: React.MouseEvent, ccy: string) {
    e.stopPropagation();
    setOpenMenu(null);
    notify({ title: 'Statement requested', description: `Your ${ccy} account statement will be sent to your registered email.`, tone: 'info' });
  }

  function openSpendingLimit(e: React.MouseEvent, _ccy: string) {
    e.stopPropagation();
    setOpenMenu(null);
    notify({ title: 'Spending limits', description: 'Daily and monthly limits can be configured in Settings → Security.', tone: 'info' });
  }

  function toggleFreeze(e: React.MouseEvent, ccy: string) {
    e.stopPropagation();
    setOpenMenu(null);
    setFrozenAccounts((prev) => {
      const next = new Set(prev);
      if (next.has(ccy)) {
        next.delete(ccy);
        notify({ title: `${ccy} account unfrozen`, description: 'Your account is active and ready for transactions.', tone: 'success' });
      } else {
        next.add(ccy);
        notify({ title: `${ccy} account frozen`, description: 'All outgoing transactions are temporarily suspended.', tone: 'info' });
      }
      return next;
    });
  }

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
          const isFrozen = frozenAccounts.has(b.currency);
          return (
            <div
              key={b.currency}
              className="bal-card"
              style={{ opacity: isFrozen ? 0.82 : 1, transition: 'opacity 0.2s ease' }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-faint)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                      {b.currency}
                    </div>
                    {isFrozen && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 3,
                        fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(239,68,68,0.15)', color: 'var(--error, #ef4444)',
                        border: '1px solid rgba(239,68,68,0.3)',
                      }}>
                        <Lock size={8} /> Frozen
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>{meta.name} · IBAN •••• 9821</div>
                </div>

                {/* Options menu */}
                <div style={{ position: 'relative' }} onMouseDown={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => toggleMenu(e, b.currency)}
                    aria-label="Account options"
                    aria-expanded={openMenu === b.currency}
                    style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: openMenu === b.currency ? 'rgba(99,102,241,0.15)' : 'var(--card)',
                      border: `1px solid ${openMenu === b.currency ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                      display: 'grid', placeItems: 'center', cursor: 'pointer',
                      color: openMenu === b.currency ? 'var(--accent)' : 'var(--text-2)',
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                    }}
                  >
                    <MoreHorizontal size={14} />
                  </button>

                  {openMenu === b.currency && (
                    <div style={{
                      position: 'absolute', top: 'calc(100% + 6px)', right: 0,
                      background: 'var(--card)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '4px 0', minWidth: 210, zIndex: 50,
                      boxShadow: '0 12px 40px rgba(0,0,0,0.45)',
                    }}>
                      <DropdownItem icon={Copy}     label="Copy account details" onClick={(e) => copyDetails(e, b.currency)} />
                      <DropdownItem icon={FileText}  label="Request statement"    onClick={(e) => requestStatement(e, b.currency)} />
                      <DropdownItem icon={Shield}    label="Spending limit"        onClick={(e) => openSpendingLimit(e, b.currency)} />
                      <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
                      <DropdownItem
                        icon={isFrozen ? Unlock : Lock}
                        label={isFrozen ? 'Unfreeze account' : 'Freeze account'}
                        onClick={(e) => toggleFreeze(e, b.currency)}
                        danger={!isFrozen}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div style={{
                fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 18,
                color: isFrozen ? 'var(--text-muted)' : 'var(--text)',
                transition: 'color 0.2s ease',
              }}>
                {fmt(b.balance, b.currency)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                {b.locked_balance > 0 ? `${fmt(b.locked_balance, b.currency)} locked · 1 pending transfer` : 'No funds on hold'}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 20, position: 'relative', zIndex: 1 }}>
                <button
                  onClick={() => !isFrozen && openTransfer(b.currency)}
                  disabled={isFrozen}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 12, fontWeight: 600, cursor: isFrozen ? 'not-allowed' : 'pointer', opacity: isFrozen ? 0.45 : 1, transition: 'opacity 0.2s' }}
                >
                  <Send size={13} /> Send
                </button>
                <button
                  onClick={() => openDeposit(b.currency)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                >
                  <Plus size={13} /> Add
                </button>
                <button
                  onClick={() => !isFrozen && openWithdraw(b.currency)}
                  disabled={isFrozen}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 32, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: isFrozen ? 'not-allowed' : 'pointer', opacity: isFrozen ? 0.45 : 1, transition: 'opacity 0.2s' }}
                >
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
            <thead>
              <tr>
                <th>Reference</th><th>Type</th><th>Status</th><th>Date</th><th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
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
