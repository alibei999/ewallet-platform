import { useMemo, useState } from 'react';
import { AlertCircle, Check, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';

const FEE_RATE = 0.005;

const SYMBOLS: Record<string, string> = { USD: '$', EUR: '€', GBP: '£', KZT: '₸', RUB: '₽' };

function fmt(amount: number, currency: string) {
  const sym = SYMBOLS[currency] ?? '';
  return `${sym}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

interface TransferModalProps {
  initialCurrency?: string;
  onClose: () => void;
}

export default function TransferModal({ initialCurrency = 'USD', onClose }: TransferModalProps) {
  const { addTransfer, balances } = useAppData();
  const { notify } = useToast();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [currency, setCurrency] = useState(
    balances.some((b) => b.currency === initialCurrency) ? initialCurrency : (balances[0]?.currency ?? 'USD')
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedBalance = balances.find((b) => b.currency === currency);
  const sym = SYMBOLS[currency] ?? '';
  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * FEE_RATE;

  const recipient = useMemo(() => {
    if (!email.includes('@')) return null;
    const local = email.split('@')[0];
    const name = local.split(/[._]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
    return { name, email, handle: '@' + local.replace(/\./g, '') };
  }, [email]);

  function validateStep() {
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Enter a valid recipient email.');
      return false;
    }
    if (!amount || amountNum <= 0) {
      setError('Enter a valid amount.');
      return false;
    }
    if (selectedBalance && amountNum + fee > selectedBalance.balance) {
      setError(`Insufficient ${currency} balance.`);
      return false;
    }
    setError(null);
    return true;
  }

  function handleContinue() {
    if (!validateStep()) return;
    setStep(2);
  }

  function handleConfirm() {
    if (!validateStep()) return;
    setIsLoading(true);
    setTimeout(() => {
      addTransfer(currency, amountNum, fee, note || 'Transfer sent');
      setIsLoading(false);
      setStep(3);
    }, 700);
  }

  function handleDone() {
    notify({
      title: 'Transfer completed',
      description: `${fmt(amountNum, currency)} sent to ${recipient?.name ?? email}.`,
      tone: 'success',
    });
    onClose();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Send money</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Transfer funds instantly to another wallet or external account.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          ×
        </button>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div className="steps">
          {(['Details', 'Confirm', 'Done'] as const).map((label, index) => {
            const n = index + 1;
            const cls = step === n ? 'active' : step > n ? 'done' : '';
            return (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                <div className={`step ${cls}`}>
                  <div className="step-num">{step > n ? <Check size={14} /> : n}</div>
                  {label}
                </div>
                {n < 3 && <div className={`step-bar ${step > n ? 'done-bar' : ''}`} style={{ background: step > n ? 'var(--accent)' : 'var(--border)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', gap: 10, padding: 12, borderRadius: 12, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: 'var(--error)', fontSize: 13, marginBottom: 16 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} /> {error}
        </div>
      )}

      <div className="modal-step">
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* From account selector */}
            <div className="form-field">
              <label className="form-field__label">From account</label>
              <select
                className="vault-input"
                value={currency}
                onChange={(e) => { setCurrency(e.target.value); setAmount(''); }}
                style={{ marginTop: 6 }}
              >
                {balances.map((b) => (
                  <option key={b.currency} value={b.currency}>
                    {b.currency} · {SYMBOLS[b.currency] ?? ''}{b.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} available
                  </option>
                ))}
              </select>
            </div>

            {/* Recipient */}
            <div className="form-field">
              <label className="form-field__label">Recipient email</label>
              <input
                className="vault-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="recipient@company.com"
                style={{ marginTop: 6 }}
              />
              {recipient && (
                <div style={{ marginTop: 10, padding: 12, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={recipient.name} size={32} />
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 13 }}>{recipient.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{recipient.handle} · eWallet user</div>
                    </div>
                  </div>
                  <span className="badge badge-success"><Check size={11} /> Verified</span>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="form-field">
              <label className="form-field__label">Amount</label>
              <div style={{ position: 'relative', marginTop: 6 }}>
                <span style={{ position: 'absolute', top: 0, bottom: 0, left: 16, display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 600, color: 'var(--text-muted)', pointerEvents: 'none' }}>{sym}</span>
                <input
                  className="vault-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  style={{ paddingLeft: sym ? 36 : 18, height: 56, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', paddingRight: 64 }}
                />
                <span style={{ position: 'absolute', top: 0, bottom: 0, right: 14, display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--text-muted)', pointerEvents: 'none' }}>{currency}</span>
              </div>
              {selectedBalance && amountNum > 0 && (
                <div style={{ fontSize: 12, color: amountNum + fee > selectedBalance.balance ? 'var(--error)' : 'var(--text-faint)', marginTop: 4 }}>
                  Balance: {fmt(selectedBalance.balance, currency)} · Fee: {fmt(fee, currency)}
                </div>
              )}
            </div>

            {/* Note */}
            <div className="form-field">
              <label className="form-field__label">Note (optional)</label>
              <input className="vault-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Purpose of transfer" style={{ marginTop: 6 }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button variant="primary" size="md" onClick={handleContinue}>
                Continue <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Review transfer</div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>To</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {recipient && <Avatar name={recipient.name} size={20} />}
                  <span style={{ color: 'var(--text)', fontWeight: 500 }}>{recipient?.name ?? email}</span>
                  {recipient && <span style={{ color: 'var(--text-muted)' }}>{recipient.handle}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>From</span>
                <span style={{ color: 'var(--text)', fontWeight: 500 }}>{currency} account</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Amount</span>
                <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 16 }}>{fmt(amountNum, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Fee (0.5%)</span>
                <span style={{ color: 'var(--success)' }}>{fmt(fee, currency)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                <span style={{ color: 'var(--text-muted)' }}>Arrives</span>
                <span style={{ color: 'var(--text)' }}>Instantly</span>
              </div>
              {note && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Note</span>
                  <span style={{ color: 'var(--text)' }}>{note}</span>
                </div>
              )}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                <span>Total debit</span>
                <span>{fmt(amountNum + fee, currency)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)}>
                <ChevronLeft size={14} /> Back
              </Button>
              <Button variant="primary" size="md" onClick={handleConfirm} loading={isLoading}>
                {isLoading ? 'Sending' : <><Send size={14} /> Send {fmt(amountNum, currency)}</>}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', display: 'grid', placeItems: 'center', margin: '0 auto 16px', color: 'var(--success)' }}>
              <Check size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Transfer sent</div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '6px 0 4px' }}>
              {fmt(amountNum, currency)} is on its way{recipient ? ` to ${recipient.name}` : ''}.
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-faint)', margin: '0 0 18px' }}>Funds arrive instantly.</p>
            <Button variant="primary" size="md" onClick={handleDone}>
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
