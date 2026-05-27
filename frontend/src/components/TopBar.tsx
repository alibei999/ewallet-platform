import { Link, useLocation } from 'react-router-dom';

const PAGE_META: Record<string, { section?: string; title: string }> = {
  '/dashboard': { title: 'Dashboard' },
  '/wallet': { title: 'Wallet' },
  '/transactions': { title: 'Transactions' },
  '/crypto': { section: 'Assets', title: 'Crypto' },
  '/merchant': { section: 'Business', title: 'Merchant' },
  '/settings': { title: 'Settings' },
  '/admin/users': { section: 'Admin', title: 'Users' },
  '/admin/kyc': { section: 'Admin', title: 'KYC reviews' },
  '/admin/transactions': { section: 'Admin', title: 'All transactions' },
};

function resolveMeta(pathname: string) {
  if (pathname.startsWith('/transactions/')) {
    return { section: 'Transactions', title: 'Details' };
  }
  if (pathname.startsWith('/invoices/')) {
    return { section: 'Payments', title: 'Pay invoice' };
  }
  return PAGE_META[pathname];
}

export default function TopBar() {
  const { pathname } = useLocation();
  const meta = resolveMeta(pathname);
  const crumbs = meta
    ? [meta.section, meta.title].filter(Boolean) as string[]
    : [pathname.replace(/^\//, '').replace(/-/g, ' ') || 'Page'];

  return (
    <header className="topbar">
      <nav className="topbar__crumbs" aria-label="Breadcrumb">
        {crumbs.map((c, i) => (
          <span key={c} className="topbar__crumb">
            {i > 0 && <span className="topbar__sep" aria-hidden>/</span>}
            <span className={i === crumbs.length - 1 ? 'topbar__current' : undefined}>{c}</span>
          </span>
        ))}
      </nav>
      <Link to="/settings" className="topbar__settings-link">
        Account
      </Link>
    </header>
  );
}
