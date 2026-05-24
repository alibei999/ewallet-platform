import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
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

const STATUS_COLORS: Record<KYCRecord['status'], string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  approved: 'bg-green-500/15 text-green-400',
  rejected: 'bg-red-500/15 text-red-400',
};

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminKYC() {
  const [records, setRecords] = useState<KYCRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [rejectId, setRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    api
      .get<KYCRecord[]>('/admin/kyc')
      .then(({ data }) => setRecords(data))
      .catch(() => setError('Failed to load KYC records.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleApprove(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/kyc/${id}/approve`);
      setRecords((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status: 'approved' } : r)),
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Failed to approve.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(e: FormEvent) {
    e.preventDefault();
    if (rejectId === null) return;
    setActionLoading(rejectId);
    try {
      await api.post(`/admin/kyc/${rejectId}/reject`, { reason: rejectReason });
      setRecords((prev) =>
        prev.map((r) =>
          r.id === rejectId
            ? { ...r, status: 'rejected', rejection_reason: rejectReason }
            : r,
        ),
      );
      setRejectId(null);
      setRejectReason('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Failed to reject.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setActionLoading(null);
    }
  }

  const filtered =
    filterTab === 'all' ? records : records.filter((r) => r.status === filterTab);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">KYC Moderation</h1>
        <p className="text-[#9ca3af] mt-1">Review and approve identity verifications</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {rejectId !== null && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 w-full max-w-md space-y-4">
            <h3 className="text-white font-semibold">Reject KYC</h3>
            <form onSubmit={handleReject} className="space-y-4">
              <div>
                <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                  rows={3}
                  placeholder="Explain why this KYC is being rejected…"
                  className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setRejectId(null);
                    setRejectReason('');
                  }}
                  className="flex-1 bg-[#111111] border border-[#222222] text-white font-semibold py-2.5 rounded-lg hover:border-[#444444] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading === rejectId}
                  className="flex-1 bg-red-500/80 hover:bg-red-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {actionLoading === rejectId ? <LoadingSpinner size="sm" /> : 'Reject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex border-b border-[#222222] gap-6">
        {FILTER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilterTab(t.key)}
            className={`pb-3 text-sm font-medium transition-colors ${
              filterTab === t.key
                ? 'border-b-2 border-[#6366f1] text-white'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            {t.label}
            {t.key !== 'all' && (
              <span className="ml-1.5 text-xs opacity-70">
                ({records.filter((r) => r.status === t.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-[#9ca3af] text-sm text-center py-16">No records found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-[#222222]">
                  {['Full Name', 'ID Number', 'Status', 'Submitted', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className="text-xs font-medium text-[#9ca3af] px-4 py-3 text-left"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.id}
                    className={`border-b border-[#222222] last:border-0 ${
                      r.status === 'pending' ? 'bg-yellow-500/5' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-white">{r.full_name}</td>
                    <td className="px-4 py-3 text-sm text-white font-mono">{r.id_number}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status]}`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af] whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {r.status === 'pending' ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            disabled={actionLoading === r.id}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-500/15 text-green-400 hover:bg-green-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {actionLoading === r.id ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              'Approve'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setRejectId(r.id);
                              setRejectReason('');
                            }}
                            disabled={actionLoading === r.id}
                            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#9ca3af]">—</span>
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
