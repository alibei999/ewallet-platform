import { useMemo, useState } from 'react';
import { Building, CreditCard, Bitcoin, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/LoadingSpinner';
import Button from '@/components/ui/Button';
import ErrorMessage from '@/components/ErrorMessage';
import { CURRENCIES, QUICK_AMOUNTS, currencySymbol, formatMoney, formatQuickAmount } from '@/lib/currency';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/context/ToastContext';

interface FundModalProps {
  mode: 'deposit' | 'withdraw';
  initialCurrency?: string;
  onClose: () => void;
}

type Method = 'Card' | 'Bank' | 'Crypto';

const FEES: Record<'deposit' | 'withdraw', Record<Method, number>> = {
  deposit: { Card: 0.015, Bank: 0, Crypto: 0.01 },
  withdraw: { Card: 0.01, Bank: 0.005, Crypto: 0.01 },
};

const ARRIVES: Record<'deposit' | 'withdraw', Record<Method, string>> = {
  deposit: { Card: 'Instant', Bank: '2–3 business days', Crypto: '10–30 min' },
  withdraw: { Card: 'Instant', Bank: '2–3 business days', Crypto: '10–30 min' },
};

export default function FundModal({ mode, initialCurrency, onClose }: FundModalProps) {
  const navigate = useNavigate();
  const { addDeposit, addWithdrawal } = useAppData();
  const { notify } = useToast();
  const [method, setMethod] = useState<Method>(mode === 'deposit' ? 'Card' : 'Bank');
  const [currency, setCurrency] = useState(initialCurrency || 'KZT');
  const [amount, setAmount] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const amountNum = parseFloat(amount) || 0;
  const fee = amountNum * FEES[mode][method];
  const total = mode === 'deposit' ? amountNum + fee : amountNum - fee;
  const sym = currencySymbol(currency);
  const quickAmounts = QUICK_AMOUNTS[currency] ?? QUICK_AMOUNTS.USD;

  const title = mode === 'deposit' ? 'Add funds' : 'Withdraw funds';
  const cta = mode === 'deposit' ? 'Deposit' : 'Withdraw';

  const cardValid = useMemo(() => {
    if (method !== 'Card') return true;
    const digits = cardNumber.replace(/\s+/g, '');
    return /^\d{12,19}$/.test(digits);
  }, [method, cardNumber]);

  function handleCurrencyChange(next: string) {
    setCurrency(next);
    setAmount('');
  }

  function handleQuickAmount(value: number) {
    setAmount(value.toString());
  }

  function handleSubmit() {
    if (amountNum <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (!cardValid) {
      setError('Enter a valid card number for demo mode.');
      return;
    }
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'deposit') {
        addDeposit(currency, amountNum, fee, `${method} deposit`);
        notify({
          title: 'Funds added successfully',
          description: `${formatMoney(amountNum, currency)} is now available.`,
          tone: 'success',
        });
      } else {
        addWithdrawal(currency, amountNum, fee, `${method} withdrawal`);
        notify({
          title: 'Withdrawal queued',
          description: `${formatMoney(amountNum, currency)} is processing.`,
          tone: 'info',
        });
      }
      onClose();
    }, 700);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>{title}</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {mode === 'deposit'
              ? 'Top up your wallet with card, bank, or crypto.'
              : 'Move funds out to your preferred payout method.'}
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

      {error && <ErrorMessage message={error} onDismiss={() => setError(null)} />}

      <div style={{ display: 'grid', gap: 16 }}>
        <div className="tabs">
          {(['Card', 'Bank', 'Crypto'] as Method[]).map((m) => (
            <div
              key={m}
              className={`tab ${method === m ? 'active' : ''}`}
              onClick={() => {
                if (m === 'Crypto') {
                  navigate('/crypto');
                  onClose();
                  return;
                }
                setMethod(m);
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              {m === 'Card' && <CreditCard size={13} />}
              {m === 'Bank' && <Building size={13} />}
              {m === 'Crypto' && <Bitcoin size={13} />}
              {m}
            </div>
          ))}
        </div>

        <div>
          <label className="form-field__label">Amount</label>
          <div style={{ position: 'relative', marginTop: 6 }}>
            <span style={{ position: 'absolute', top: 0, bottom: 0, left: 18, display: 'flex', alignItems: 'center', fontSize: 22, fontWeight: 600, color: 'var(--text-muted)' }}>{sym}</span>
            <input
              className="vault-input"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              style={{ paddingLeft: 36, height: 64, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', paddingRight: 52 }}
              required
            />
            <span style={{ position: 'absolute', top: 0, bottom: 0, right: 14, display: 'flex', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>{currency}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {quickAmounts.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => handleQuickAmount(v)}
              style={{ flex: '1 1 110px', height: 32, borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
            >
              {formatQuickAmount(v, currency)}
            </button>
          ))}
        </div>

        <div>
          <label className="form-field__label">Currency</label>
          <select className="vault-input" value={currency} onChange={(e) => handleCurrencyChange(e.target.value)} style={{ marginTop: 6 }}>
            {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        {method === 'Card' && (
          <div>
            <label className="form-field__label">Card number</label>
            <input
              className="vault-input"
              type="text"
              value={cardNumber}
              onChange={(e) => setCardNumber(e.target.value)}
              placeholder="Demo card number"
              maxLength={19}
              style={{ marginTop: 6 }}
            />
            <div className="form-field__hint">Use any 12-19 digit number for demo validation.</div>
          </div>
        )}

        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)' }}>
            <span>Fee</span>
            <span>{fee === 0 ? 'Free' : formatMoney(fee, currency)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
            <span>Arrives</span>
            <span>{ARRIVES[mode][method]}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
            <span>{mode === 'deposit' ? 'Total charge' : 'You receive'}</span>
            <span>{amountNum > 0 ? formatMoney(total, currency) : '—'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" onClick={handleSubmit} loading={isLoading}>
            {cta} {amountNum > 0 ? formatMoney(amountNum, currency) : ''} <ChevronRight size={14} />
          </Button>
        </div>

        {isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <LoadingSpinner size="sm" /> Processing transaction...
          </div>
        )}
      </div>
    </div>
  );
}
