import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function NotFound() {
  return (
    <div className="auth-shell">
      <div className="auth-shell__inner" style={{ textAlign: 'center', maxWidth: 400 }}>
        <p className="vault-eyebrow" style={{ marginBottom: 12 }}>Error 404</p>
        <h1 className="auth-shell__title" style={{ fontSize: '2.5rem' }}>Page not found</h1>
        <p className="auth-shell__subtitle">
          The link may be broken or the page was removed. Check the URL or return home.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
          <Link to="/">
            <Button variant="primary">
              <Home size={16} />
              Home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="secondary">
              <ArrowLeft size={16} />
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
