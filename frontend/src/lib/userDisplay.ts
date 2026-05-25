import type { User } from '@/types';

export function getUserDisplayName(
  user: Pick<User, 'first_name' | 'last_name' | 'email'> | null | undefined,
): string {
  const full = `${user?.first_name ?? ''} ${user?.last_name ?? ''}`.trim();
  if (full) return full;

  const email = user?.email?.trim();
  if (email) {
    const local = email.split('@')[0] ?? '';
    if (!local) return 'User';
    return local.charAt(0).toUpperCase() + local.slice(1);
  }

  return 'User';
}

export function getUserInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  const word = parts[0] ?? 'U';
  return word.slice(0, 2).toUpperCase();
}

export function getAvatarGradient(displayName: string): string {
  let h = 0;
  for (let i = 0; i < displayName.length; i++) {
    h = (h * 31 + displayName.charCodeAt(i)) & 0xffff;
  }
  const hue = h % 360;
  return `linear-gradient(135deg, hsl(${hue} 60% 45%), hsl(${(hue + 50) % 360} 60% 35%))`;
}
