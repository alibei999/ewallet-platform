import { useState, useRef, useEffect } from 'react';
import type { CountryCode } from 'libphonenumber-js';

interface Country {
  code: CountryCode;
  name: string;
  dial: string;
  maxDigits: number;
  groups: number[];
  placeholder: string;
}

const COUNTRIES: Country[] = [
  { code: 'KZ', name: 'Kazakhstan',     dial: '+7',   maxDigits: 10, groups: [3, 3, 4],       placeholder: '707 123 4567'  },
  { code: 'RU', name: 'Russia',         dial: '+7',   maxDigits: 10, groups: [3, 3, 2, 2],    placeholder: '912 345 67 89' },
  { code: 'US', name: 'United States',  dial: '+1',   maxDigits: 10, groups: [3, 3, 4],       placeholder: '555 000 0000'  },
  { code: 'GB', name: 'United Kingdom', dial: '+44',  maxDigits: 10, groups: [4, 3, 3],       placeholder: '7911 123 456'  },
  { code: 'DE', name: 'Germany',        dial: '+49',  maxDigits: 11, groups: [3, 4, 4],       placeholder: '151 1234 5678' },
  { code: 'FR', name: 'France',         dial: '+33',  maxDigits: 9,  groups: [1, 2, 2, 2, 2], placeholder: '6 12 34 56 78' },
  { code: 'TR', name: 'Turkey',         dial: '+90',  maxDigits: 10, groups: [3, 3, 2, 2],    placeholder: '501 234 56 78' },
  { code: 'AE', name: 'UAE',            dial: '+971', maxDigits: 9,  groups: [2, 3, 4],       placeholder: '50 123 4567'   },
];

function flagUrl(code: string) {
  return `https://flagcdn.com/w20/${code.toLowerCase()}.png`;
}

function applyGroups(digits: string, groups: number[]): string {
  let result = '';
  let pos = 0;
  for (let i = 0; i < groups.length; i++) {
    if (pos >= digits.length) break;
    if (i > 0) result += ' ';
    result += digits.slice(pos, pos + groups[i]);
    pos += groups[i];
  }
  return result;
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneInput({ value: _value, onChange }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState<CountryCode>('KZ');
  const [digits, setDigits] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]!;

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onOutsideClick);
    return () => document.removeEventListener('mousedown', onOutsideClick);
  }, [open]);

  function selectCountry(code: CountryCode) {
    setCountryCode(code);
    setDigits('');
    onChange('');
    setOpen(false);
  }

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    const limited = raw.slice(0, country.maxDigits);
    setDigits(limited);
    onChange(limited ? country.dial + limited : '');
  }

  return (
    <div ref={wrapRef} style={{ display: 'flex', position: 'relative' }}>
      {/* Country selector trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="vault-input"
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 'none',
          width: 'auto',
          minWidth: 104,
          paddingLeft: 10,
          paddingRight: 10,
          flexShrink: 0,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 13,
          fontWeight: 500,
          background: open ? 'rgba(99,102,241,0.07)' : undefined,
        }}
      >
        <img
          src={flagUrl(country.code)}
          alt={country.code}
          width={20}
          height={14}
          style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0, display: 'block' }}
        />
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{country.code}</span>
        <span style={{ color: 'var(--text-muted)' }}>{country.dial}</span>
        <svg
          width="10" height="6" viewBox="0 0 10 6" fill="none"
          style={{
            marginLeft: 'auto', flexShrink: 0, color: 'var(--text-faint)',
            transform: open ? 'rotate(180deg)' : 'none',
            transition: 'transform 0.15s ease',
          }}
        >
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          minWidth: 228,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: '4px 0',
          zIndex: 100,
          boxShadow: '0 8px 32px rgba(0,0,0,0.45)',
          overflow: 'hidden',
        }}>
          {COUNTRIES.map((c) => {
            const active = c.code === countryCode;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => selectCountry(c.code)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  width: '100%',
                  padding: '8px 14px',
                  background: active ? 'rgba(99,102,241,0.10)' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'var(--text)',
                }}
              >
                <img
                  src={flagUrl(c.code)}
                  alt={c.code}
                  width={20}
                  height={14}
                  style={{ borderRadius: 2, objectFit: 'cover', flexShrink: 0, display: 'block' }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: active ? 'var(--accent)' : 'var(--text)', minWidth: 28 }}>
                  {c.code}
                </span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{c.name}</span>
                <span style={{ fontSize: 12, color: 'var(--text-faint)', fontVariantNumeric: 'tabular-nums' }}>{c.dial}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Phone number input */}
      <input
        className="vault-input"
        type="tel"
        value={applyGroups(digits, country.groups)}
        onChange={handleNumberChange}
        placeholder={country.placeholder}
        style={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          flex: 1,
          minWidth: 0,
        }}
      />
    </div>
  );
}
