import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Copy, Eye, EyeOff, Check } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import {
  getMerchantInfo,
  registerMerchant,
  getInvoices,
  createInvoice,
  getWebhookLogs,
} from '@/api/merchant';
import type { Merchant, Invoice, WebhookLog } from '@/types';

type Tab = 'info' | 'invoices' | 'webhooks';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const;

const INVOICE_STATUS_COLORS: Record<Invoice['status'], string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  paid: 'bg-green-500/15 text-green-400',
  expired: 'bg-gray-500/15 text-gray-400',
  cancelled: 'bg-red-500/15 text-red-400',
};

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function MerchantPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('info');
  const [error, setError] = useState<string | null>(null);

  // Registration form
  const [regBusiness, setRegBusiness] = useState('');
  const [regWebhook, setRegWebhook] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // API key visibility/copy
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [invOrderId, setInvOrderId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invCurrency, setInvCurrency] = useState('KZT');
  const [invDescription, setInvDescription] = useState('');
  const [invExpires, setInvExpires] = useState('60');
  const [isCreating, setIsCreating] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Webhook logs
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [webhooksLoading, setWebhooksLoading] = useState(false);

  const invoicesFetchedRef = useRef(false);
  const webhooksFetchedRef = useRef(false);

  useEffect(() => {
    getMerchantInfo()
      .then(setMerchant)
      .catch(() => setMerchant(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!merchant) return;
    if (tab === 'invoices' && !invoicesFetchedRef.current) {
      invoicesFetchedRef.current = true;
      setInvoicesLoading(true);
      getInvoices({ limit: 50 })
        .then((res) => setInvoices(res.data))
        .catch(() => setError('Failed to load invoices.'))
        .finally(() => setInvoicesLoading(false));
    }
    if (tab === 'webhooks' && !webhooksFetchedRef.current) {
      webhooksFetchedRef.current = true;
      setWebhooksLoading(true);
      getWebhookLogs({ limit: 50 })
        .then((res) => setWebhooks(res.data))
        .catch(() => setError('Failed to load webhook logs.'))
        .finally(() => setWebhooksLoading(false));
    }
  }, [tab, merchant]);

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsRegistering(true);
    try {
      const m = await registerMerchant({ business_name: regBusiness, webhook_url: regWebhook });
      setMerchant(m);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(
          (err.response?.data as { message?: string })?.message ?? 'Registration failed.',
        );
      } else {
        setError('Something went wrong.');
      }
    } finally {
      setIsRegistering(false);
    }
  }

  async function handleCopyKey() {
    if (!merchant) return;
    await navigator.clipboard.writeText(merchant.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleCreateInvoice(e: FormEvent) {
    e.preventDefault();
    setInvoiceError(null);
    setIsCreating(true);
    try {
      const inv = await createInvoice({
        order_id: invOrderId,
        amount: parseFloat(invAmount),
        currency: invCurrency,
        description: invDescription,
        expires_in_minutes: parseInt(invExpires) || 60,
      });
      setInvoices((prev) => [inv, ...prev]);
      setShowCreateForm(false);
      setInvOrderId('');
      setInvAmount('');
      setInvDescription('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setInvoiceError(
          (err.response?.data as { message?: string })?.message ?? 'Failed to create invoice.',
        );
      } else {
        setInvoiceError('Something went wrong.');
      }
    } finally {
      setIsCreating(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="max-w-md mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Merchant Portal</h1>
          <p className="text-[#9ca3af] mt-1">Register your business to start accepting payments</p>
        </div>
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        <form
          onSubmit={handleRegister}
          className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
        >
          <h2 className="text-white font-semibold">Register as Merchant</h2>
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">Business Name</label>
            <input
              type="text"
              value={regBusiness}
              onChange={(e) => setRegBusiness(e.target.value)}
              required
              placeholder="Acme Corp"
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
            />
          </div>
          <div>
            <label className="block text-[#9ca3af] text-sm font-medium mb-2">Webhook URL</label>
            <input
              type="url"
              value={regWebhook}
              onChange={(e) => setRegWebhook(e.target.value)}
              required
              placeholder="https://yourdomain.com/webhook"
              className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
            />
          </div>
          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isRegistering ? (
              <>
                <LoadingSpinner size="sm" />
                Registering…
              </>
            ) : (
              'Register'
            )}
          </button>
        </form>
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Info' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'webhooks', label: 'Webhook Logs' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Merchant Portal</h1>
        <p className="text-[#9ca3af] mt-1">{merchant.business_name}</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div className="flex border-b border-[#222222] gap-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`pb-3 text-sm font-medium transition-colors ${
              tab === t.key
                ? 'border-b-2 border-[#6366f1] text-white'
                : 'text-[#9ca3af] hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[#9ca3af] uppercase tracking-wide mb-1">Business Name</p>
              <p className="text-white font-semibold">{merchant.business_name}</p>
            </div>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full ${
                merchant.is_active
                  ? 'bg-green-500/15 text-green-400'
                  : 'bg-red-500/15 text-red-400'
              }`}
            >
              {merchant.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>

          <div>
            <p className="text-xs text-[#9ca3af] uppercase tracking-wide mb-2">API Key</p>
            <div className="flex items-center gap-2">
              <input
                type={showKey ? 'text' : 'password'}
                readOnly
                value={merchant.api_key}
                className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-2.5 flex-1 text-sm font-mono focus:outline-none"
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className="p-2.5 rounded-lg bg-[#111111] border border-[#222222] text-[#9ca3af] hover:text-white transition-colors"
                title={showKey ? 'Hide' : 'Show'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
              <button
                onClick={handleCopyKey}
                className="p-2.5 rounded-lg bg-[#111111] border border-[#222222] text-[#9ca3af] hover:text-white transition-colors"
                title="Copy API key"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <div>
            <p className="text-xs text-[#9ca3af] uppercase tracking-wide mb-1">Webhook URL</p>
            <p className="text-white text-sm break-all">{merchant.webhook_url}</p>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#9ca3af]">{invoices.length} invoice(s)</p>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              {showCreateForm ? 'Cancel' : '+ Create Invoice'}
            </button>
          </div>

          {showCreateForm && (
            <form
              onSubmit={handleCreateInvoice}
              className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-6 space-y-4"
            >
              <h3 className="text-white font-semibold">Create Invoice</h3>
              {invoiceError && (
                <ErrorMessage message={invoiceError} onDismiss={() => setInvoiceError(null)} />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#9ca3af] text-sm font-medium mb-2">Order ID</label>
                  <input
                    type="text"
                    value={invOrderId}
                    onChange={(e) => setInvOrderId(e.target.value)}
                    required
                    placeholder="ORD-001"
                    className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
                  />
                </div>
                <div>
                  <label className="block text-[#9ca3af] text-sm font-medium mb-2">Currency</label>
                  <select
                    value={invCurrency}
                    onChange={(e) => setInvCurrency(e.target.value)}
                    className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#9ca3af] text-sm font-medium mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
                  />
                </div>
                <div>
                  <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                    Expires In (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={invExpires}
                    onChange={(e) => setInvExpires(e.target.value)}
                    className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[#9ca3af] text-sm font-medium mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={invDescription}
                  onChange={(e) => setInvDescription(e.target.value)}
                  placeholder="Optional description"
                  className="bg-[#111111] border border-[#222222] text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1] transition-colors placeholder:text-[#9ca3af]/40"
                />
              </div>
              <button
                type="submit"
                disabled={isCreating}
                className="w-full bg-[#6366f1] hover:bg-[#5558e3] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <LoadingSpinner size="sm" />
                    Creating…
                  </>
                ) : (
                  'Create Invoice'
                )}
              </button>
            </form>
          )}

          <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl overflow-hidden">
            {invoicesLoading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner size="lg" />
              </div>
            ) : invoices.length === 0 ? (
              <p className="text-[#9ca3af] text-sm text-center py-16">No invoices yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-[#222222]">
                      {['Order ID', 'Amount', 'Currency', 'Status', 'Expires', 'Created'].map(
                        (h) => (
                          <th
                            key={h}
                            className={`text-xs font-medium text-[#9ca3af] px-4 py-3 ${
                              h === 'Amount' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr
                        key={inv.id}
                        className="border-b border-[#222222] last:border-0"
                      >
                        <td className="px-4 py-3 text-sm text-white font-mono">
                          {inv.order_id}
                        </td>
                        <td className="px-4 py-3 text-sm text-white text-right">
                          {fmtNum(inv.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#9ca3af]">{inv.currency}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${INVOICE_STATUS_COLORS[inv.status]}`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#9ca3af] whitespace-nowrap">
                          {new Date(inv.expires_at).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-[#9ca3af] whitespace-nowrap">
                          {new Date(inv.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'webhooks' && (
        <div className="bg-[#1a1a1a] border border-[#222222] rounded-xl overflow-hidden">
          {webhooksLoading ? (
            <div className="flex items-center justify-center py-16">
              <LoadingSpinner size="lg" />
            </div>
          ) : webhooks.length === 0 ? (
            <p className="text-[#9ca3af] text-sm text-center py-16">No webhook logs yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[550px]">
                <thead>
                  <tr className="border-b border-[#222222]">
                    {['Event', 'Status Code', 'Delivered', 'Date'].map((h) => (
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
                  {webhooks.map((wh) => (
                    <tr key={wh.id} className="border-b border-[#222222] last:border-0">
                      <td className="px-4 py-3 text-sm text-white font-mono">{wh.event}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            wh.status_code >= 200 && wh.status_code < 300
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {wh.status_code}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            wh.delivered_at
                              ? 'bg-green-500/15 text-green-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {wh.delivered_at ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[#9ca3af] whitespace-nowrap">
                        {wh.delivered_at
                          ? new Date(wh.delivered_at).toLocaleString()
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
