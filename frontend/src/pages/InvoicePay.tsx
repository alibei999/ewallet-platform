import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/api/axios';
import type { Invoice } from '@/types';

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InvoicePay() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Invoice>(`/invoices/${id}/status`)
      .then(({ data }) => setInvoice(data))
      .catch(() => setError('Invoice not found.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handlePay() {
    if (!id) return;
    setError(null);
    setIsPaying(true);
    try {
      await api.post(`/invoices/${id}/pay`);
      setPaid(true);
      setInvoice((prev) => (prev ? { ...prev, status: 'paid' } : prev));
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Payment failed.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setIsPaying(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="max-w-md mx-auto">
        <ErrorMessage message={error ?? 'Invoice not found.'} />
      </div>
    );
  }

  const isExpired =
    invoice.status === 'expired' || new Date(invoice.expires_at) < new Date();
  const isAlreadyPaid = invoice.status === 'paid' || paid;
  const isCancelled = invoice.status === 'cancelled';
  const canPay = !isExpired && !isAlreadyPaid && !isCancelled;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pay Invoice</h1>
        <p className="text-[#9ca3af] mt-1">Order #{invoice.order_id}</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {isAlreadyPaid && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-green-400">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">Payment successful!</p>
        </div>
      )}

      {isExpired && !isAlreadyPaid && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-500/30 bg-gray-500/10 text-gray-400">
          <Clock className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">This invoice has expired.</p>
        </div>
      )}

      {isCancelled && !isAlreadyPaid && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400">
          <XCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-semibold">This invoice has been cancelled.</p>
        </div>
      )}

      <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4">
        <div className="text-center space-y-1 pb-4 border-b border-[#222222]">
          <p className="text-[#9ca3af] text-sm">Amount Due</p>
          <p className="text-3xl font-bold text-white">
            {invoice.currency} {fmtNum(invoice.amount)}
          </p>
        </div>

        <div className="space-y-3">
          {invoice.description && (
            <div className="flex justify-between gap-4">
              <span className="text-sm text-[#9ca3af] shrink-0">Description</span>
              <span className="text-sm text-white text-right">{invoice.description}</span>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <span className="text-sm text-[#9ca3af] shrink-0">Order ID</span>
            <span className="text-sm text-white font-mono">{invoice.order_id}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-[#9ca3af] shrink-0">Expires At</span>
            <span className="text-sm text-white">
              {new Date(invoice.expires_at).toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-sm text-[#9ca3af] shrink-0">Status</span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                invoice.status === 'paid'
                  ? 'bg-green-500/15 text-green-400'
                  : invoice.status === 'pending'
                    ? 'bg-yellow-500/15 text-yellow-400'
                    : invoice.status === 'expired'
                      ? 'bg-gray-500/15 text-gray-400'
                      : 'bg-red-500/15 text-red-400'
              }`}
            >
              {invoice.status}
            </span>
          </div>
        </div>

        <button
          onClick={handlePay}
          disabled={!canPay || isPaying}
          className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
        >
          {isPaying ? (
            <>
              <LoadingSpinner size="sm" />
              Processing…
            </>
          ) : isAlreadyPaid ? (
            'Paid'
          ) : (
            'Pay Now'
          )}
        </button>
      </div>
    </div>
  );
}
