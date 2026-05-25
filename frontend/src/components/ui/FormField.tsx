import type { InputHTMLAttributes, ReactNode } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: ReactNode;
}

export default function FormField({ label, hint, className = '', id, ...inputProps }: FormFieldProps) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="form-field">
      <label className="form-field__label" htmlFor={fieldId}>
        {label}
      </label>
      <input id={fieldId} className={`vault-input ${className}`.trim()} {...inputProps} />
      {hint && <div className="form-field__hint">{hint}</div>}
    </div>
  );
}
