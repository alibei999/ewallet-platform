import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  padding?: boolean;
}

export default function Card({ children, className = '', style, padding = true }: CardProps) {
  return (
    <div
      className={`vault-card${padding ? '' : ' vault-card--flat'} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}
