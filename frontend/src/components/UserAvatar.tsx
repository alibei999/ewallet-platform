import { getAvatarGradient, getUserDisplayName, getUserInitials } from '@/lib/userDisplay';
import type { User } from '@/types';

interface UserAvatarProps {
  user: Pick<User, 'first_name' | 'last_name' | 'email'> | null | undefined;
  size?: number;
  fontSize?: number;
}

export default function UserAvatar({ user, size = 36, fontSize }: UserAvatarProps) {
  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(displayName);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        background: getAvatarGradient(displayName),
        display: 'grid',
        placeItems: 'center',
        fontWeight: 600,
        color: 'white',
        fontSize: fontSize ?? size * 0.36,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {initials}
    </div>
  );
}
