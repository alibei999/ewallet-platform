import { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import type { User } from '@/types';

type UserWithMeta = User & { created_at?: string };

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

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get<UserWithMeta[]>('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  async function handleBlock(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/block`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError((err.response?.data as { message?: string })?.message ?? 'Failed to block user.');
      else setError('Something went wrong.');
    } finally { setActionLoading(null); }
  }

  async function handleUnblock(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/unblock`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: true } : u)));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError((err.response?.data as { message?: string })?.message ?? 'Failed to unblock user.');
      else setError('Something went wrong.');
    } finally { setActionLoading(null); }
  }

  const filtered = search
    ? users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()) || `${u.first_name} ${u.last_name}`.toLowerCase().includes(search.toLowerCase()))
    : users;

  const admins = users.filter((u) => u.role === 'admin').length;
  const active = users.filter((u) => u.is_active).length;
  const blocked = users.filter((u) => !u.is_active).length;

  if (isLoading) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 280 }}><LoadingSpinner size="lg" /></div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: 0, color: 'var(--text)' }}>Users</h1>
            <span className="badge badge-failed" style={{ fontSize: 10, letterSpacing: '0.08em' }}>ADMIN</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Manage platform users · {users.length} total</p>
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} label="Total users" value={users.length} color="var(--accent)" />
        <StatCard icon={UserCheck} label="Active" value={active} color="var(--success)" />
        <StatCard icon={UserX} label="Blocked" value={blocked} color="var(--error)" />
        <StatCard icon={Shield} label="Admins" value={admins} color="#a855f7" />
      </div>

      {/* Search */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <input className="vault-input" type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by email or name…" style={{ maxWidth: 400 }} />
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 14 }}>No users found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="tbl" style={{ minWidth: 750 }}>
              <thead>
                <tr>
                  <th>Email</th><th>Full name</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id}>
                    <td className="txt">{u.email}</td>
                    <td className="txt">{u.first_name} {u.last_name}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-transfer' : 'badge-neutral'}`}>
                        <span className="badge-dot" />{u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.is_active ? 'badge-success' : 'badge-failed'}`}>
                        <span className="badge-dot" />{u.is_active ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="mono" style={{ fontSize: 12 }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td>
                      {currentUser?.id === u.id ? (
                        <span style={{ fontSize: 12, color: 'var(--text-faint)', fontStyle: 'italic' }}>You</span>
                      ) : (
                        <button
                          onClick={() => u.is_active ? handleBlock(u.id) : handleUnblock(u.id)}
                          disabled={actionLoading === u.id}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, padding: '0 10px',
                            borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                            background: u.is_active ? 'rgba(239,68,68,0.12)' : 'rgba(34,197,94,0.12)',
                            color: u.is_active ? 'var(--error)' : 'var(--success)',
                            opacity: actionLoading === u.id ? 0.5 : 1,
                          }}>
                          {actionLoading === u.id ? <LoadingSpinner size="sm" /> : u.is_active ? 'Block' : 'Unblock'}
                        </button>
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
