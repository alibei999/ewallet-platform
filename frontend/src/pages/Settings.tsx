import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Check, Shield, ChevronDown } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorMessage from '@/components/ErrorMessage';
import PhoneInput from '@/components/ui/PhoneInput';
import { useAuth } from '@/context/AuthContext';
import UserAvatar from '@/components/UserAvatar';
import PageHeader from '@/components/ui/PageHeader';
import { getUserDisplayName } from '@/lib/userDisplay';
import type { KYCStatus } from '@/types';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get('section');

  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Profile fields state
  const [firstName, setFirstName] = useState(user?.first_name ?? '');
  const [lastName, setLastName] = useState(user?.last_name ?? '');
  const [phone, setPhone] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // KYC state
  const [kycStatus, setKycStatus] = useState<KYCStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(true);
  const [kycError, setKycError] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [kycSubmitting, setKycSubmitting] = useState(false);

  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setKycStatus({ status: 'approved', full_name: getUserDisplayName(user), created_at: new Date().toISOString() });
      setKycLoading(false);
    }, 400);
    return () => clearTimeout(t);
  }, [user]);

  useEffect(() => {
    if (sectionParam === 'kyc') {
      setActiveSection('kyc');
    }
  }, [sectionParam]);

  function toggleSection(section: string) {
    setActiveSection(prev => prev === section ? null : section);
  }

  function handleProfileSave(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    setTimeout(() => {
      setUser({ ...user!, first_name: firstName, last_name: lastName });
      setProfileSuccess(true);
      setProfileLoading(false);
    }, 600);
  }

  function handlePasswordChange(e: FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setPasswordError(null);
    setPasswordSuccess(false);
    setPasswordLoading(true);
    setTimeout(() => {
      setPasswordSuccess(true);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      setPasswordLoading(false);
    }, 600);
  }

  function handleKycSubmit(e: FormEvent) {
    e.preventDefault();
    setKycError(null);
    setKycSubmitting(true);
    setTimeout(() => {
      setKycStatus({ status: 'pending', full_name: fullName, created_at: new Date().toISOString() });
      setKycSubmitting(false);
    }, 700);
  }

  function onDeleteAccountClick() {
    const confirmed = window.confirm('Delete your account? This cannot be undone.');
    if (!confirmed) return;
    handleDeleteAccount();
  }

  function handleDeleteAccount() {
    setDeleteError(null);
    setDeleteSuccess(false);
    setDeleteLoading(true);
    setTimeout(() => {
      setDeleteSuccess(true);
      setDeleteLoading(false);
      logout();
      navigate('/login');
    }, 600);
  }

  const displayName = getUserDisplayName(user);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', paddingBottom: 40 }}>
      <PageHeader
        title="Settings"
        subtitle="Profile, security, verification, and account preferences."
      />

      <div className="vault-card settings-profile">
        <div style={{ margin: '0 auto 12px' }}>
          <UserAvatar user={user} size={72} fontSize={24} />
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
          {displayName}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
          {user?.email}
        </div>
        <span className={`badge ${user?.role === 'admin' ? 'badge-transfer' : 'badge-neutral'}`}>
          <span className="badge-dot" />{user?.role ?? 'user'}
        </span>
      </div>

      {/* Секция 2 — Personal Information (Accordion) */}
      <div className="settings-accordion">
        <button
          type="button"
          className="settings-accordion__trigger"
          onClick={() => toggleSection('personal')}
        >
          <h2 className="settings-accordion__title">Personal information</h2>
          <ChevronDown size={20} style={{ transform: activeSection === 'personal' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', color: 'var(--text-muted)' }} />
        </button>
        {activeSection === 'personal' && (
          <div className="vault-card" style={{ marginTop: 16 }}>
            {profileError && <ErrorMessage message={profileError} onDismiss={() => setProfileError(null)} />}
            {profileSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, marginBottom: 16, color: 'var(--success)', fontSize: 13 }}>
                <Check size={14} /> Profile updated.
              </div>
            )}
            <form onSubmit={handleProfileSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>First name</label>
                  <input className="vault-input" type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Last name</label>
                  <input className="vault-input" type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Email</label>
                <input className="vault-input" type="email" value={user?.email ?? ''} readOnly style={{ opacity: 0.6, cursor: 'not-allowed' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
                <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Phone</label>
                <PhoneInput value={phone} onChange={setPhone} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" disabled={profileLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: profileLoading ? 0.5 : 1 }}>
                  {profileLoading ? <LoadingSpinner size="sm" /> : <Check size={14} />}Save Profile
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div className="settings-accordion">
        <button
          type="button"
          className="settings-accordion__trigger"
          onClick={() => toggleSection('kyc')}
        >
          <h2 className="settings-accordion__title">Identity verification</h2>
          <ChevronDown size={20} style={{ transform: activeSection === 'kyc' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', color: 'var(--text-muted)' }} />
        </button>
        {activeSection === 'kyc' && (
          <div className="vault-card" style={{ marginTop: 16 }}>
            {kycLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
                <LoadingSpinner size="sm" />
              </div>
            ) : kycStatus && (kycStatus.status === 'approved' || kycStatus.status === 'pending') ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: kycStatus.status === 'approved' ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)',
                  border: `1px solid ${kycStatus.status === 'approved' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  display: 'grid', placeItems: 'center', margin: '0 auto 16px',
                  color: kycStatus.status === 'approved' ? 'var(--success)' : 'var(--warning)',
                }}>
                  <Shield size={24} />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 600, margin: '0 0 8px', color: 'var(--text)' }}>
                  {kycStatus.status === 'approved' ? 'Identity Verified' : 'Submitted for Review'}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 16px', maxWidth: 400 }}>
                  {kycStatus.status === 'approved'
                    ? 'Your identity has been verified successfully.'
                    : 'Your verification is in our queue. Most reviews complete within 24 hours.'}
                </p>
                <span className={`badge ${kycStatus.status === 'approved' ? 'badge-success' : 'badge-pending'}`}>
                  <span className="badge-dot" />
                  {kycStatus.status === 'approved' ? 'Approved' : 'Under review'}
                </span>
                {kycStatus.full_name && (
                  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, marginTop: 24, textAlign: 'left', width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Full name</span>
                      <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{kycStatus.full_name}</span>
                    </div>
                    {kycStatus.created_at && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', marginTop: 4 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Submitted</span>
                        <span style={{ color: 'var(--text-2)', fontSize: 13, fontWeight: 500 }}>{new Date(kycStatus.created_at).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleKycSubmit}>
                {kycStatus?.status === 'rejected' && (
                  <div style={{ display: 'flex', gap: 10, padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, marginBottom: 20 }}>
                    <Shield size={16} color="var(--error)" style={{ flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12, color: 'var(--error)', lineHeight: 1.5 }}>
                      Your KYC was rejected. Please resubmit with correct information.
                    </div>
                  </div>
                )}
                {kycError && <ErrorMessage message={kycError} onDismiss={() => setKycError(null)} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Full Legal Name</label>
                    <input className="vault-input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Beibarys Aliyev" required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Date of Birth</label>
                    <input className="vault-input" type="date" value={dob} onChange={(e) => setDob(e.target.value)} required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>IIN / ID Number</label>
                    <input className="vault-input" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="000000000000" required />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Photo URL</label>
                    <input className="vault-input" type="text" value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="https://example.com/photo.jpg" />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                  <button type="submit" disabled={kycSubmitting || !fullName || !dob || !idNumber}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: (kycSubmitting || !fullName || !dob || !idNumber) ? 0.5 : 1 }}>
                    {kycSubmitting ? <LoadingSpinner size="sm" /> : <Shield size={14} />}Submit for Review
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="settings-accordion">
        <button
          type="button"
          className="settings-accordion__trigger"
          onClick={() => toggleSection('security')}
        >
          <h2 className="settings-accordion__title">Security</h2>
          <ChevronDown size={20} style={{ transform: activeSection === 'security' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', color: 'var(--text-muted)' }} />
        </button>
        {activeSection === 'security' && (
          <div className="vault-card" style={{ marginTop: 16 }}>
            {passwordError && <ErrorMessage message={passwordError} onDismiss={() => setPasswordError(null)} />}
            {passwordSuccess && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, marginBottom: 16, color: 'var(--success)', fontSize: 13 }}>
                <Check size={14} /> Password changed.
              </div>
            )}
            <form onSubmit={handlePasswordChange}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Current password</label>
                  <input className="vault-input" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>New password</label>
                  <input className="vault-input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.10em', color: 'var(--text-muted)', fontWeight: 500 }}>Confirm new password</label>
                  <input className="vault-input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="submit" disabled={passwordLoading}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 16px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: passwordLoading ? 0.5 : 1 }}>
                  {passwordLoading ? <LoadingSpinner size="sm" /> : <Shield size={14} />}Change Password
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <div style={{ marginTop: 8, paddingTop: 16, borderTop: '1px solid var(--border-soft)' }}>
        {deleteError && <ErrorMessage message={deleteError} onDismiss={() => setDeleteError(null)} />}
        {deleteSuccess && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 10, marginBottom: 12, color: 'var(--success)', fontSize: 13 }}>
            <Check size={14} /> Account deleted.
          </div>
        )}
        <button
          type="button"
          onClick={onDeleteAccountClick}
          disabled={deleteLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            height: 32,
            padding: '0 12px',
            borderRadius: 8,
            background: 'rgba(239,68,68,0.12)',
            border: '1px solid rgba(239,68,68,0.4)',
            color: '#ef4444',
            fontSize: 12,
            fontWeight: 600,
            cursor: deleteLoading ? 'not-allowed' : 'pointer',
            opacity: deleteLoading ? 0.6 : 1,
          }}
        >
          {deleteLoading ? <LoadingSpinner size="sm" /> : null}
          Delete Account
        </button>
      </div>
    </div>
  );
}
