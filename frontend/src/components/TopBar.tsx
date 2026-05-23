import { LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function TopBar() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 border-b border-[#222222] bg-[#0a0a0a] flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <UserCircle className="w-4 h-4 text-[#9ca3af]" />
        <span className="text-sm text-[#9ca3af]">
          {user ? `${user.first_name} ${user.last_name}` : ''}
        </span>
      </div>

      <button
        onClick={logout}
        className="flex items-center gap-2 text-sm text-[#9ca3af] hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-[#1a1a1a]"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </header>
  );
}
