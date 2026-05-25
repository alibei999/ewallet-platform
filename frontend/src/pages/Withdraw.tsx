import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Building, Bitcoin, Check, ChevronRight } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { withdraw } from '@/api/wallet';
import { getApiErrorMessage } from '@/api/errors';
import {
  CURRENCIES,
  QUICK_AMOUNTS,
  currencySymbol,
  formatMoney,
  formatQuickAmount,
} from '@/lib/currency';

type Method = 'Card' | 'Bank' | 'Crypto';

const FEES: Record<Method, number> = { Card: 0.01, Bank: 0.005, Crypto: 0.01 };
const ARRIVES: Record<Method, string> = { Card: 'Instant', Bank: '2–3 business days', Crypto: '10–30 min' };

function RowLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default function Withdraw() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<Method>('Bank');
  const [currency, setCurrency] = useState('KZT');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * FEES[method];
  const receive = amountNum - fee;
  const sym = currencySymbol(currency);
  const quickAmounts = QUICK_AMOUNTS[currency] ?? QUICK_AMOUNTS.USD;

  function handleCurrencyChange(next: string) {
    setCurrency(next);
    setAmount('');
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (amountNum <= 0) { setError('Enter a valid amount.'); return; }
    setError(null);
    setIsLoading(true);
    try {
      const res = await withdraw({ amount: amountNum, currency });
      setTxId(res.transaction_id);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, 'Withdrawal failed.'));
    } finally { setIsLoading(false); }
  }

  if (txId !== null) {
    return (
      <div>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 24px', color: 'var(--text)' }}>Withdraw funds</h1>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 40, maxWidth: 480, textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--success)' }}>
            <Check size={28} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>Withdrawal requested</h2>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: '0 0 24px' }}>Transaction #{txId}</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button onClick={() => setTxId(null)} style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>New withdrawal</button>
            <button onClick={() => navigate('/transactions')} style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>View transactions</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Withdraw funds</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Move your balance out of eWallet</p>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <form onSubmit={handleSubmit}>
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
            <div className="tabs" style={{ marginBottom: 24 }}>
              {(['Card', 'Bank', 'Crypto'] as Method[]).map((m) => (
                <div key={m} className={`tab ${method === m ? 'active' : ''}`} onClick={() => setMethod(m)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {m === 'Card' && <CreditCard size={13} />}
                  {m === 'Bank' && <Building size={13} />}
                  {m === 'Crypto' && <Bitcoin size={13} />}
                  {m}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Currency</label>
              <select className="vault-input" value={currency} onChange={(e) => handleCurrencyChange(e.target.value)}>
                {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
              <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Amount</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: 0, bottom: 0, left: 18, display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 600, color: 'var(--text-muted)' }}>{sym}</span>
                <input className="vault-input" type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ paddingLeft: 36, height: 64, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', paddingRight: 52 }} required />
                <span style={{ position: 'absolute', top: 0, bottom: 0, right: 14, display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{currency}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
              {quickAmounts.map((v) => (
                <button key={v} type="button" onClick={() => setAmount(v.toString())} style={{ flex: 1, height: 32, borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {formatQuickAmount(v, currency)}
                </button>
              ))}
            </div>

            {method === 'Bank' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16 }}>
                <Building size={18} color="var(--accent)" />
                <div style={{ flex: 1 }}><div style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>Checking Account</div><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>ACH · •••• 1184</div></div>
                <span className="badge badge-neutral">2–3 days</span>
              </div>
            )}
            {method === 'Card' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, marginBottom: 16 }}>
                <CreditCard size={18} color="var(--accent)" />
                <div style={{ flex: 1 }}><div style={{ color: 'var(--text)', fontWeight: 500, fontSize: 14 }}>Visa Debit •••• 4429</div><div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Expires 08/28</div></div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" disabled={isLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}>
                {isLoading && <LoadingSpinner size="sm" />}
                Withdraw {amountNum > 0 ? formatMoney(amountNum, currency) : ''} <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </form>

        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>Summary</div>
          <RowLine label="Method" value={method} />
          <RowLine label="Amount" value={amountNum > 0 ? formatMoney(amountNum, currency) : '—'} />
          <RowLine label="Withdrawal fee" value={fee === 0 ? <span style={{ color: 'var(--success)' }}>Free</span> : formatMoney(fee, currency)} />
          <RowLine label="Arrives" value={ARRIVES[method]} />
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
          <RowLine label="You receive" value={amountNum > 0 ? <span style={{ fontWeight: 700, color: 'var(--text)' }}>{formatMoney(receive, currency)}</span> : '—'} />
        </div>
      </div>
    </div>
  );
}
