import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Clock, CheckCircle, XCircle, FileText } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/api/axios';

interface KYCRecord {
  id: number;
  user_id: number;
  full_name: string;
  id_number: string;
  id_type: string;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  created_at: string;
}

type FilterTab = 'all' | 'pending' | 'approved' | 'rejected';

const STATUS_BADGE: Record<KYCRecord['status'], string> = {
  pending: 'badge badge-pending',
  approved: 'badge badge-success',
  rejected: 'badge badge-failed',
};

function StatCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: number; color: string }) {
  return (
    <div className="stat-card">
      <div style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: `${color}22`, border: `1px solid ${color}44`, color }}>
        <Icon size={18} />
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginTop: 16, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function AdminKYC() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api.get<KYCRecord[]>('/admin/kyc')
      .then(({ data }) => setRecords(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleApprove(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/kyc/${id}/approve`);
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError((err.response?.data as { message?: string })?.message ?? 'Failed to approve.');
      else setError('Something went wrong.');
    } finally { setActionLoading(null); }
  }

  async function handleReject(e: FormEvent) {
    e.preventDefault();
    if (rejectId === null) return;
    setActionLoading(rejectId);
    try {
      await api.post(`/admin/kyc/${rejectId}/reject`, { reason: rejectReason });
      setRecords((prev) => prev.map((r) => r.id === rejectId ? { ...r, status: 'rejected', rejection_reason: rejectReason } : r));
      setRejectId(null);
      setRejectReason('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError((err.response?.data as { message?: string })?.message ?? 'Failed to reject.');
      else setError('Something went wrong.');
    } finally { setActionLoading(null); }
  }

  const filtered = filterTab === 'all' ? records : records.filter((r) => r.status === filterTab);
  const pending = records.filter((r) => r.status === 'pending').length;
  const approved = records.filter((r) => r.status === 'approved').length;
  const rejected = records.filter((r) => r.status === 'rejected').length;

  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>KYC moderation</h1>
          <span className="badge badge-failed" style={{ fontSize: 10, letterSpacing: '0.08em' }}>ADMIN</span>
        </div>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Review and approve identity verifications</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Reject modal */}
      {rejectId !== null && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 28, width: '100%', maxWidth: 440 }}>
            <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 20px', color: 'var(--text)' }}>Reject KYC</h3>
            <form onSubmit={handleReject}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Rejection reason</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required rows={3}
                  placeholder="Explain why this KYC is being rejected…"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text)', fontSize: 14, outline: 'none', resize: 'none', width: '100%', boxSizing: 'border-box' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => { setRejectId(null); setRejectReason(''); }}
                  style={{ flex: 1, height: 40, borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={actionLoading === rejectId}
                  style={{ flex: 1, height: 40, borderRadius: 10, background: 'rgba(239,68,68,0.8)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: actionLoading === rejectId ? 0.5 : 1 }}>
                  {actionLoading === rejectId ? <LoadingSpinner size="sm" /> : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={FileText} label="Total" value={records.length} color="var(--accent)" />
        <StatCard icon={Clock} label="Pending" value={pending} color="var(--warning)" />
        <StatCard icon={CheckCircle} label="Approved" value={approved} color="var(--success)" />
        <StatCard icon={XCircle} label="Rejected" value={rejected} color="var(--error)" />
      </div>

      {/* Filter tabs */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div className="tabs">
          {(['all', 'pending', 'approved', 'rejected'] as FilterTab[]).map((key) => (
            <div key={key} className={`tab ${filterTab === key ? 'active' : ''}`} onClick={() => setFilterTab(key)} style={{ textTransform: 'capitalize' }}>
              {key}{key !== 'all' && <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>({records.filter((r) => r.status === key).length})</span>}
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 14 }}>No records found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 700 }}>
              <thead>
                <tr>
                  <th>Full name</th><th>ID number</th><th>ID type</th><th>Status</th><th>Submitted</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.id} style={{ background: r.status === 'pending' ? 'rgba(245,158,11,0.03)' : undefined }}>
                    <td className="txt">{r.full_name}</td>
                    <td className="txt mono">{r.id_number}</td>
                    <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{r.id_type}</td>
                    <td>
                      <span className={STATUS_BADGE[r.status]}><span className="badge-dot" />{r.status}</span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td>
                      {r.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleApprove(r.id)} disabled={actionLoading === r.id}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(34,197,94,0.12)', color: 'var(--success)', opacity: actionLoading === r.id ? 0.5 : 1 }}>
                            {actionLoading === r.id ? <LoadingSpinner size="sm" /> : 'Approve'}
                          </button>
                          <button onClick={() => { setRejectId(r.id); setRejectReason(''); }} disabled={actionLoading === r.id}
                            style={{ display: 'inline-flex', alignItems: 'center', height: 28, padding: '0 10px', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer', background: 'rgba(239,68,68,0.12)', color: 'var(--error)', opacity: actionLoading === r.id ? 0.5 : 1 }}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>—</span>
                      )}
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
