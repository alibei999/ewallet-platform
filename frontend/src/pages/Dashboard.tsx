import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Wallet, Activity, AlertTriangle,
  Send, Download, Upload, ChevronRight, X, ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getUserDisplayName } from '@/lib/userDisplay';
import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Skeleton from '@/components/ui/Skeleton';
import { useAppData } from '@/context/AppDataContext';
import { useActionModals } from '@/context/ActionModalContext';
import type { KYCStatus } from '@/types';

function fmt(n: number, ccy = 'USD') {
  const symbols: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', KZT: '₸', RUB: '₽' };
  const sym = symbols[ccy] ?? '';
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const TYPE_BADGE: Record<string, string> = {
  deposit: 'badge badge-deposit',
  withdrawal: 'badge badge-withdraw',
  transfer_in: 'badge badge-transfer',
  transfer_out: 'badge badge-transfer',
  payment: 'badge badge-pending',
  refund: 'badge badge-neutral',
};
const TYPE_LABEL: Record<string, string> = {
  deposit: 'Deposit', withdrawal: 'Withdrawal',
  transfer_in: 'Transfer In', transfer_out: 'Transfer Out',
  payment: 'Payment', refund: 'Refund',
};
const STATUS_BADGE: Record<string, string> = {
  completed: 'badge badge-success',
  pending: 'badge badge-pending',
  failed: 'badge badge-failed',
  cancelled: 'badge badge-neutral',
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function StatCard({ icon: Icon, label, value, iconColor = 'var(--accent)' }: {
  icon: React.ElementType; label: string; value: string; iconColor?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: iconColor }}>
        <Icon size={18} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 16, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { balances, transactions, totalBalanceUsd } = useAppData();
  const { openDeposit, openWithdraw, openTransfer } = useActionModals();
  const [kyc] = useState<KYCStatus | null>({ status: 'approved' });
  const [isLoading, setIsLoading] = useState(true);
  const [kycDismissed, setKycDismissed] = useState(false);
  const [activeCcy, setActiveCcy] = useState(() => balances[0]?.currency ?? 'USD');
  const [hoveredCcy, setHoveredCcy] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header__text">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="vault-grid-4" style={{ marginBottom: 24 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="stat-card">
              <Skeleton className="h-9 w-9" />
              <Skeleton className="h-8 w-28" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="vault-card" style={{ padding: 22 }}>
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-10 w-40" />
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeBalance = balances.find((b) => b.currency === activeCcy);
  const activeCcyBalance = activeBalance?.balance ?? 0;
  const lockedBalance = activeBalance?.locked_balance ?? 0;

  const activeTxs = transactions.filter((t) => t.currency === activeCcy);

  const totalDeposited = activeTxs
    .filter((t) => (t.type === 'deposit' || t.type === 'transfer_in') && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  const totalSpent = activeTxs
    .filter((t) => (t.type === 'withdrawal' || t.type === 'transfer_out') && t.status === 'completed')
    .reduce((s, t) => s + t.amount, 0);

  const recent = activeTxs.slice(0, 6);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });
  const displayName = getUserDisplayName(user).split(' ')[0];

  return (
    <div>
      <PageHeader
        title={`${getGreeting()}, ${displayName}`}
        subtitle={today}
        action={
          <Button variant="primary" size="sm" onClick={() => openDeposit()}>
            Add funds
          </Button>
        }
      />

      {/* KYC banner */}
      {kyc && kyc.status !== 'approved' && !kycDismissed && (
        <div className="kyc-banner">
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: 'rgba(245,158,11,0.15)', color: 'var(--warning)', display: 'grid', placeItems: 'center', border: '1px solid rgba(245,158,11,0.25)' }}>
            <AlertTriangle size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>Complete identity verification</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 2 }}>
              {kyc.status === 'not_submitted' && 'Verify your identity to unlock higher limits and withdrawals.'}
              {kyc.status === 'pending' && 'Your documents are under review — this usually takes up to 24 hours.'}
              {kyc.status === 'rejected' && 'Verification was declined. Update your details and submit again.'}
            </div>
          </div>
          <Link
            to="/settings?section=kyc"
            style={{
              display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 12px',
              borderRadius: 10, background: 'var(--accent)', color: 'white',
              fontSize: 12, fontWeight: 600, textDecoration: 'none', flexShrink: 0,
            }}
          >
            Continue KYC
          </Link>
          <button
            onClick={() => setKycDismissed(true)}
            style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="vault-grid-4" style={{ marginBottom: 24 }}>
        <StatCard icon={Wallet}   label={`${activeCcy} balance`} value={fmt(activeCcyBalance, activeCcy)} />
        <StatCard icon={Download} label="Money in"               value={fmt(totalDeposited, activeCcy)} iconColor="var(--success)" />
        <StatCard icon={Upload}   label="Money out"              value={fmt(totalSpent, activeCcy)}     iconColor="var(--error)" />
        <StatCard icon={Activity} label="Transactions"           value={String(activeTxs.length)} />
      </div>

      {/* Balance overview */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500 }}>
              {activeCcy} balance · available
            </div>
            <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 8, color: 'var(--text)' }}>
              {fmt(activeCcyBalance, activeCcy)}
            </div>
            {lockedBalance > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                {fmt(lockedBalance, activeCcy)} locked
              </div>
            )}
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: lockedBalance > 0 ? 2 : 4 }}>
              ≈ {fmt(totalBalanceUsd, 'USD')} total across all wallets
            </div>
          </div>
          {balances.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end', maxWidth: 360 }}>
              {balances.map((b) => (
                <button
                  key={b.currency}
                  onClick={() => setActiveCcy(b.currency)}
                  onMouseEnter={() => setHoveredCcy(b.currency)}
                  onMouseLeave={() => setHoveredCcy(null)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '7px 12px', borderRadius: 999,
                    background: activeCcy === b.currency
                      ? 'var(--accent-glow)'
                      : hoveredCcy === b.currency
                      ? 'rgba(99,102,241,0.08)'
                      : 'var(--card)',
                    border: `1px solid ${
                      activeCcy === b.currency
                        ? 'rgba(99,102,241,0.4)'
                        : hoveredCcy === b.currency
                        ? 'rgba(99,102,241,0.2)'
                        : 'var(--border)'
                    }`,
                    color: activeCcy === b.currency
                      ? 'white'
                      : hoveredCcy === b.currency
                      ? 'var(--accent)'
                      : 'var(--text)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    transition: 'background 0.15s ease, border-color 0.15s ease, color 0.15s ease',
                  }}
                >
                  {b.currency}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { icon: Send,        label: 'Send',     desc: 'To anyone in seconds',   action: () => openTransfer(activeCcy) },
            { icon: Download,    label: 'Deposit',  desc: 'Card, bank, or crypto',  action: () => openDeposit(activeCcy) },
            { icon: Upload,      label: 'Withdraw', desc: 'Out to your bank',       action: () => openWithdraw(activeCcy) },
            { icon: ArrowUpDown, label: 'Crypto',   desc: 'Deposit or withdraw crypto', action: () => navigate('/crypto') },
          ].map(({ icon: Icon, label, desc, action }) => (
            <button key={label} onClick={action} className="qa" type="button">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--accent-glow)', color: 'var(--accent)', display: 'grid', placeItems: 'center', border: '1px solid rgba(99,102,241,0.25)', flexShrink: 0 }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent transactions */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, letterSpacing: '-0.01em', color: 'var(--text)' }}>
            Recent {activeCcy} transactions
          </h2>
          <Link
            to="/transactions"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 32, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
          >
            View all <ChevronRight size={12} />
          </Link>
        </div>

        {recent.length === 0 ? (
          <EmptyState
            icon={Activity}
            title={`No ${activeCcy} transactions yet`}
            description={`Make a deposit or transfer in ${activeCcy} to see activity here.`}
            action={
              <Button variant="primary" size="sm" onClick={() => openDeposit(activeCcy)}>
                Deposit {activeCcy}
              </Button>
            }
          />
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((tx) => (
                <tr key={tx.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/${tx.id}`)}>
                  <td className="txt">
                    <div style={{ color: 'var(--text)', fontWeight: 500 }}>{tx.description || TYPE_LABEL[tx.type] || tx.type}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{tx.currency} · {new Date(tx.created_at).toLocaleDateString()}</div>
                  </td>
                  <td><span className={TYPE_BADGE[tx.type] ?? 'badge badge-neutral'}>{TYPE_LABEL[tx.type] ?? tx.type}</span></td>
                  <td><span className={STATUS_BADGE[tx.status] ?? 'badge badge-neutral'}><span className="badge-dot" />{tx.status}</span></td>
                  <td style={{ textAlign: 'right' }} className="txt">
                    <span style={{ color: tx.type === 'deposit' || tx.type === 'transfer_in' ? 'var(--success)' : 'var(--text)' }}>
                      {tx.type === 'deposit' || tx.type === 'transfer_in' ? '+' : '−'}{fmt(tx.amount, tx.currency)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
