import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Copy, Eye, EyeOff, Check, Plus, Zap, FileText, Globe,
  Building2, TrendingUp, ShieldCheck, Code2, Clock,
  ArrowUpRight, X, ChevronDown,
} from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PageHeader from '@/components/ui/PageHeader';
import Skeleton from '@/components/ui/Skeleton';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/context/ToastContext';
import type { Invoice, WebhookLog } from '@/types';

type Tab = 'overview' | 'invoices' | 'webhooks' | 'api';
type InvoiceFilter = 'all' | Invoice['status'];

const CURRENCIES = ['KZT', 'USD', 'EUR', 'RUB', 'GBP'] as const;
const CATEGORIES = [
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS / Software' },
  { value: 'marketplace', label: 'Marketplace' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'retail', label: 'Retail' },
  { value: 'other', label: 'Other' },
];

const CCY_SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', KZT: '₸', RUB: '₽' };

interface MerchantProfile {
  id: number;
  business_name: string;
  business_category: string;
  website_url: string;
  api_key: string;
  client_secret: string;
  webhook_url: string;
  accepted_currencies: string[];
  is_active: boolean;
  created_at: string;
}

const INVOICE_STATUS_BADGE: Record<Invoice['status'], string> = {
  pending:   'badge badge-pending',
  paid:      'badge badge-success',
  expired:   'badge badge-neutral',
  cancelled: 'badge badge-failed',
};

function fmt(n: number, ccy = 'USD') {
  const sym = CCY_SYMBOLS[ccy] ?? '';
  return sym + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function timeLeft(iso: string): string {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const h = Math.floor(diff / 3_600_000);
  const m = Math.floor((diff % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function makeMockMerchant(
  name: string, category: string, website: string,
  webhook: string, currencies: string[],
): MerchantProfile {
  return {
    id: Math.floor(Math.random() * 10000),
    business_name: name,
    business_category: category,
    website_url: website,
    api_key: `sk_live_${Math.random().toString(36).slice(2, 18)}`,
    client_secret: `cs_live_${Math.random().toString(36).slice(2, 18)}`,
    webhook_url: webhook,
    accepted_currencies: currencies,
    is_active: true,
    created_at: new Date().toISOString(),
  };
}

function makeMockInvoices(): Invoice[] {
  const now = new Date();
  return [
    { id: 901, order_id: 'INV-1082', amount: 420.50, currency: 'USD', status: 'paid',      description: 'Monthly subscription',  expires_at: new Date(now.getTime() - 3_600_000).toISOString(),  paid_at: now.toISOString(), created_at: new Date(now.getTime() - 2 * 3_600_000).toISOString() },
    { id: 902, order_id: 'INV-1083', amount: 1180,   currency: 'KZT', status: 'pending',   description: 'Hardware shipment',      expires_at: new Date(now.getTime() + 6 * 3_600_000).toISOString(), created_at: new Date(now.getTime() - 3_600_000).toISOString() },
    { id: 903, order_id: 'INV-1084', amount: 89,     currency: 'USD', status: 'paid',      description: 'License renewal',        expires_at: new Date(now.getTime() - 2 * 3_600_000).toISOString(), paid_at: new Date(now.getTime() - 3_600_000).toISOString(), created_at: new Date(now.getTime() - 5 * 3_600_000).toISOString() },
    { id: 904, order_id: 'INV-1085', amount: 250,    currency: 'EUR', status: 'pending',   description: 'API usage fee',          expires_at: new Date(now.getTime() + 2 * 3_600_000).toISOString(), created_at: new Date(now.getTime() - 30 * 60_000).toISOString() },
    { id: 905, order_id: 'INV-1086', amount: 75,     currency: 'USD', status: 'expired',   description: 'Consultation fee',       expires_at: new Date(now.getTime() - 24 * 3_600_000).toISOString(), created_at: new Date(now.getTime() - 26 * 3_600_000).toISOString() },
    { id: 906, order_id: 'INV-1087', amount: 3200,   currency: 'KZT', status: 'paid',      description: 'Marketplace commission', expires_at: new Date(now.getTime() - 5 * 3_600_000).toISOString(), paid_at: new Date(now.getTime() - 6 * 3_600_000).toISOString(), created_at: new Date(now.getTime() - 8 * 3_600_000).toISOString() },
  ];
}

function makeMockWebhooks(): WebhookLog[] {
  const now = new Date();
  return [
    { id: 401, invoice_id: 901, event: 'invoice.paid',    payload: { invoice_id: 901, amount: 420.50, currency: 'USD' }, status_code: 200, delivered_at: now.toISOString() },
    { id: 402, invoice_id: 902, event: 'invoice.created', payload: { invoice_id: 902, amount: 1180, currency: 'KZT' },   status_code: 200, delivered_at: new Date(now.getTime() - 3_600_000).toISOString() },
    { id: 403, invoice_id: 903, event: 'invoice.paid',    payload: { invoice_id: 903, amount: 89, currency: 'USD' },     status_code: 200, delivered_at: new Date(now.getTime() - 2 * 3_600_000).toISOString() },
    { id: 404, invoice_id: 905, event: 'invoice.expired', payload: { invoice_id: 905, amount: 75, currency: 'USD' },     status_code: 502, delivered_at: new Date(now.getTime() - 24 * 3_600_000).toISOString() },
    { id: 405, invoice_id: 904, event: 'invoice.created', payload: { invoice_id: 904, amount: 250, currency: 'EUR' },    status_code: 200, delivered_at: new Date(now.getTime() - 30 * 60_000).toISOString() },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function MiniStatCard({
  icon: Icon, label, value, sub, color = 'var(--accent)',
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="stat-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, display: 'grid', placeItems: 'center', background: `${color}18`, border: `1px solid ${color}30`, color }}>
          <Icon size={15} />
        </div>
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text)' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--success)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}><ArrowUpRight size={11} />{sub}</div>}
      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function ApiCredentialRow({
  label, value, mono = true, onCopy,
  revealed, onReveal,
}: {
  label: string; value: string; mono?: boolean;
  onCopy: () => void; revealed?: boolean; onReveal?: () => void;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    onCopy();
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <Label>{label}</Label>
      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{
          flex: 1, height: 40, padding: '0 14px', borderRadius: 10,
          background: 'var(--surface)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', overflow: 'hidden',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
          fontSize: mono ? 12 : 13, color: 'var(--text)',
        }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
            {onReveal && !revealed
              ? '•'.repeat(Math.min(value.length, 32))
              : value}
          </span>
        </div>
        {onReveal && (
          <button onClick={onReveal} style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0 }}>
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        )}
        <button onClick={copy} style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          height: 40, padding: '0 14px', borderRadius: 10, cursor: 'pointer', flexShrink: 0,
          background: copied ? 'rgba(34,197,94,0.08)' : 'var(--surface)',
          border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
          color: copied ? 'var(--success)' : 'var(--text-muted)', fontSize: 13, fontWeight: 600,
          transition: 'all 0.15s',
        }}>
          {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MerchantPage() {
  const { notify } = useToast();

  // Registration form
  const [regBusiness, setRegBusiness] = useState('');
  const [regCategory, setRegCategory] = useState('ecommerce');
  const [regWebsite, setRegWebsite] = useState('');
  const [regWebhook, setRegWebhook] = useState('');
  const [regCurrencies, setRegCurrencies] = useState<string[]>(['KZT', 'USD']);
  const [isRegistering, setIsRegistering] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);

  // Dashboard state
  const [merchant, setMerchant] = useState<MerchantProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('overview');

  // Credentials reveal
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  // Invoices
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceFilter, setInvoiceFilter] = useState<InvoiceFilter>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [invOrderId, setInvOrderId] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invCurrency, setInvCurrency] = useState('KZT');
  const [invDescription, setInvDescription] = useState('');
  const [invExpires, setInvExpires] = useState('60');
  const [isCreating, setIsCreating] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookLog[]>([]);
  const [expandedWh, setExpandedWh] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 450);
    return () => clearTimeout(t);
  }, []);

  function toggleCurrency(ccy: string) {
    setRegCurrencies((prev) =>
      prev.includes(ccy)
        ? prev.length === 1 ? prev : prev.filter((c) => c !== ccy)
        : [...prev, ccy],
    );
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault();
    setRegError(null);
    if (!regWebhook.startsWith('https://') && !regWebhook.startsWith('http://')) {
      setRegError('Webhook URL must start with http:// or https://');
      return;
    }
    setIsRegistering(true);
    await new Promise((r) => setTimeout(r, 900));
    const m = makeMockMerchant(regBusiness, regCategory, regWebsite, regWebhook, regCurrencies);
    setMerchant(m);
    setInvoices(makeMockInvoices());
    setWebhooks(makeMockWebhooks());
    setIsRegistering(false);
    notify({ title: 'Merchant account activated', description: `${regBusiness} is now live. Your API keys are ready.`, tone: 'success' });
  }

  async function handleCreateInvoice(e: FormEvent) {
    e.preventDefault();
    setInvoiceError(null);
    const amount = parseFloat(invAmount);
    if (isNaN(amount) || amount <= 0) { setInvoiceError('Enter a valid amount.'); return; }
    setIsCreating(true);
    await new Promise((r) => setTimeout(r, 600));
    const inv: Invoice = {
      id: Math.floor(Math.random() * 90000) + 10000,
      order_id: invOrderId,
      amount,
      currency: invCurrency,
      status: 'pending',
      description: invDescription,
      expires_at: new Date(Date.now() + (parseInt(invExpires) || 60) * 60_000).toISOString(),
      created_at: new Date().toISOString(),
    };
    setInvoices((prev) => [inv, ...prev]);
    setWebhooks((prev) => [{
      id: Math.floor(Math.random() * 90000),
      invoice_id: inv.id,
      event: 'invoice.created',
      payload: { invoice_id: inv.id, amount, currency: invCurrency },
      status_code: 200,
      delivered_at: new Date().toISOString(),
    }, ...prev]);
    setShowCreateForm(false);
    setInvOrderId(''); setInvAmount(''); setInvDescription('');
    setIsCreating(false);
    notify({ title: 'Invoice created', description: `${inv.order_id} is pending payment.`, tone: 'success' });
  }

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header__text">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <Skeleton className="h-48 w-full" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 20 }}>
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // ── Registration view ────────────────────────────────────────────────────
  if (!merchant) {
    return (
      <div>
        <PageHeader
          title="Merchant portal"
          subtitle="Register your business and start accepting payments via API"
        />

        {/* Hero banner */}
        <div style={{
          background: 'linear-gradient(135deg, #12122a 0%, #0f1628 55%, #131230 100%)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 'var(--radius-card)', padding: '36px 40px',
          marginBottom: 24, position: 'relative', overflow: 'hidden',
        }}>
          {/* decorative glows */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -40, right: 120, width: 160, height: 160, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
              <Zap size={11} /> Merchant Portal
            </div>
            <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', margin: '0 0 8px' }}>
              Start accepting payments faster than ever
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px', maxWidth: 520, lineHeight: 1.6 }}>
              Integrate our payment API in minutes. Create invoices, collect in 5 currencies, and receive real-time webhook events on every status change.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {[
                { icon: Zap, label: 'Instant API access' },
                { icon: ShieldCheck, label: 'PCI DSS compliant' },
                { icon: Globe, label: '5 currencies' },
                { icon: TrendingUp, label: 'Real-time analytics' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>
                  <Icon size={12} style={{ color: 'var(--accent)' }} />{label}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Form + Features */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, alignItems: 'start' }}>
          {/* Registration form */}
          <form onSubmit={handleRegister}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 28 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 24px', color: 'var(--text)' }}>Register merchant account</h2>

              {regError && <ErrorMessage message={regError} onDismiss={() => setRegError(null)} />}

              {/* Section: Business identity */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Building2 size={11} /> Business identity
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <Field label="Business name">
                    <input className="vault-input" type="text" value={regBusiness}
                      onChange={(e) => setRegBusiness(e.target.value)}
                      placeholder="Acme Corp" required />
                  </Field>
                  <Field label="Category">
                    <select className="vault-input" value={regCategory} onChange={(e) => setRegCategory(e.target.value)}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Website URL">
                    <input className="vault-input" type="url" value={regWebsite}
                      onChange={(e) => setRegWebsite(e.target.value)}
                      placeholder="https://acmecorp.com" style={{ gridColumn: '1 / -1' }} />
                  </Field>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border-soft)', margin: '0 0 24px' }} />

              {/* Section: Integration */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Code2 size={11} /> Integration settings
                </div>
                <Field label="Webhook endpoint URL">
                  <input className="vault-input" type="url" value={regWebhook}
                    onChange={(e) => setRegWebhook(e.target.value)}
                    placeholder="https://yourdomain.com/webhooks/vault" required />
                </Field>
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 6, lineHeight: 1.5 }}>
                  We'll POST payment events to this URL. Must be publicly reachable and return 2xx.
                </p>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: 'var(--border-soft)', margin: '0 0 24px' }} />

              {/* Section: Currencies */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Globe size={11} /> Accepted currencies
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CURRENCIES.map((ccy) => {
                    const active = regCurrencies.includes(ccy);
                    return (
                      <button
                        key={ccy}
                        type="button"
                        onClick={() => toggleCurrency(ccy)}
                        style={{
                          padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                          cursor: 'pointer', transition: 'all 0.15s',
                          background: active ? 'var(--accent-glow)' : 'transparent',
                          border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                          color: active ? 'var(--accent)' : 'var(--text-muted)',
                        }}
                      >
                        {CCY_SYMBOLS[ccy]}{ccy}
                      </button>
                    );
                  })}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8, lineHeight: 1.5 }}>
                  Invoices can only be created in selected currencies. You can change this later.
                </p>
              </div>

              {/* Submit */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: 0, lineHeight: 1.5, maxWidth: 300 }}>
                  By registering you agree to the Merchant Terms of Service and API usage policies.
                </p>
                <button type="submit" disabled={isRegistering} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  height: 42, padding: '0 24px', borderRadius: 10,
                  background: 'var(--accent)', border: 'none', color: 'white',
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  opacity: isRegistering ? 0.6 : 1, transition: 'opacity 0.15s', flexShrink: 0,
                }}>
                  {isRegistering ? <LoadingSpinner size="sm" /> : <Zap size={14} />}
                  {isRegistering ? 'Activating…' : 'Create merchant account'}
                </button>
              </div>
            </div>
          </form>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Features */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 18 }}>What you'll get</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: Code2,       color: 'var(--accent)',  label: 'REST API',          desc: 'Full-featured API with SDKs for Node, Python, Go' },
                  { icon: FileText,    color: '#f59e0b',        label: 'Invoice engine',    desc: 'Create payment links with expiry, auto-notifications' },
                  { icon: Globe,       color: '#22c55e',        label: 'Webhook delivery',  desc: 'Real-time events with auto-retry and delivery logs' },
                  { icon: TrendingUp,  color: '#a78bfa',        label: 'Analytics',         desc: 'Revenue dashboard, success rates, trend charts' },
                  { icon: ShieldCheck, color: '#38bdf8',        label: 'Compliance',        desc: 'PCI DSS, GDPR-ready, audit logs for all operations' },
                ].map(({ icon: Icon, color, label, desc }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: `${color}15`, border: `1px solid ${color}30`, display: 'grid', placeItems: 'center', flexShrink: 0, color }}>
                      <Icon size={13} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>{desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* API preview snippet */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Code2 size={11} /> API preview
              </div>
              <div style={{ background: '#0a0a12', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, padding: '14px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a5b4fc', lineHeight: 1.7, overflowX: 'auto' }}>
                <span style={{ color: '#6b7280' }}>POST</span> <span style={{ color: '#e2e8f0' }}>/v1/invoices</span><br />
                Authorization: <span style={{ color: '#86efac' }}>Bearer sk_live_…</span><br />
                <br />
                {'{'}<br />
                &nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>"order_id"</span>: <span style={{ color: '#86efac' }}>"ORD-001"</span>,<br />
                &nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>"amount"</span>: <span style={{ color: '#fb923c' }}>420.50</span>,<br />
                &nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>"currency"</span>: <span style={{ color: '#86efac' }}>"USD"</span><br />
                {'}'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Dashboard ────────────────────────────────────────────────────────────
  const paidInvoices    = invoices.filter((i) => i.status === 'paid');
  const pendingInvoices = invoices.filter((i) => i.status === 'pending');
  const revenue         = paidInvoices.reduce((s, i) => s + (i.currency === 'USD' ? i.amount : i.currency === 'KZT' ? i.amount * 0.0021 : i.currency === 'EUR' ? i.amount * 1.08 : i.amount), 0);
  const successRate     = invoices.length > 0 ? Math.round((paidInvoices.length / invoices.length) * 100) : 0;
  const deliveredWh     = webhooks.filter((w) => w.status_code >= 200 && w.status_code < 300).length;

  // Revenue bar chart (5 fake historical months + current actual)
  const CHART_H = 100;
  const chartData = [
    { label: 'Dec', value: 320 },
    { label: 'Jan', value: 580 },
    { label: 'Feb', value: 420 },
    { label: 'Mar', value: 760 },
    { label: 'Apr', value: 640 },
    { label: 'May', value: Math.round(revenue) || 100 },
  ];
  const chartMax = Math.max(...chartData.map((d) => d.value), 1);

  const filteredInvoices = invoiceFilter === 'all'
    ? invoices
    : invoices.filter((i) => i.status === invoiceFilter);

  const TABS: { key: Tab; label: string; Icon: React.ElementType }[] = [
    { key: 'overview',  label: 'Overview',  Icon: Zap },
    { key: 'invoices',  label: 'Invoices',  Icon: FileText },
    { key: 'webhooks',  label: 'Webhooks',  Icon: Globe },
    { key: 'api',       label: 'API docs',  Icon: Code2 },
  ];

  const categoryLabel = CATEGORIES.find((c) => c.value === merchant.business_category)?.label ?? merchant.business_category;

  return (
    <div>
      <PageHeader
        title={merchant.business_name}
        subtitle={`${categoryLabel} · Merchant since ${new Date(merchant.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`}
        action={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: 'var(--success)', fontSize: 12, fontWeight: 600 }}>
            <span className="badge-dot" style={{ background: 'var(--success)' }} /> Live
          </div>
        }
      />

      {/* Stat cards */}
      <div className="vault-grid-4" style={{ marginBottom: 24 }}>
        <MiniStatCard icon={TrendingUp}  label="Total revenue (USD eq.)"  value={`$${revenue.toFixed(2)}`}  sub="+12% vs last month"  color="var(--success)" />
        <MiniStatCard icon={FileText}    label="Paid invoices"             value={String(paidInvoices.length)}    sub={`of ${invoices.length} total`}     color="var(--accent)" />
        <MiniStatCard icon={Clock}       label="Pending invoices"          value={String(pendingInvoices.length)} color="#f59e0b" />
        <MiniStatCard icon={ShieldCheck} label="Delivery success rate"     value={`${deliveredWh}/${webhooks.length}`} sub={webhooks.length > 0 ? `${Math.round((deliveredWh / webhooks.length) * 100)}% success` : undefined} color="#38bdf8" />
      </div>

      {/* Tab navigation */}
      <div style={{ marginBottom: 24 }}>
        <div className="tabs">
          {TABS.map(({ key, label, Icon }) => (
            <div
              key={key}
              className={`tab ${tab === key ? 'active' : ''}`}
              onClick={() => setTab(key)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Icon size={13} />{label}
            </div>
          ))}
        </div>
      </div>

      {/* ── Overview tab ────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Business info + Revenue chart */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {/* Business info */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
              <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 18 }}>Business info</div>
              {[
                { label: 'Business name',      value: merchant.business_name },
                { label: 'Category',           value: categoryLabel },
                { label: 'Website',            value: merchant.website_url || '—' },
                { label: 'Webhook endpoint',   value: merchant.webhook_url },
                { label: 'Accepted currencies', value: merchant.accepted_currencies.join(', ') },
              ].map(({ label, value }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '9px 0', borderBottom: '1px solid var(--border-soft)' }}>
                  <span style={{ color: 'var(--text-muted)', fontSize: 13, flexShrink: 0 }}>{label}</span>
                  <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500, textAlign: 'right', marginLeft: 16, wordBreak: 'break-all' }}>{value}</span>
                </div>
              ))}

              {/* Setup checklist */}
              <div style={{ marginTop: 20 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 12 }}>Setup checklist</div>
                {[
                  { done: true,  label: 'Create merchant account' },
                  { done: !!merchant.webhook_url, label: 'Configure webhook endpoint' },
                  { done: invoices.length > 0, label: 'Create first invoice' },
                  { done: paidInvoices.length > 0, label: 'Receive first payment' },
                ].map(({ done, label }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' }}>
                    <div style={{ width: 20, height: 20, borderRadius: '50%', display: 'grid', placeItems: 'center', flexShrink: 0, background: done ? 'rgba(34,197,94,0.12)' : 'var(--surface)', border: `1px solid ${done ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, color: done ? 'var(--success)' : 'var(--text-faint)' }}>
                      {done ? <Check size={11} /> : <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border)', display: 'block' }} />}
                    </div>
                    <span style={{ fontSize: 13, color: done ? 'var(--text-2)' : 'var(--text-muted)', textDecoration: done ? 'none' : 'none', fontWeight: done ? 500 : 400 }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Revenue chart */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
                <div>
                  <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500 }}>Revenue · 6 months</div>
                  <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--text)' }}>${revenue.toFixed(2)}</div>
                  <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}><ArrowUpRight size={12} />+12% vs last month</div>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>USD equivalent</div>
              </div>

              {/* Bars */}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: CHART_H }}>
                {chartData.map((d, i) => {
                  const isLast = i === chartData.length - 1;
                  return (
                    <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-end', height: '100%' }}>
                      <div title={`$${d.value}`} style={{
                        width: '100%',
                        height: Math.max(4, (d.value / chartMax) * CHART_H),
                        background: isLast
                          ? 'linear-gradient(180deg, rgba(99,102,241,0.9), rgba(99,102,241,0.3))'
                          : 'linear-gradient(180deg, rgba(99,102,241,0.4), rgba(99,102,241,0.08))',
                        borderRadius: '4px 4px 0 0',
                        borderTop: `1px solid ${isLast ? 'var(--accent)' : 'rgba(99,102,241,0.3)'}`,
                        cursor: 'default',
                      }} />
                    </div>
                  );
                })}
              </div>
              {/* Labels */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {chartData.map((d, i) => (
                  <div key={i} style={{ flex: 1, textAlign: 'center', fontSize: 10, color: i === chartData.length - 1 ? 'var(--accent)' : 'var(--text-faint)', fontWeight: i === chartData.length - 1 ? 600 : 400 }}>
                    {d.label}
                  </div>
                ))}
              </div>

              {/* Invoice breakdown */}
              <div style={{ marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--border-soft)' }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[
                    { label: 'Success rate', value: `${successRate}%`, color: 'var(--success)' },
                    { label: 'Total invoices', value: String(invoices.length), color: 'var(--text)' },
                    { label: 'Avg amount', value: invoices.length > 0 ? `$${(revenue / Math.max(1, paidInvoices.length)).toFixed(2)}` : '—', color: 'var(--accent)' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 2 }}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* API credentials */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>API credentials</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>Keep these keys private. Never expose them in client-side code or public repositories.</div>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: 12, fontWeight: 600 }}>
                <ShieldCheck size={12} /> Sensitive
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ApiCredentialRow
                label="Secret API key"
                value={merchant.api_key}
                revealed={showKey}
                onReveal={() => setShowKey((v) => !v)}
                onCopy={() => notify({ title: 'API key copied', description: 'Store it in your environment variables.', tone: 'info' })}
              />
              <ApiCredentialRow
                label="Client secret"
                value={merchant.client_secret}
                revealed={showSecret}
                onReveal={() => setShowSecret((v) => !v)}
                onCopy={() => notify({ title: 'Client secret copied', description: 'Use this for webhook signature verification.', tone: 'info' })}
              />
              <ApiCredentialRow
                label="Merchant ID"
                value={String(merchant.id)}
                mono={false}
                onCopy={() => notify({ title: 'Merchant ID copied', tone: 'info' })}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Invoices tab ─────────────────────────────────────────────────── */}
      {tab === 'invoices' && (
        <div>
          {/* Filter + action bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4 }}>
              {(['all', 'pending', 'paid', 'expired', 'cancelled'] as InvoiceFilter[]).map((f) => {
                const count = f === 'all' ? invoices.length : invoices.filter((i) => i.status === f).length;
                return (
                  <button
                    key={f}
                    onClick={() => setInvoiceFilter(f)}
                    style={{
                      padding: '6px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500,
                      background: invoiceFilter === f ? 'var(--card)' : 'transparent',
                      color: invoiceFilter === f ? 'var(--text)' : 'var(--text-muted)',
                      display: 'inline-flex', alignItems: 'center', gap: 6, transition: 'all 0.12s',
                    }}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {count > 0 && (
                      <span style={{ background: invoiceFilter === f ? 'var(--surface)' : 'var(--card)', borderRadius: 999, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowCreateForm((v) => !v)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, height: 36, padding: '0 16px',
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                background: showCreateForm ? 'transparent' : 'var(--accent)',
                border: showCreateForm ? '1px solid var(--border)' : 'none',
                color: showCreateForm ? 'var(--text-muted)' : 'white',
              }}
            >
              {showCreateForm ? <X size={13} /> : <Plus size={13} />}
              {showCreateForm ? 'Cancel' : 'New invoice'}
            </button>
          </div>

          {/* Create invoice form */}
          {showCreateForm && (
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 20 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 18px', color: 'var(--text)' }}>Create invoice</h3>
              {invoiceError && <ErrorMessage message={invoiceError} onDismiss={() => setInvoiceError(null)} />}
              <form onSubmit={handleCreateInvoice}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
                  <Field label="Order ID">
                    <input className="vault-input" value={invOrderId} onChange={(e) => setInvOrderId(e.target.value)} placeholder="ORD-001" required />
                  </Field>
                  <Field label="Amount">
                    <input className="vault-input" type="number" step="0.01" min="0.01" value={invAmount} onChange={(e) => setInvAmount(e.target.value)} placeholder="0.00" required />
                  </Field>
                  <Field label="Currency">
                    <select className="vault-input" value={invCurrency} onChange={(e) => setInvCurrency(e.target.value)}>
                      {merchant.accepted_currencies.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Description">
                    <input className="vault-input" value={invDescription} onChange={(e) => setInvDescription(e.target.value)} placeholder="What is this for?" />
                  </Field>
                  <Field label="Expires in (min)">
                    <input className="vault-input" type="number" min="1" max="10080" value={invExpires} onChange={(e) => setInvExpires(e.target.value)} />
                  </Field>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" disabled={isCreating} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 20px',
                    borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isCreating ? 0.6 : 1,
                  }}>
                    {isCreating ? <LoadingSpinner size="sm" /> : <Plus size={13} />}
                    Create invoice
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Invoice table */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            {filteredInvoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={invoiceFilter === 'all' ? 'No invoices yet' : `No ${invoiceFilter} invoices`}
                description={invoiceFilter === 'all' ? 'Create your first invoice to start collecting payments.' : `You have no invoices with "${invoiceFilter}" status.`}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="tbl" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Description</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th>Status</th>
                      <th>Expires / Paid</th>
                      <th>Created</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvoices.map((inv) => (
                      <tr key={inv.id}>
                        <td className="txt mono">{inv.order_id}</td>
                        <td style={{ color: 'var(--text-2)', fontSize: 13, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {inv.description || '—'}
                        </td>
                        <td style={{ textAlign: 'right' }} className="txt">{fmt(inv.amount, inv.currency)}</td>
                        <td>
                          <span className={INVOICE_STATUS_BADGE[inv.status]}>
                            <span className="badge-dot" />{inv.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: inv.status === 'pending' ? 'var(--warning)' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          {inv.status === 'pending'
                            ? timeLeft(inv.expires_at)
                            : inv.paid_at
                            ? new Date(inv.paid_at).toLocaleDateString()
                            : new Date(inv.expires_at).toLocaleDateString()}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>{new Date(inv.created_at).toLocaleDateString()}</td>
                        <td>
                          <button
                            onClick={() => { void navigator.clipboard.writeText(`https://pay.vault.io/i/${inv.id}`); notify({ title: 'Payment link copied', description: inv.order_id, tone: 'info' }); }}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 7, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                          >
                            <Copy size={10} /> Link
                          </button>
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

      {/* ── Webhooks tab ──────────────────────────────────────────────────── */}
      {tab === 'webhooks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Endpoint status + stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            {[
              { label: 'Endpoint', value: merchant.webhook_url, sub: 'Configured', ok: true },
              { label: 'Deliveries', value: `${deliveredWh} / ${webhooks.length}`, sub: webhooks.length > 0 ? `${Math.round((deliveredWh / webhooks.length) * 100)}% success` : 'No deliveries', ok: deliveredWh === webhooks.length },
              { label: 'Last event', value: webhooks[0] ? webhooks[0].event : '—', sub: webhooks[0] ? new Date(webhooks[0].delivered_at).toLocaleString() : 'Never', ok: true },
            ].map(({ label, value, sub, ok }) => (
              <div key={label} style={{ background: 'var(--card)', border: `1px solid ${ok ? 'var(--border)' : 'rgba(239,68,68,0.25)'}`, borderRadius: 'var(--radius-card)', padding: 18 }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all', lineHeight: 1.4 }}>{value}</div>
                <div style={{ fontSize: 12, color: ok ? 'var(--success)' : 'var(--error)', marginTop: 4 }}>{sub}</div>
              </div>
            ))}
          </div>

          {/* Webhook log */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-soft)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>Delivery log</span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{webhooks.length} events</span>
            </div>
            {webhooks.length === 0 ? (
              <EmptyState icon={Globe} title="No webhook logs" description="Events will appear here as they are delivered." />
            ) : (
              <div>
                {webhooks.map((wh) => {
                  const ok = wh.status_code >= 200 && wh.status_code < 300;
                  const expanded = expandedWh === wh.id;
                  return (
                    <div key={wh.id} style={{ borderBottom: '1px solid var(--border-soft)' }}>
                      <div
                        onClick={() => setExpandedWh(expanded ? null : wh.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', cursor: 'pointer', transition: 'background 0.12s' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--card-hover)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: ok ? 'var(--success)' : 'var(--error)', flexShrink: 0 }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)', flex: 1 }}>{wh.event}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', flexShrink: 0 }}>inv #{wh.invoice_id}</span>
                        <span className={`badge ${ok ? 'badge-success' : 'badge-failed'}`} style={{ flexShrink: 0 }}>{wh.status_code}</span>
                        <span style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0, minWidth: 120, textAlign: 'right' }}>{new Date(wh.delivered_at).toLocaleString()}</span>
                        <ChevronDown size={14} style={{ color: 'var(--text-faint)', transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none', flexShrink: 0 }} />
                      </div>
                      {expanded && (
                        <div style={{ padding: '0 20px 16px 42px' }}>
                          <div style={{ background: '#0a0a12', border: '1px solid rgba(99,102,241,0.1)', borderRadius: 10, padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a5b4fc', lineHeight: 1.7 }}>
                            {JSON.stringify(wh.payload, null, 2).split('\n').map((line, i) => (
                              <div key={i}>{line}</div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── API docs tab ─────────────────────────────────────────────────── */}
      {tab === 'api' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick start */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 24 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Quick start</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 18 }}>Create your first invoice with a single API call.</div>
            <div style={{ background: '#0a0a12', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 12, padding: '18px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: '#a5b4fc', lineHeight: 1.8, overflowX: 'auto', position: 'relative' }}>
              <button
                onClick={() => {
                  const snippet = `curl -X POST https://api.vault.io/v1/invoices \\\n  -H "Authorization: Bearer ${merchant.api_key}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"order_id":"ORD-001","amount":420.50,"currency":"USD","description":"Monthly sub","expires_in":3600}'`;
                  void navigator.clipboard.writeText(snippet);
                  notify({ title: 'Snippet copied', tone: 'success' });
                }}
                style={{ position: 'absolute', top: 12, right: 12, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 7, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--accent)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
              >
                <Copy size={10} /> Copy
              </button>
              <span style={{ color: '#6b7280' }}>curl</span> <span style={{ color: '#f8f8f2' }}>-X POST https://api.vault.io/v1/invoices</span> \<br />
              &nbsp;&nbsp;<span style={{ color: '#6b7280' }}>-H</span> <span style={{ color: '#86efac' }}>"Authorization: Bearer {merchant.api_key.slice(0, 16)}…"</span> \<br />
              &nbsp;&nbsp;<span style={{ color: '#6b7280' }}>-H</span> <span style={{ color: '#86efac' }}>"Content-Type: application/json"</span> \<br />
              &nbsp;&nbsp;<span style={{ color: '#6b7280' }}>-d</span> <span style={{ color: '#fbbf24' }}>'{`{`}</span><br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>"order_id"</span>: <span style={{ color: '#86efac' }}>"ORD-001"</span>,<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>"amount"</span>: <span style={{ color: '#fb923c' }}>420.50</span>,<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>"currency"</span>: <span style={{ color: '#86efac' }}>"USD"</span>,<br />
              &nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>"expires_in"</span>: <span style={{ color: '#fb923c' }}>3600</span><br />
              &nbsp;&nbsp;<span style={{ color: '#fbbf24' }}>{`}`}'</span>
            </div>
          </div>

          {/* Endpoints reference */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-soft)' }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>API endpoints</div>
            </div>
            <table className="tbl">
              <thead>
                <tr><th>Method</th><th>Endpoint</th><th>Description</th></tr>
              </thead>
              <tbody>
                {[
                  { method: 'POST', path: '/v1/invoices',         desc: 'Create a new invoice' },
                  { method: 'GET',  path: '/v1/invoices/:id',     desc: 'Get invoice by ID' },
                  { method: 'GET',  path: '/v1/invoices',         desc: 'List all invoices (paginated)' },
                  { method: 'POST', path: '/v1/invoices/:id/cancel', desc: 'Cancel a pending invoice' },
                  { method: 'GET',  path: '/v1/webhooks',         desc: 'List webhook delivery logs' },
                  { method: 'POST', path: '/v1/webhooks/resend',  desc: 'Retry a failed webhook delivery' },
                  { method: 'GET',  path: '/v1/merchant/me',      desc: 'Get merchant profile' },
                ].map(({ method, path, desc }) => (
                  <tr key={path}>
                    <td>
                      <span className={`badge ${method === 'GET' ? 'badge-transfer' : method === 'POST' ? 'badge-deposit' : 'badge-failed'}`}>{method}</span>
                    </td>
                    <td className="mono">{path}</td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rate limits + auth */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Rate limits</div>
              {[
                { tier: 'Invoice creation', limit: '100 / hour' },
                { tier: 'Read requests',    limit: '1,000 / hour' },
                { tier: 'Webhook resend',   limit: '10 / hour' },
                { tier: 'Burst (any)',       limit: '20 / second' },
              ].map(({ tier, limit }) => (
                <div key={tier} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-soft)', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>{tier}</span>
                  <span style={{ color: 'var(--text)', fontFamily: 'var(--font-mono)', fontWeight: 500 }}>{limit}</span>
                </div>
              ))}
            </div>

            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14 }}>Authentication</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 14px' }}>
                All requests must include your API key in the Authorization header as a Bearer token.
              </p>
              <div style={{ background: '#0a0a12', border: '1px solid rgba(99,102,241,0.12)', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: '#a5b4fc', lineHeight: 1.6 }}>
                Authorization: Bearer {merchant.api_key.slice(0, 20)}…
              </div>
              <p style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.5, margin: '12px 0 0' }}>
                Webhook payloads are signed with your client secret using HMAC-SHA256. Always verify the X-Vault-Signature header before processing.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
