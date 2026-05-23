import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-2xl bg-[#1a1a1a] border border-[#222222] flex items-center justify-center">
            <AlertTriangle className="w-9 h-9 text-[#6366f1]" />
          </div>
        </div>

        <h1 className="text-7xl font-extrabold text-white tracking-tight">404</h1>
        <p className="text-xl font-semibold text-white mt-3">Page not found</p>
        <p className="text-[#9ca3af] text-sm mt-2 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <Link
          to="/"
          className="inline-flex items-center gap-2 mt-8 bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
