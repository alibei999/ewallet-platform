import { useEffect, useState } from 'react';
import axios from 'axios';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import type { User } from '@/types';

type UserWithMeta = User & { created_at?: string };

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<UserWithMeta[]>('/admin/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Failed to load users.'))
      .finally(() => setIsLoading(false));
  }, []);

  async function handleBlock(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/block`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: false } : u)));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Failed to block user.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnblock(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/users/${id}/unblock`);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: true } : u)));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Failed to unblock user.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setActionLoading(null);
    }
  }

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
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white">Users</h1>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-red-500/15 text-red-400">
            ADMIN
          </span>
        </div>
        <p className="text-[#9ca3af] mt-1">
          Manage platform users · {users.length} total
        </p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl overflow-hidden">
        {users.length === 0 ? (
          <p className="text-[#9ca3af] text-sm text-center py-16">No users found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[750px]">
              <thead>
                <tr className="border-b border-[#222222]">
                  {['Email', 'Full Name', 'Role', 'Status', 'Created', 'Actions'].map((h) => (
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
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#222222] last:border-0">
                    <td className="px-4 py-3 text-sm text-white">{u.email}</td>
                    <td className="px-4 py-3 text-sm text-white">
                      {u.first_name} {u.last_name}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-indigo-500/15 text-indigo-400'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.is_active
                            ? 'bg-green-500/15 text-green-400'
                            : 'bg-red-500/15 text-red-400'
                        }`}
                      >
                        {u.is_active ? 'Active' : 'Blocked'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-[#9ca3af] whitespace-nowrap">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {currentUser?.id === u.id ? (
                        <span className="text-xs text-[#9ca3af] italic">You</span>
                      ) : (
                        <button
                          onClick={() =>
                            u.is_active ? handleBlock(u.id) : handleUnblock(u.id)
                          }
                          disabled={actionLoading === u.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 ${
                            u.is_active
                              ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25'
                              : 'bg-green-500/15 text-green-400 hover:bg-green-500/25'
                          }`}
                        >
                          {actionLoading === u.id ? (
                            <LoadingSpinner size="sm" />
                          ) : u.is_active ? (
                            'Block'
                          ) : (
                            'Unblock'
                          )}
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
