import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { login as loginApi } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import AuthLayout from '@/components/ui/AuthLayout';
import ErrorMessage from '@/components/ErrorMessage';
import FormField from '@/components/ui/FormField';
import Button from '@/components/ui/Button';
import SuccessBanner from '@/components/ui/SuccessBanner';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const successMessage = (location.state as { success?: string } | null)?.success;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const data = await loginApi({ email, password });
      login(data.access_token, data.refresh_token, data.user);
      navigate('/dashboard');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Invalid email or password.',
        );
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to manage your wallets, transfers, and merchant tools."
      showLogo={false}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </>
      }
    >
      {successMessage && <SuccessBanner message={successMessage} />}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} className="mb-4" />}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <FormField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
        />
        <FormField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="Your password"
        />
        <Button type="submit" loading={isLoading} style={{ width: '100%', marginTop: 4 }}>
          Sign in
        </Button>
      </form>
    </AuthLayout>
  );
}
