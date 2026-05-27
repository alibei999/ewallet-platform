import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
  showLogo?: boolean;
}

export default function AuthLayout({ title, subtitle, children, footer, showLogo = true }: AuthLayoutProps) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__inner">
        <Link to="/" className="auth-shell__brand">
          {showLogo && <span className="auth-shell__logo" aria-hidden />}
          eWallet
        </Link>
        <div className="auth-shell__intro">
          <h1 className="auth-shell__title">{title}</h1>
          <p className="auth-shell__subtitle">{subtitle}</p>
        </div>
        <div className="vault-card auth-shell__card">{children}</div>
        {footer && <div className="auth-shell__footer">{footer}</div>}
      </div>
    </div>
  );
}
