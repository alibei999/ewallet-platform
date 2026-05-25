import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  ShieldCheck,
  Store,
  Bitcoin,
  Settings,
  Users,
  X,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

const mainNav: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Wallet', icon: Wallet, href: '/wallet' },
  { label: 'Transfer', icon: ArrowLeftRight, href: '/transfer' },
  { label: 'Deposit', icon: ArrowDownCircle, href: '/deposit' },
  { label: 'Withdraw', icon: ArrowUpCircle, href: '/withdraw' },
  { label: 'Transactions', icon: ClipboardList, href: '/transactions' },
  { label: 'KYC', icon: ShieldCheck, href: '/kyc' },
  { label: 'Merchant', icon: Store, href: '/merchant' },
  { label: 'Crypto', icon: Bitcoin, href: '/crypto' },
  { label: 'Settings', icon: Settings, href: '/settings' },
];

const adminNav: NavItem[] = [
  { label: 'Users', icon: Users, href: '/admin/users' },
  { label: 'KYC Moderation', icon: ShieldCheck, href: '/admin/kyc' },
  { label: 'All Transactions', icon: ClipboardList, href: '/admin/transactions' },
];

interface SidebarProps {
  onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function linkClass({ isActive }: { isActive: boolean }) {
    return `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-[#6366f1] text-white'
        : 'text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a]'
    }`;
  }

  function handleNavClick() {
    onClose?.();
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <aside className="h-screen w-[240px] bg-[#0a0a0a] border-r border-[#222222] flex flex-col py-6 px-3 overflow-y-auto">
      <div className="flex items-center justify-between px-3 mb-8">
        <div>
          <h1 className="text-xl font-bold text-white">eWallet</h1>
          <p className="text-xs text-[#9ca3af]">Payment Platform</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a] transition-colors lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 flex flex-col gap-0.5">
        {mainNav.map(({ label, icon: Icon, href }) => (
          <NavLink
            key={href}
            to={href}
            end={href === '/dashboard'}
            className={linkClass}
            onClick={handleNavClick}
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="mt-5 mb-2 px-3">
              <p className="text-xs font-semibold text-[#9ca3af]/60 uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNav.map(({ label, icon: Icon, href }) => (
              <NavLink key={href} to={href} className={linkClass} onClick={handleNavClick}>
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </NavLink>
            ))}
          </>
        )}
      </nav>

      {/* User section at bottom */}
      <div className="border-t border-[#222222] pt-4 mt-4">
        <div className="flex items-center gap-3 px-3 mb-3">
          <div className="w-9 h-9 bg-[#1a1a1a] rounded-full flex items-center justify-center border border-[#222222]">
            <span className="text-sm font-medium text-white">
              {user?.first_name?.[0] || 'U'}{user?.last_name?.[0] || ''}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.first_name} {user?.last_name}
            </p>
            <p className="text-xs text-[#9ca3af] truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[#9ca3af] hover:text-white hover:bg-[#1a1a1a] transition-colors w-full"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
