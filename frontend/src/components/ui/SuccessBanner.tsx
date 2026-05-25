import { Check } from 'lucide-react';

interface SuccessBannerProps {
  message: string;
}

export default function SuccessBanner({ message }: SuccessBannerProps) {
  return (
    <div className="alert-success" role="status">
      <Check size={16} />
      <span>{message}</span>
    </div>
  );
}
