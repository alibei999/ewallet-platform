import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Activity, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import { getAll } from '@/api/transactions';
import type { Transaction, TransactionFilters } from '@/types';

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
const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'];
const PAGE_LIMIT = 20;

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="stat-card">
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--accent)' }}>
        <Icon size={18} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 16, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange?: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500 }}>{label}</span>
      <select
        className="vault-input"
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        style={{ height: 36, fontSize: 13, padding: '0 32px 0 12px', minWidth: 140, backgroundImage: 'linear-gradient(45deg, transparent 50%, #737373 50%), linear-gradient(135deg, #737373 50%, transparent 50%)', backgroundPosition: 'calc(100% - 16px) center, calc(100% - 11px) center', backgroundSize: '5px 5px, 5px 5px', backgroundRepeat: 'no-repeat' }}
      >
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}

export default function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Omit<TransactionFilters, 'page' | 'limit'>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    getAll({ ...filters, page, limit: PAGE_LIMIT })
      .then((res) => { setTransactions(res.data); setTotal(res.total); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_LIMIT));

  function updateFilter<K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) {
    setFilters((prev) => ({ ...prev, [key]: value || undefined }));
    setPage(1);
  }

  const totalDeposited = transactions.filter((t) => t.type === 'deposit').reduce((s, t) => s + t.amount, 0);
  const totalWithdrawn = transactions.filter((t) => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);

  function exportPDF() {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('eWallet — Transaction History', 14, 16);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 24);

    const cols = [14, 38, 72, 102, 124, 148, 170];
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    ['Date', 'Type', 'Amount', 'Currency', 'Fee', 'Status', 'Description'].forEach((h, i) => doc.text(h, cols[i], 35));
    doc.line(14, 37, 196, 37);

    doc.setFont('helvetica', 'normal');
    transactions.forEach((tx, i) => {
      const y = 44 + i * 7;
      if (y > 280) return;
      doc.text(new Date(tx.created_at).toLocaleDateString(), cols[0], y);
      doc.text(TYPE_LABEL[tx.type] ?? tx.type, cols[1], y);
      doc.text(tx.amount.toFixed(2), cols[2], y);
      doc.text(tx.currency, cols[3], y);
      doc.text(tx.fee != null ? tx.fee.toFixed(2) : '—', cols[4], y);
      doc.text(tx.status, cols[5], y);
      doc.text((tx.description || '—').substring(0, 18), cols[6], y);
    });

    const footerY = Math.min(44 + transactions.length * 7 + 8, 285);
    doc.line(14, footerY - 3, 196, footerY - 3);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total: ${transactions.length} transaction${transactions.length !== 1 ? 's' : ''}`, 14, footerY + 2);

    doc.save('transactions.pdf');
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Transactions</h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>All inbound and outbound activity</p>
        </div>
        <button onClick={exportPDF} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Download size={14} /> Export PDF
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Activity}   label="Total (this page)" value={String(transactions.length)} />
        <StatCard icon={TrendingUp} label="Volume"            value={`$${(totalDeposited + totalWithdrawn).toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
        <StatCard icon={ArrowUp}    label="Inflow"            value={`$${totalDeposited.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
        <StatCard icon={ArrowDown}  label="Outflow"           value={`$${totalWithdrawn.toLocaleString('en-US', { maximumFractionDigits: 0 })}`} />
      </div>

      {/* Filters */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <FilterSelect label="Type" value={filters.type ?? ''} options={['', 'deposit', 'withdrawal', 'transfer_in', 'transfer_out']} onChange={(v) => updateFilter('type', v as Transaction['type'] | undefined)} />
          <FilterSelect label="Status" value={filters.status ?? ''} options={['', 'completed', 'pending', 'failed', 'cancelled']} onChange={(v) => updateFilter('status', v as Transaction['status'] | undefined)} />
          <FilterSelect label="Currency" value={filters.currency ?? ''} options={['', ...CURRENCIES]} onChange={(v) => updateFilter('currency', v || undefined)} />
          <div style={{ flex: 1 }} />
          <button onClick={() => { setFilters({}); setPage(1); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 12px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            <RefreshCw size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
        {isLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}>
            <LoadingSpinner size="lg" />
          </div>
        ) : transactions.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 14 }}>No transactions found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Type</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/${tx.id}`)}>
                    <td className="txt mono">#{tx.id}</td>
                    <td><span className={TYPE_BADGE[tx.type] ?? 'badge badge-neutral'}>{TYPE_LABEL[tx.type] ?? tx.type}</span></td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{tx.description || '—'}</td>
                    <td><span className={STATUS_BADGE[tx.status] ?? 'badge badge-neutral'}><span className="badge-dot" />{tx.status}</span></td>
                    <td className="mono" style={{ fontSize: 12 }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }} className="txt">
                      <span style={{ color: tx.type === 'deposit' || tx.type === 'transfer_in' ? 'var(--success)' : 'var(--text)' }}>
                        {tx.currency} {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoading && totalPages > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Showing {transactions.length} of {total}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-2)', opacity: page === 1 ? 0.4 : 1 }}
              >
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  style={{ height: 30, padding: '0 10px', borderRadius: 10, background: p === page ? 'var(--accent)' : 'transparent', border: '1px solid var(--border)', color: p === page ? 'white' : 'var(--text-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {p}
                </button>
              ))}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-2)', opacity: page === totalPages ? 0.4 : 1 }}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
