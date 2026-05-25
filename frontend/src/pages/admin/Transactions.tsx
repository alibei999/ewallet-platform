import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import api from '@/api/axios';
import type { Transaction } from '@/types';

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
  completed: 'badge badge-success', pending: 'badge badge-pending',
  failed: 'badge badge-failed', cancelled: 'badge badge-neutral',
};

const TRANSACTION_TYPES: Transaction['type'][] = ['deposit', 'withdrawal', 'transfer_in', 'transfer_out', 'payment', 'refund'];
const TRANSACTION_STATUSES: Transaction['status'][] = ['completed', 'pending', 'failed', 'cancelled'];
const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'];

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500 }}>{label}</span>
      <select className="vault-input" value={value} onChange={(e) => onChange(e.target.value)}
        style={{ height: 36, fontSize: 13, padding: '0 32px 0 12px', minWidth: 140 }}>
        {options.map((o) => <option key={o} value={o}>{o || `All ${label}`}</option>)}
      </select>
    </div>
  );
}

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');

  useEffect(() => {
    setIsLoading(true);
    const params: Record<string, string> = {};
    if (typeFilter) params.type = typeFilter;
    if (statusFilter) params.status = statusFilter;
    if (currencyFilter) params.currency = currencyFilter;

    api.get<{ data: Transaction[]; total: number }>('/admin/transactions', { params })
      .then(({ data }) => { setTransactions(data.data); setTotal(data.total); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [typeFilter, statusFilter, currencyFilter]);

  function clearFilters() { setTypeFilter(''); setStatusFilter(''); setCurrencyFilter(''); }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>All transactions</h1>
          <span className="badge badge-failed" style={{ fontSize: 10, letterSpacing: '0.08em' }}>ADMIN</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>
          {isLoading ? 'Loading…' : `${total} total transaction${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FilterSelect label="Type" value={typeFilter} options={['', ...TRANSACTION_TYPES]} onChange={setTypeFilter} />
          <FilterSelect label="Status" value={statusFilter} options={['', ...TRANSACTION_STATUSES]} onChange={setStatusFilter} />
          <FilterSelect label="Currency" value={currencyFilter} options={['', ...CURRENCIES]} onChange={setCurrencyFilter} />
          <div style={{ flex: 1 }} />
          <button onClick={clearFilters}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Clear
          </button>
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}><LoadingSpinner size="lg" /></div>
        ) : transactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 14 }}>No transactions found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>ID</th><th>Type</th><th>Description</th><th>Status</th><th>Currency</th><th style={{ textAlign: 'right' }}>Amount</th><th>Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="mono" style={{ fontSize: 12, color: 'var(--text-faint)' }}>#{String(tx.id).padStart(6, '0')}</td>
                    <td><span className={TYPE_BADGE[tx.type] ?? 'badge badge-neutral'}>{TYPE_LABEL[tx.type] ?? tx.type}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{tx.description || '—'}</td>
                    <td><span className={STATUS_BADGE[tx.status] ?? 'badge badge-neutral'}><span className="badge-dot" />{tx.status}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{tx.currency}</td>
                    <td style={{ textAlign: 'right' }} className="txt">
                      <span style={{ color: tx.type === 'deposit' || tx.type === 'transfer_in' ? 'var(--success)' : 'var(--text)' }}>
                        {fmtNum(tx.amount)}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{new Date(tx.created_at).toLocaleDateString()}</td>
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
