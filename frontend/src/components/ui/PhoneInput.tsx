import { useState } from 'react';
import { formatIncompletePhoneNumber } from 'libphonenumber-js';
import type { CountryCode } from 'libphonenumber-js';

const COUNTRIES: { code: CountryCode; flag: string; dial: string; placeholder: string }[] = [
  { code: 'KZ', flag: '🇰🇿', dial: '+7',   placeholder: '700 123 45 67' },
  { code: 'RU', flag: '🇷🇺', dial: '+7',   placeholder: '912 345 67 89' },
  { code: 'US', flag: '🇺🇸', dial: '+1',   placeholder: '555 000 0000'  },
  { code: 'GB', flag: '🇬🇧', dial: '+44',  placeholder: '7911 123 456'  },
  { code: 'DE', flag: '🇩🇪', dial: '+49',  placeholder: '151 1234 5678' },
  { code: 'FR', flag: '🇫🇷', dial: '+33',  placeholder: '6 12 34 56 78' },
  { code: 'TR', flag: '🇹🇷', dial: '+90',  placeholder: '501 234 56 78' },
  { code: 'AE', flag: '🇦🇪', dial: '+971', placeholder: '50 123 4567'   },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
}

export default function PhoneInput({ value, onChange }: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState<CountryCode>('KZ');
  const country = COUNTRIES.find((c) => c.code === countryCode) ?? COUNTRIES[0]!;

  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '');
    const formatted = digits ? formatIncompletePhoneNumber(digits, countryCode) : '';
    onChange(formatted);
  }

  function handleCountryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    setCountryCode(e.target.value as CountryCode);
    onChange('');
  }

  return (
    <div style={{ display: 'flex' }}>
      <select
        value={countryCode}
        onChange={handleCountryChange}
        className="vault-input"
        style={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          borderRight: 'none',
          width: 'auto',
          minWidth: 86,
          paddingLeft: 10,
          paddingRight: 6,
          flexShrink: 0,
          cursor: 'pointer',
          fontSize: 13,
        }}
      >
        {COUNTRIES.map((c) => (
          <option key={c.code} value={c.code}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        className="vault-input"
        type="tel"
        value={value}
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
