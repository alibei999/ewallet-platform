import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Check, ChevronRight, ChevronLeft, Send, AlertCircle } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import { sendTransfer } from '@/api/transfer';
import type { Transaction } from '@/types';

const FEE_RATE = 0.005;

function fmt(n: number) {
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function RowLine({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>{label}</span>
      <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  const initials = name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffff;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: `linear-gradient(135deg, hsl(${h % 360} 60% 45%), hsl(${(h % 360 + 50) % 360} 60% 35%))`, display: 'grid', placeItems: 'center', fontWeight: 600, color: 'white', fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export default function Transfer() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * FEE_RATE;

  const recipient = useMemo(() => {
    if (!email.includes('@')) return null;
    const local = email.split('@')[0];
    const name = local.split(/[._]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return { name, email, handle: '@' + local.replace(/\./g, '') };
  }, [email]);

  async function handleConfirm() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await sendTransfer({
        recipient_email: email,
        amount: amountNum,
        currency: 'USD',
        description: note || undefined,
      });
      setResult(res.transaction);
      setStep(3);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError((err.response?.data as { message?: string })?.message ?? 'Transfer failed.');
      } else {
        setError('Something went wrong. Please try again.');
      }
      setStep(1);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', margin: '0 0 4px', color: 'var(--text)' }}>Send money</h1>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>Move funds to another eWallet user or external account</p>
      </div>

      {/* Steps bar */}
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, marginBottom: 24 }}>
        <div className="steps">
          {(['Details', 'Confirm', 'Done'] as const).map((lbl, i) => {
            const n = i + 1;
            const cls = step === n ? 'active' : step > n ? 'done' : '';
            return (
              <>
                <div key={lbl} className={`step ${cls}`}>
                  <div className="step-num">{step > n ? <Check size={14} /> : n}</div>
                  {lbl}
                </div>
                {n < 3 && <div key={`bar-${n}`} className={`step-bar ${step > n ? 'done-bar' : ''}`} style={{ background: step > n ? 'var(--accent)' : 'var(--border)' }} />}
              </>
            );
          })}
        </div>
      </div>

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22 }}>
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Recipient email</label>
                <input
                  className="vault-input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="recipient@example.com"
                />
                {recipient && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10 }}>
                    <Avatar name={recipient.name} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: 'var(--text)', fontWeight: 500, fontSize: 13 }}>{recipient.name}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{recipient.handle} · eWallet user</div>
                    </div>
                    <span className="badge badge-success"><Check size={11} /> Verified</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Amount</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', top: 0, bottom: 0, left: 18, display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 600, color: 'var(--text-muted)' }}>$</span>
                  <input
                    className="vault-input"
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ paddingLeft: 36, height: 64, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', paddingRight: 52 }}
                  />
                  <span style={{ position: 'absolute', top: 0, bottom: 0, right: 14, display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>USD</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Note (optional)</label>
                <input className="vault-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="What's this for?" />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                <button onClick={() => navigate('/dashboard')} style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button
                  disabled={!email || !amount || amountNum <= 0}
                  onClick={() => setStep(2)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (!email || !amount || amountNum <= 0) ? 0.5 : 1 }}
                >
                  Continue <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, color: 'var(--text)', letterSpacing: '-0.01em' }}>Review transfer</h2>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
                <RowLine label="To" value={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {recipient && <Avatar name={recipient.name} size={24} />}
                    <span style={{ color: 'var(--text)' }}>{recipient?.name ?? email}</span>
                    {recipient && <span style={{ color: 'var(--text-muted)' }}>{recipient.handle}</span>}
                  </div>
                } />
                <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
                <RowLine label="Amount" value={<span style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>${amount}</span>} />
                <RowLine label="Fee (0.5%)" value={<span style={{ color: 'var(--success)' }}>{fmt(fee)}</span>} />
                <RowLine label="Arrives" value="Instantly" />
                {note && <RowLine label="Note" value={note} />}
                <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
                <RowLine label="Total" value={<span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>{fmt(amountNum + fee)}</span>} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <button onClick={() => setStep(1)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: isLoading ? 0.5 : 1 }}
                >
                  {isLoading ? <><LoadingSpinner size="sm" /> Sending…</> : <><Send size={14} /> Send {fmt(amountNum)}</>}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 20px', color: 'var(--success)' }}>
                <Check size={28} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)', letterSpacing: '-0.01em' }}>Transfer sent</h2>
              <p style={{ fontSize: 14, color: 'var(--text-muted)', margin: 0 }}>{fmt(amountNum)} is on its way{recipient ? ` to ${recipient.name}` : ''}.</p>
              {result && <p style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 8 }}>Transaction #{result.id}</p>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24 }}>
                <button onClick={() => { setStep(1); setEmail(''); setAmount(''); setNote(''); }} style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Send another
                </button>
                <button onClick={() => navigate('/transactions')} style={{ display: 'inline-flex', alignItems: 'center', height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  View receipt
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Fee sidebar */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)', padding: 22, alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-faint)', fontWeight: 500, marginBottom: 16 }}>Fee breakdown</div>
          <RowLine label="Amount" value={amount ? `$${amount}` : '—'} />
          <RowLine label="eWallet fee (0.5%)" value={amountNum > 0 ? <span style={{ color: 'var(--success)' }}>{fmt(fee)}</span> : '—'} />
          <RowLine label="FX margin" value="—" />
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
          <RowLine label="Total debit" value={amountNum > 0 ? <span style={{ fontWeight: 700, color: 'var(--text)' }}>{fmt(amountNum + fee)}</span> : '—'} />
          <div style={{ marginTop: 20, padding: 12, background: 'var(--surface)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertCircle size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 1 }} />
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Transfers between eWallet accounts are instant. External transfers may take 1–2 business days.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
