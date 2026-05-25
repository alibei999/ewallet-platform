import { useState } from 'react';
import type { FormEvent } from 'react';
import axios from 'axios';
import { Copy, Check, AlertTriangle, ChevronRight, QrCode } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import api from '@/api/axios';

type Asset = 'BTC' | 'USDT';
type Tab = 'deposit' | 'withdraw';

const DEPOSIT_ADDRESSES: Record<Asset, string> = {
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  USDT: 'TN3W4T9XYXK2K5V5U1TBD1P5WYGQMFZ7J',
};

const NETWORKS: Record<Asset, string> = {
  BTC: 'Bitcoin Network',
  USDT: 'TRON (TRC-20)',
};

const MIN_DEPOSIT: Record<Asset, string> = {
  BTC: '0.0001 BTC',
  USDT: '10 USDT',
};

const NETWORK_FEE: Record<Asset, string> = {
  BTC: '0.0001 BTC',
  USDT: '1 USDT',
};

const ASSET_COLOR: Record<Asset, string> = {
  BTC: '#f7931a',
  USDT: '#26a17b',
};

function RowLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function Crypto() {
  const [tab, setTab] = useState<Tab>('deposit');
  const [asset, setAsset] = useState<Asset>('BTC');
  const [copied, setCopied] = useState(false);

  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(DEPOSIT_ADDRESSES[asset]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleWithdraw(e: FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { setError('Enter a valid amount.'); return; }
    setError(null);
    setIsSubmitting(true);
    try {
      await api.post('/crypto/withdraw', { currency: asset, amount: amountNum, destination });
      setSuccess(true);
      setAmount('');
      setDestination('');
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) setError((err.response?.data as { message?: string })?.message ?? 'Withdrawal failed.');
      else setError('Something went wrong. Please try again.');
    } finally { setIsSubmitting(false); }
  }

  const addr = DEPOSIT_ADDRESSES[asset];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Crypto</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Deposit or withdraw cryptocurrency</p>
      </div>

      {/* Asset pills */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['BTC', 'USDT'] as Asset[]).map((a) => (
          <button
            key={a}
            onClick={() => { setAsset(a); setCopied(false); setSuccess(false); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, height: 36, padding: '0 14px',
              borderRadius: 20, border: `1px solid ${asset === a ? ASSET_COLOR[a] : 'var(--border)'}`,
              background: asset === a ? `${ASSET_COLOR[a]}22` : 'transparent',
              color: asset === a ? ASSET_COLOR[a] : 'var(--text-2)', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ASSET_COLOR[a], flexShrink: 0 }} />
            {a}
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div className="tabs">
          {(['deposit', 'withdraw'] as Tab[]).map((t) => (
            <div key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => { setTab(t); setError(null); setSuccess(false); }}
              style={{ textTransform: 'capitalize' }}>
              {t === 'deposit' ? 'Deposit' : 'Withdraw'}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {tab === 'deposit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
            {/* QR placeholder */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ width: 140, height: 140, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-faint)' }}>
                <QrCode size={40} />
                <span style={{ fontSize: 12 }}>QR Code</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>Scan to deposit {asset}</div>
            </div>

            {/* Address */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Deposit address</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', padding: '10px 14px', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)' }}>
                  {addr}
                </div>
                <button onClick={handleCopy}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px', borderRadius: 10, background: copied ? 'rgba(34,197,94,0.1)' : 'var(--surface)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`, color: copied ? 'var(--success)' : 'var(--text-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Warning */}
            <div style={{ display: 'flex', gap: 10, padding: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
              <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
                Only send <strong>{asset}</strong> on the <strong>{NETWORKS[asset]}</strong> network to this address. Sending other assets may result in permanent loss.
              </div>
            </div>
          </div>

          {/* Info sidebar */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, alignSelf: 'flex-start' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>Deposit info</div>
            <RowLine label="Asset" value={<span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>{asset}</span>} />
            <RowLine label="Network" value={NETWORKS[asset]} />
            <RowLine label="Min deposit" value={MIN_DEPOSIT[asset]} />
            <RowLine label="Network fee" value={NETWORK_FEE[asset]} />
            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
            <div style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              Funds credited after network confirmation. Large deposits may require additional review.
            </div>
          </div>
        </div>
      )}

      {tab === 'withdraw' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <form onSubmit={handleWithdraw}>
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
              {success && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 14, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 12, marginBottom: 20, color: 'var(--success)', fontSize: 14, fontWeight: 600 }}>
                  <Check size={16} /> Withdrawal submitted successfully.
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Amount</label>
                <div style={{ position: 'relative' }}>
                  <input className="vault-input" type="number" step="0.00000001" min="0" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00" style={{ paddingLeft: 18, height: 64, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', paddingRight: 72 }} required />
                  <span style={{ position: 'absolute', top: 0, bottom: 0, right: 14, display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>{asset}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Destination address</label>
                <input className="vault-input" type="text" value={destination} onChange={(e) => setDestination(e.target.value)}
                  placeholder={asset === 'BTC' ? 'bc1q…' : 'T…'} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={isSubmitting}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isSubmitting ? 0.5 : 1 }}>
                  {isSubmitting ? <LoadingSpinner size="sm" /> : <ChevronRight size={14} />}
                  {isSubmitting ? 'Submitting…' : `Withdraw ${asset}`}
                </button>
              </div>
            </div>
          </form>

          {/* Fee sidebar */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, alignSelf: 'flex-start' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>Fee estimate</div>
            <RowLine label="Asset" value={<span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>{asset}</span>} />
            <RowLine label="Network" value={NETWORKS[asset]} />
            <RowLine label="Amount" value={amount ? `${amount} ${asset}` : '—'} />
            <RowLine label="Network fee" value={NETWORK_FEE[asset]} />
            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
            <div style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.6 }}>
              Estimated time: {asset === 'BTC' ? '30–60 min' : '5–20 min'}. Network fees may vary.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
