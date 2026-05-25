import { useEffect, useState, useRef } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Copy, Eye, EyeOff, Check, Plus, Zap, FileText, Globe } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/ui/PageHeader';
import PageLoader from '@/components/ui/PageLoader';
import { getMerchantInfo, registerMerchant, getInvoices, createInvoice, getWebhookLogs } from '@/api/merchant';
import type { Merchant, Invoice, WebhookLog } from '@/types';

type Tab = 'overview' | 'invoices' | 'webhooks';

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB'] as const;

const INVOICE_STATUS_BADGE: Record<Invoice['status'], string> = {
  pending: 'badge badge-pending',
  paid: 'badge badge-success',
  expired: 'badge badge-neutral',
  cancelled: 'badge badge-failed',
};

function fmtNum(n: number) {
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RowLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function MerchantPage() {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');
  const [error, setError] = useState<string | null>(null);

  const [regBusiness, setRegBusiness] = useState('');
  const [regWebhook, setRegWebhook] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

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
      getInvoices({ limit: 50 }).then((res) => setInvoices(res.data)).catch(() => {}).finally(() => setInvoicesLoading(false));
    }
    if (tab === 'webhooks' && !webhooksFetchedRef.current) {
      webhooksFetchedRef.current = true;
      setWebhooksLoading(true);
      getWebhookLogs({ limit: 50 }).then((res) => setWebhooks(res.data)).catch(() => {}).finally(() => setWebhooksLoading(false));
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
      if (axios.isAxiosError(err)) setError((err.response?.data as { message?: string })?.message ?? 'Registration failed.');
      else setError('Something went wrong.');
    } finally { setIsRegistering(false); }
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
      const inv = await createInvoice({ order_id: invOrderId, amount: parseFloat(invAmount), currency: invCurrency, description: invDescription, expires_in_minutes: parseInt(invExpires) || 60 });
      setInvoices((prev) => [inv, ...prev]);
      setShowCreateForm(false);
      setInvOrderId(''); setInvAmount(''); setInvDescription('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setInvoiceError((err.response?.data as { message?: string })?.message ?? 'Failed to create invoice.');
      else setInvoiceError('Something went wrong.');
    } finally { setIsCreating(false); }
  }

  if (isLoading) return <PageLoader label="Loading merchant portal…" />;

  const pageHeader = (
    <PageHeader
      title="Merchant portal"
      subtitle={
        merchant
          ? `${merchant.business_name} · accept payments via API and invoices`
          : 'Register your business to create invoices and receive webhook events'
      }
    />
  );

  if (!merchant) {
    return (
      <div>
        {pageHeader}
        {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}
        <div className="merchant-grid-2 merchant-grid-2--narrow">
          <form onSubmit={handleRegister} style={{ display: 'flex', minHeight: 0 }}>
            <div className="merchant-card merchant-card--column" style={{ flex: 1, width: '100%' }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 20px', color: 'var(--text)' }}>Register as Merchant</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Business name</label>
                  <input className="vault-input" type="text" value={regBusiness} onChange={(e) => setRegBusiness(e.target.value)} placeholder="Acme Corp" required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Webhook URL</label>
                  <input className="vault-input" type="url" value={regWebhook} onChange={(e) => setRegWebhook(e.target.value)} placeholder="https://yourdomain.com/webhook" required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto', paddingTop: 24 }}>
                <button type="submit" disabled={isRegistering}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isRegistering ? 0.5 : 1 }}>
                  {isRegistering ? <LoadingSpinner size="sm" /> : null}
                  Register
                </button>
              </div>
            </div>
          </form>

          <div className="merchant-card merchant-card--column">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>What you get</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { label: 'Accept payments via API', desc: 'Integrate payment collection into any app or website' },
                { label: 'Create invoices', desc: 'Generate and track payment invoices with expiry timers' },
                { label: 'Webhook notifications', desc: 'Receive real-time events on payment status changes' },
                { label: 'Transaction history', desc: 'Full audit log of all merchant payment activity' },
              ].map(({ label, desc }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1, color: 'var(--success)' }}>
                    <Check size={12} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const paidInvoices = invoices.filter((i) => i.status === 'paid');
  const revenue = paidInvoices.reduce((s, i) => s + i.amount, 0);

  return (
    <div>
      {pageHeader}
      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {/* Tab bar */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div className="tabs">
          {([
            { key: 'overview', label: 'Overview', Icon: Zap },
            { key: 'invoices', label: 'Invoices', Icon: FileText },
            { key: 'webhooks', label: 'Webhooks', Icon: Globe },
          ] as { key: Tab; label: string; Icon: React.ElementType }[]).map(({ key, label, Icon }) => (
            <div key={key} className={`tab ${tab === key ? 'active' : ''}`} onClick={() => setTab(key)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Icon size={13} />{label}
            </div>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <div className="merchant-grid-2">
          {/* Business info */}
          <div className="merchant-card merchant-card--column">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>Business info</div>
            <RowLine label="Business name" value={merchant.business_name} />
            <RowLine label="Status" value={
              <span className={`badge ${merchant.is_active ? 'badge-success' : 'badge-failed'}`}>
                <span className="badge-dot" />{merchant.is_active ? 'Active' : 'Inactive'}
              </span>
            } />
            <RowLine label="Webhook URL" value={<span style={{ fontSize: 12, color: 'var(--accent)' }}>{merchant.webhook_url}</span>} />
          </div>

          {/* Stats */}
          <div className="merchant-card merchant-card--column">
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>Stats</div>
            <RowLine label="Total invoices" value={invoices.length || '—'} />
            <RowLine label="Paid invoices" value={paidInvoices.length || '—'} />
            <RowLine label="Revenue" value={revenue > 0 ? `$${fmtNum(revenue)}` : '—'} />
          </div>

          {/* API credentials */}
          <div className="merchant-card" style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>API credentials</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Secret key</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type={showKey ? 'text' : 'password'} readOnly value={merchant.api_key}
                  style={{ flex: 1, height: 40, padding: '0 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-mono)', outline: 'none' }} />
                <button onClick={() => setShowKey((v) => !v)}
                  style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={handleCopyKey}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, background: copied ? 'rgba(34,197,94,0.1)' : 'var(--surface)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, color: copied ? 'var(--success)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'invoices' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{invoices.length} invoice{invoices.length !== 1 ? 's' : ''}</span>
            <button onClick={() => setShowCreateForm((v) => !v)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 14px', borderRadius: 10, background: showCreateForm ? 'transparent' : 'var(--accent)', border: showCreateForm ? '1px solid var(--border)' : 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={13} />{showCreateForm ? 'Cancel' : 'New invoice'}
            </button>
          </div>

          {showCreateForm && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 16px', color: 'var(--text)' }}>Create invoice</h3>
              {invoiceError && <ErrorMessage message={invoiceError} onDismiss={() => setInvoiceError(null)} />}
              <form onSubmit={handleCreateInvoice}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Order ID</label>
                    <input className="vault-input" value={invOrderId} onChange={(e) => setInvOrderId(e.target.value)} placeholder="ORD-001" required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Currency</label>
                    <select className="vault-input" value={invCurrency} onChange={(e) => setInvCurrency(e.target.value)}>
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Amount</label>
                    <input className="vault-input" type="number" step="0.01" min="0" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} placeholder="0.00" required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Expires in (min)</label>
                    <input className="vault-input" type="number" min="1" value={invExpires} onChange={(e) => setInvExpires(e.target.value)} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Description</label>
                    <input className="vault-input" value={invDescription} onChange={(e) => setInvDescription(e.target.value)} placeholder="Optional description" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={isCreating}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isCreating ? 0.5 : 1 }}>
                    {isCreating ? <LoadingSpinner size="sm" /> : <Plus size={13} />}Create
                  </button>
                </div>
              </form>
            </div>
          )}

          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
            {invoicesLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}><LoadingSpinner size="lg" /></div>
            ) : invoices.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 14 }}>No invoices yet</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ minWidth: 600 }}>
                  <thead>
                    <tr>
                      <th>Order ID</th><th>Amount</th><th>Currency</th><th>Status</th><th>Expires</th><th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="txt mono">{inv.order_id}</td>
                        <td className="txt" style={{ textAlign: 'right' }}>{fmtNum(inv.amount)}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 13 }}>{inv.currency}</td>
                        <td><span className={INVOICE_STATUS_BADGE[inv.status]}><span className="badge-dot" />{inv.status}</span></td>
                        <td className="mono" style={{ fontSize: 12 }}>{new Date(inv.expires_at).toLocaleString()}</td>
                        <td className="mono" style={{ fontSize: 12 }}>{new Date(inv.created_at).toLocaleDateString()}</td>
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
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}>
          {webhooksLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 64 }}><LoadingSpinner size="lg" /></div>
          ) : webhooks.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '64px 0', color: 'var(--text-muted)', fontSize: 14 }}>No webhook logs yet</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl" style={{ minWidth: 550 }}>
                <thead>
                  <tr>
                    <th>Event</th><th>Status code</th><th>Delivered</th><th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {webhooks.map((wh) => (
                    <tr key={wh.id}>
                      <td className="txt mono">{wh.event}</td>
                      <td>
                        <span className={`badge ${wh.status_code >= 200 && wh.status_code < 300 ? 'badge-success' : 'badge-failed'}`}>
                          <span className="badge-dot" />{wh.status_code}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${wh.delivered_at ? 'badge-success' : 'badge-failed'}`}>
                          <span className="badge-dot" />{wh.delivered_at ? 'Yes' : 'No'}
                        </span>
                      </td>
                      <td className="mono" style={{ fontSize: 12 }}>{wh.delivered_at ? new Date(wh.delivered_at).toLocaleString() : '—'}</td>
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
