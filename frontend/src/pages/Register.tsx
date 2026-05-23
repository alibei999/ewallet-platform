import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { register as registerApi } from '@/api/auth';
import ErrorMessage from '@/components/ErrorMessage';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function Register() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      await registerApi({ first_name: firstName, last_name: lastName, email, password });
      navigate('/login', { state: { success: 'Account created! Please sign in.' } });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Registration failed.',
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">eWallet</h1>
          <p className="text-[#9ca3af] mt-2">Create your account</p>
        </div>

        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6">
          {error && (
            <ErrorMessage
              message={error}
              onDismiss={() => setError(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  autoComplete="given-name"
                  placeholder="John"
                  className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
                />
              </div>
              <div>
                <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  autoComplete="family-name"
                  placeholder="Doe"
                  className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
              />
            </div>

            <div>
              <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                minLength={8}
                className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
              />
            </div>

            <div>
              <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                placeholder="Repeat your password"
                className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Creating account…</span>
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-[#9ca3af] mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-[#6366f1] hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
