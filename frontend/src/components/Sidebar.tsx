import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Wallet, Send, Download, Upload, List,
  ShieldCheck, Bitcoin, Store, Settings, Users, Activity,
  PanelLeft, LogOut, ChevronDown, Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import { getUserDisplayName } from '@/lib/userDisplay';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const sections = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',    icon: LayoutDashboard, href: '/dashboard' },
      { label: 'Wallet',       icon: Wallet,          href: '/wallet' },
      { label: 'Transfer',     icon: Send,            href: '/transfer' },
      { label: 'Deposit',      icon: Download,        href: '/deposit' },
      { label: 'Withdraw',     icon: Upload,          href: '/withdraw' },
      { label: 'Transactions', icon: List,            href: '/transactions' },
    ] as NavItem[],
  },
  {
    label: 'More',
    items: [
      { label: 'Crypto',       icon: Bitcoin,    href: '/crypto' },
      { label: 'Merchant',     icon: Store,      href: '/merchant' },
      { label: 'Settings',     icon: Settings,   href: '/settings' },
    ] as NavItem[],
  },
];

const adminSection = {
  label: 'Admin',
  items: [
    { label: 'Users',        icon: Users,       href: '/admin/users' },
    { label: 'KYC Reviews',  icon: ShieldCheck, href: '/admin/kyc' },
    { label: 'Transactions', icon: Activity,    href: '/admin/transactions' },
  ] as NavItem[],
};

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isAdmin = user?.role === 'admin';

  const fullName = getUserDisplayName(user);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate('/');
  }

  const navSections = isAdmin ? [...sections, adminSection] : sections;

  return (
    <aside
      style={{
        width: collapsed ? 68 : 260,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 220ms cubic-bezier(.4,0,.2,1)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          gap: 8,
        }}
      >
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: '-0.01em', color: 'var(--text)', whiteSpace: 'nowrap' }}>
            eWallet
          </span>
        )}
        <button
          onClick={onToggle}
          style={{
            width: 28, height: 28,
            border: '1px solid var(--border)',
            background: 'transparent',
            borderRadius: 8,
            display: 'grid', placeItems: 'center',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            marginLeft: collapsed ? 'auto' : 0,
            marginRight: collapsed ? 'auto' : 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--card)'; e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <PanelLeft size={14} />
        </button>
      </div>

      {/* Nav */}
      <nav style={{ padding: '16px 12px', flex: 1, overflowY: 'auto' }}>
        {navSections.map((sec, si) => (
          <div key={sec.label} style={{ marginTop: si === 0 ? 0 : 16 }}>
            {!collapsed && (
              <div
                style={{
                  fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em',
                  color: 'var(--text-faint)', padding: '8px 12px', fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                {sec.label}
              </div>
            )}
            {sec.items.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/dashboard'}
                title={collapsed ? item.label : undefined}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: collapsed ? 0 : 12,
                  padding: collapsed ? '9px' : '9px 12px',
                  justifyContent: collapsed ? 'center' : undefined,
                  borderRadius: isActive ? (collapsed ? 8 : '0 8px 8px 0') : 8,
                  color: isActive ? 'white' : 'var(--text-muted)',
                  background: isActive ? 'var(--accent-glow)' : 'transparent',
                  borderLeft: isActive && !collapsed ? '2px solid var(--accent)' : '2px solid transparent',
                  paddingLeft: isActive && !collapsed ? 10 : collapsed ? 9 : 12,
                  fontSize: 14,
                  fontWeight: 500,
                  marginBottom: 2,
                  textDecoration: 'none',
                  transition: 'background 120ms, color 120ms',
                  whiteSpace: 'nowrap',
                })}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  if (!el.getAttribute('aria-current')) {
                    el.style.background = 'var(--card)';
                    el.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  if (!el.getAttribute('aria-current')) {
                    el.style.background = 'transparent';
                    el.style.color = 'var(--text-muted)';
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} style={{ flexShrink: 0, color: isActive ? 'white' : 'currentColor' }} />
                    {!collapsed && (
                      <span style={{ opacity: 1, transition: 'opacity 160ms' }}>{item.label}</span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Footer user area */}
      <div
        ref={menuRef}
        onClick={() => setMenuOpen(!menuOpen)}
        style={{
          borderTop: '1px solid var(--border)',
          padding: '14px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        <UserAvatar user={user} size={36} />
        {!collapsed && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fullName}
              </div>
              <div style={{ color: 'var(--text-faint)', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.email}
              </div>
            </div>
            <ChevronDown
              size={14}
              stroke="var(--text-muted)"
              style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 160ms', flexShrink: 0 }}
            />
          </>
        )}

        {/* Dropdown */}
        {menuOpen && (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              ...(collapsed
                ? { left: 'calc(100% + 8px)', bottom: 0 }
                : { left: 10, right: 10, bottom: 'calc(100% + 6px)' }
              ),
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              boxShadow: '0 20px 50px -10px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.02)',
              padding: 6,
              zIndex: 50,
              minWidth: 220,
            }}
          >
            {/* Header */}
            <div style={{ padding: '10px 12px 12px', borderBottom: '1px solid var(--border-soft)', marginBottom: 4 }}>
              <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>{fullName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 8 }}>{user?.email}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {user?.is_active
                  ? <span className="badge badge-success"><Check size={11} />Verified</span>
                  : <span className="badge badge-neutral">Not verified</span>
                }
                {isAdmin && <span className="badge badge-transfer">Admin</span>}
              </div>
            </div>

            {/* Settings */}
            <div
              onClick={() => { navigate('/settings'); setMenuOpen(false); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                color: 'var(--text-2)', fontSize: 13,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-2)'; }}
            >
              <Settings size={15} strokeWidth={1.75} color="var(--text-muted)" />
              Settings
            </div>

            <div style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />

            {/* Sign out */}
            <div
              onClick={() => { setMenuOpen(false); handleLogout(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                color: 'var(--error)', fontSize: 13,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut size={15} strokeWidth={1.75} color="var(--error)" />
              Sign out
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
