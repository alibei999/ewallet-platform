import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { CheckCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useAuth } from '@/context/AuthContext';
import api from '@/api/axios';
import type { User } from '@/types';

export default function Settings() {
  const { user, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  async function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      const { data } = await api.put<User>('/auth/profile', {
        first_name: firstName,
        last_name: lastName,
        phone,
      });
      setUser(data);
      setProfileSuccess(true);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setProfileError(
          (err.response?.data as { message?: string })?.message ?? 'Failed to update profile.',
        );
      } else {
        setProfileError('Something went wrong.');
      }
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordLoading(true);
    try {
      await api.put('/auth/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setPasswordError(
          (err.response?.data as { message?: string })?.message ?? 'Failed to change password.',
        );
      } else {
        setPasswordError('Something went wrong.');
      }
    } finally {
      setPasswordLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-[#9ca3af] mt-1">Manage your account preferences</p>
      </div>

      <form
        onSubmit={handleProfileSave}
        className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
      >
        <h2 className="text-white font-semibold">Profile</h2>

        {profileError && (
          <ErrorMessage message={profileError} onDismiss={() => setProfileError(null)} />
        )}
        {profileSuccess && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Profile updated successfully.
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            value={user?.email ?? ''}
            readOnly
            className="bg-[#111111] border border-[#222222] text-[#9ca3af] rounded-lg px-4 py-3 w-full cursor-not-allowed"
          />
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">Phone</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+1 (555) 000-0000"
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
          />
        </div>

        <button
          type="submit"
          disabled={profileLoading}
          className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {profileLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Saving…
            </>
          ) : (
            'Save Changes'
          )}
        </button>
      </form>

      <form
        onSubmit={handlePasswordChange}
        className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
      >
        <h2 className="text-white font-semibold">Change Password</h2>

        {passwordError && (
          <ErrorMessage message={passwordError} onDismiss={() => setPasswordError(null)} />
        )}
        {passwordSuccess && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Password changed successfully.
          </div>
        )}

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
          />
        </div>

        <div>
          <label className="block text-[#9ca3af] text-sm font-medium mb-2">
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
          />
        </div>

        <button
          type="submit"
          disabled={passwordLoading}
          className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {passwordLoading ? (
            <>
              <LoadingSpinner size="sm" />
              Updating…
            </>
          ) : (
            'Change Password'
          )}
        </button>
      </form>
    </div>
  );
}
