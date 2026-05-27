import { useState } from 'react';
import type { FormEvent } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, AlertTriangle, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { useToast } from '@/context/ToastContext';
import { useAppData } from '@/context/AppDataContext';

type Asset = 'BTC' | 'USDT';
type Tab = 'deposit' | 'withdraw';

const DEPOSIT_ADDRESSES: Record<Asset, string> = {
  BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  USDT: 'TR7NHqjeKQxGTCi8q8DE4p1nRvVCYeqy5a',
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

const NETWORK_FEE_NUM: Record<Asset, number> = {
  BTC: 0.0001,
  USDT: 1,
};

const ASSET_COLOR: Record<Asset, string> = {
  BTC: '#f7931a',
  USDT: '#26a17b',
};

const INITIAL_CRYPTO_BALANCES: Record<Asset, number> = {
  BTC: 0.05821,
  USDT: 847.5,
};

const QUICK_CHIPS: Array<{ label: string; pct: number }> = [
  { label: '25%', pct: 0.25 },
  { label: '50%', pct: 0.5 },
  { label: '75%', pct: 0.75 },
  { label: 'MAX', pct: 1 },
];

function fmtCrypto(n: number, asset: Asset) {
  if (asset === 'BTC') {
    return n.toFixed(8).replace(/\.?0+$/, '') + ' BTC';
  }
  return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' USDT';
}

function RowLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function Crypto() {
  const { notify } = useToast();
  const { addTransaction } = useAppData();
  const [tab, setTab] = useState<Tab>('deposit');
  const [asset, setAsset] = useState<Asset>('BTC');
  const [copied, setCopied] = useState(false);
  const [cryptoBalances, setCryptoBalances] = useState<Record<Asset, number>>(INITIAL_CRYPTO_BALANCES);

  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(DEPOSIT_ADDRESSES[asset]);
    setCopied(true);
    notify({ title: 'Address copied', description: `${asset} deposit address copied to clipboard.`, tone: 'success' });
    setTimeout(() => setCopied(false), 2000);
  }

  function setQuickAmount(pct: number) {
    const val = cryptoBalances[asset] * pct;
    if (asset === 'BTC') {
      setAmount(val.toFixed(8).replace(/\.?0+$/, '') || '0');
    } else {
      setAmount(val.toFixed(2));
    }
  }

  function handleWithdraw(e: FormEvent) {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { setError('Enter a valid amount.'); return; }
    if (amountNum > cryptoBalances[asset]) { setError(`Insufficient ${asset} balance.`); return; }
    if (!destination.trim()) { setError('Enter a valid destination address.'); return; }

    setError(null);
    setIsSubmitting(true);
    const destSnapshot = destination;

    setTimeout(() => {
      setCryptoBalances((prev) => ({ ...prev, [asset]: Math.max(0, prev[asset] - amountNum) }));
      addTransaction({
        type: 'withdrawal',
        status: 'completed',
        amount: amountNum,
        fee: NETWORK_FEE_NUM[asset],
        currency: asset,
        description: `Crypto withdrawal · ${NETWORKS[asset]}`,
      });
      setIsSubmitting(false);
      setSuccess(true);
      setAmount('');
      setDestination('');
      notify({
        title: 'Withdrawal submitted',
        description: `${fmtCrypto(amountNum, asset)} sent to ${destSnapshot.slice(0, 8)}…${destSnapshot.slice(-6)} on ${NETWORKS[asset]}.`,
        tone: 'success',
      });
    }, 3000);
  }

  const addr = DEPOSIT_ADDRESSES[asset];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Crypto</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Deposit or withdraw cryptocurrency</p>
      </div>

      {/* Asset pills with live balances */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, alignItems: 'center' }}>
        {(['BTC', 'USDT'] as Asset[]).map((a) => (
          <button
            key={a}
            onClick={() => { setAsset(a); setCopied(false); setSuccess(false); setError(null); setAmount(''); }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 10, height: 44, padding: '0 18px',
              borderRadius: 22, border: `1.5px solid ${asset === a ? ASSET_COLOR[a] : 'var(--border)'}`,
              background: asset === a ? `${ASSET_COLOR[a]}1a` : 'transparent',
              color: asset === a ? ASSET_COLOR[a] : 'var(--text-2)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: ASSET_COLOR[a], flexShrink: 0 }} />
            <span>{a}</span>
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: asset === a ? `${ASSET_COLOR[a]}cc` : 'var(--text-faint)',
            }}>
              {fmtCrypto(cryptoBalances[a], a)}
            </span>
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div className="tabs">
          {(['deposit', 'withdraw'] as Tab[]).map((t) => (
            <div
              key={t}
              className={`tab ${tab === t ? 'active' : ''}`}
              onClick={() => { setTab(t); setError(null); setSuccess(false); }}
              style={{ textTransform: 'capitalize' }}
            >
              {t === 'deposit' ? 'Deposit' : 'Withdraw'}
            </div>
          ))}
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      {tab === 'deposit' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
            {/* Live QR code */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <div style={{
                padding: 16,
                background: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.08), 0 8px 32px rgba(0,0,0,0.5)',
              }}>
                <QRCodeSVG
                  value={addr}
                  size={168}
                  bgColor="#ffffff"
                  fgColor="#1e1b4b"
                  level="M"
                />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
                Scan with any crypto wallet to deposit {asset}<br />
                <span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>{NETWORKS[asset]}</span>
              </div>
            </div>

            {/* Address row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>
                Deposit address
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  padding: '10px 14px', borderRadius: 10,
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  fontSize: 12, color: 'var(--text-2)', fontFamily: 'var(--font-mono)',
                }}>
                  {addr}
                </div>
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6, height: 40, padding: '0 14px',
                    borderRadius: 10,
                    background: copied ? 'rgba(34,197,94,0.1)' : 'var(--surface)',
                    border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    color: copied ? 'var(--success)' : 'var(--text-2)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer', flexShrink: 0, transition: 'all 160ms',
                  }}
                >
                  {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Warning */}
            <div style={{ display: 'flex', gap: 10, padding: 14, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 12 }}>
              <AlertTriangle size={16} color="var(--warning)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.5 }}>
                Only send <strong>{asset}</strong> on the <strong>{NETWORKS[asset]}</strong> network to this address.
                Sending other assets may result in permanent loss.
              </div>
            </div>
          </div>

          {/* Info sidebar */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, alignSelf: 'flex-start' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>
              Deposit info
            </div>
            <RowLine label="Asset" value={<span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>{asset}</span>} />
            <RowLine label="Network" value={NETWORKS[asset]} />
            <RowLine label="Current balance" value={<span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>{fmtCrypto(cryptoBalances[asset], asset)}</span>} />
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
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: 14,
                  background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)',
                  borderRadius: 12, marginBottom: 20, color: 'var(--success)', fontSize: 14, fontWeight: 600,
                }}>
                  <Check size={16} /> Withdrawal submitted successfully.
                </div>
              )}

              {/* Amount field */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>
                    Amount
                  </label>
                  <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
                    Available:{' '}
                    <span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>
                      {fmtCrypto(cryptoBalances[asset], asset)}
                    </span>
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    className="vault-input"
                    type="number"
                    step="any"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ paddingLeft: 18, height: 64, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', paddingRight: 72 }}
                    required
                  />
                  <span style={{ position: 'absolute', top: 0, bottom: 0, right: 14, display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>
                    {asset}
                  </span>
                </div>

                {/* Quick chips */}
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  {QUICK_CHIPS.map(({ label, pct }) => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => setQuickAmount(pct)}
                      style={{
                        height: 26, padding: '0 10px', borderRadius: 8,
                        background: 'transparent', border: '1px solid var(--border)',
                        color: 'var(--text-muted)', fontSize: 11, fontWeight: 600,
                        cursor: 'pointer', transition: 'border-color 0.12s, color 0.12s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = ASSET_COLOR[asset];
                        (e.currentTarget as HTMLButtonElement).style.color = ASSET_COLOR[asset];
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Destination address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Destination address
                </label>
                <input
                  className="vault-input"
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder={asset === 'BTC' ? 'bc1q…' : 'T…'}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    height: 40, padding: '0 20px', borderRadius: 10,
                    background: 'var(--accent)', border: 'none', color: 'white',
                    fontSize: 13, fontWeight: 600,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.75 : 1, transition: 'opacity 0.2s',
                  }}
                >
                  {isSubmitting
                    ? <><LoadingSpinner size="sm" /> Sending to network…</>
                    : <><ChevronRight size={14} /> Withdraw {asset}</>
                  }
                </button>
              </div>
            </div>
          </form>

          {/* Fee sidebar */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, alignSelf: 'flex-start' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>
              Fee estimate
            </div>
            <RowLine label="Asset" value={<span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>{asset}</span>} />
            <RowLine label="Network" value={NETWORKS[asset]} />
            <RowLine label="Balance" value={<span style={{ color: ASSET_COLOR[asset], fontWeight: 600 }}>{fmtCrypto(cryptoBalances[asset], asset)}</span>} />
            <RowLine label="Amount" value={amount ? `${amount} ${asset}` : '—'} />
            <RowLine label="Network fee" value={NETWORK_FEE[asset]} />
            {amount && parseFloat(amount) > 0 && (
              <RowLine
                label="You receive"
                value={
                  <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                    {fmtCrypto(Math.max(0, parseFloat(amount) - NETWORK_FEE_NUM[asset]), asset)}
                  </span>
                }
              />
            )}
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
