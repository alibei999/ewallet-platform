import { Check, Plus } from 'lucide-react';
import { CURRENCIES, CURRENCY_NAME, CURRENCY_SYMBOL } from '@/lib/currency';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/context/ToastContext';
import Button from '@/components/ui/Button';

interface AddCurrencyModalProps {
  onClose: () => void;
}

export default function AddCurrencyModal({ onClose }: AddCurrencyModalProps) {
  const { balances, addCurrency } = useAppData();
  const { notify } = useToast();
  const active = new Set(balances.map((b) => b.currency));
  const available = CURRENCIES.filter((c) => !active.has(c));

  function handleAdd(currency: string) {
    addCurrency(currency);
    notify({
      title: `${currency} wallet added`,
      description: `Your ${CURRENCY_NAME[currency] ?? currency} balance is active and ready to fund.`,
      tone: 'success',
    });
    onClose();
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text)' }}>Add currency</div>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            Enable additional balances to receive and send funds.
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

      <div style={{ display: 'grid', gap: 10 }}>
        {available.length === 0 ? (
          <div style={{ padding: 18, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-muted)', fontSize: 13 }}>
            All supported currencies are already active.
          </div>
        ) : (
          available.map((currency) => (
            <div
              key={currency}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderRadius: 12,
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                transition: 'border-color 120ms, background 120ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--card)', border: '1px solid var(--border)', display: 'grid', placeItems: 'center', fontWeight: 700, fontSize: 14, color: 'var(--text)', flexShrink: 0 }}>
                  {CURRENCY_SYMBOL[currency] ?? currency}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{currency}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {CURRENCY_NAME[currency] ?? currency} · balance starts at zero
                  </div>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => handleAdd(currency)}>
                <Plus size={13} /> Add
              </Button>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <Check size={13} /> Done
        </Button>
      </div>
    </div>
  );
}
