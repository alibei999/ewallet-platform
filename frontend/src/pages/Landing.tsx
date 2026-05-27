import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ShieldCheck,
  Zap,
  Store,
  Wallet,
  Globe,
  Activity,
  Clock,
  Menu,
  X,
} from 'lucide-react';

const FEATURE_CARDS = [
  {
    icon: ShieldCheck,
    title: 'Secure by design',
    description: 'JWT authentication, strict access control, and role-based security across the platform.',
  },
  {
    icon: Zap,
    title: 'Instant transfers',
    description: 'Real-time balance updates and fast settlements for internal and external transfers.',
  },
  {
    icon: Store,
    title: 'Merchant-ready',
    description: 'Create invoices, receive webhooks, and accept payments via a clean merchant API.',
  },
];

const VALUE_POINTS = [
  'Multi-currency accounts with real-time settlement (KZT, USD, EUR)',
  'Automated KYC/AML onboarding built to global compliance standards',
  'Immutable transaction ledgers with advanced fraud detection',
  'Granular admin control panels for instantaneous transaction reviews',
];

const STATS = [
  { value: '<1s', label: 'Transfer speed', icon: Zap },
  { value: '99.9%', label: 'API uptime target', icon: Activity },
  { value: '24/7', label: 'Availability', icon: Clock },
  { value: 'Global', label: 'Currency coverage', icon: Globe },
];

export default function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [activeModal, setActiveModal] = useState<null | 'privacy' | 'terms' | 'support'>(null);

  useEffect(() => {
    if (!activeModal) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveModal(null);
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [activeModal]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!formData.name || !formData.email) return;
    setIsSubmitting(true);
    setIsSuccess(false);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 900);
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold">
            eWallet
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#9ca3af]" aria-label="Primary">
            <a href="#product" className="hover:text-white transition-colors">Product</a>
            <a href="#value" className="hover:text-white transition-colors">Value</a>
            <a href="#contact" className="hover:text-white transition-colors">Contact</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#9ca3af] hover:text-white transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-[#6366f1] hover:bg-[#5558e3] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
            <button
              type="button"
              className="md:hidden ml-1 p-2 rounded-lg border border-white/5 text-[#9ca3af] hover:text-white hover:border-white/10 transition-colors"
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen((open) => !open)}
            >
              {isMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-[#0a0a0a]">
            <nav className="px-6 py-4 flex flex-col gap-3 text-sm text-[#9ca3af]" aria-label="Mobile">
              <a href="#product" className="hover:text-white transition-colors" onClick={closeMenu}>Product</a>
              <a href="#value" className="hover:text-white transition-colors" onClick={closeMenu}>Value</a>
              <a href="#contact" className="hover:text-white transition-colors" onClick={closeMenu}>Contact</a>
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* Hero */}
        <section className="px-6 pt-20 pb-14" aria-labelledby="landing-hero">
          <div className="max-w-6xl mx-auto grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 border border-[#222222] bg-[#111111] px-3 py-1.5 rounded-full text-xs text-[#9ca3af]">
                <span className="w-2 h-2 rounded-full bg-[#22c55e]" />
                Enterprise payments infrastructure
              </div>
              <h1 id="landing-hero" className="mt-5 text-4xl md:text-5xl font-semibold leading-tight">
                Enterprise-grade digital banking infrastructure for regulated scale.
              </h1>
              <p className="mt-5 text-[#9ca3af] text-lg leading-relaxed">
                eWallet delivers multi-currency accounts, real-time settlement, KYC/AML automation, and merchant
                tooling in a single, secure platform built for compliance-first growth.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center justify-center gap-2 bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 border border-[#222222] hover:border-[#6366f1] text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
              </div>
              <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {STATS.map((stat) => (
                  <div key={stat.label} className="bg-[#111111] border border-white/5 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2 text-[#9ca3af] text-xs">
                      <stat.icon className="w-4 h-4" />
                      {stat.label}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-white">{stat.value}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
              <div className="text-sm text-[#9ca3af]">Live balances</div>
              <div className="mt-4 space-y-3">
                {[
                  { code: 'KZT', amount: '125,000.00' },
                  { code: 'USD', amount: '1,250.50' },
                  { code: 'EUR', amount: '980.00' },
                ].map((wallet) => (
                  <div
                    key={wallet.code}
                    className="flex items-center justify-between bg-[#0f0f0f] border border-white/5 rounded-xl px-4 py-3"
                  >
                    <div className="text-sm text-[#9ca3af]">{wallet.code}</div>
                    <div className="font-semibold text-white">{wallet.amount}</div>
                  </div>
                ))}
              </div>
              <div className="mt-6 border-t border-white/5 pt-4 text-sm text-[#9ca3af]">
                Recent activity
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between text-[#9ca3af]">
                  <span>Merchant payout</span>
                  <span className="text-white">- 220.00 USD</span>
                </div>
                <div className="flex items-center justify-between text-[#9ca3af]">
                  <span>Wallet deposit</span>
                  <span className="text-white">+ 12,000.00 KZT</span>
                </div>
                <div className="flex items-center justify-between text-[#9ca3af]">
                  <span>Transfer sent</span>
                  <span className="text-white">- 45.00 EUR</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product */}
        <section id="product" className="px-6 py-16 bg-[#111111]" aria-labelledby="product-title">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between gap-6 flex-wrap">
              <div>
                <h2 id="product-title" className="text-3xl font-semibold">Built for real usage</h2>
                <p className="mt-2 text-[#9ca3af] max-w-2xl">
                  Every screen is designed to be clean, fast, and production-ready with scalable workflows and
                  banking-grade encryption across critical operations.
                </p>
              </div>
              <Link to="/register" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                Start now
              </Link>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {FEATURE_CARDS.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6"
                >
                  <div className="w-11 h-11 rounded-xl bg-[#6366f1]/10 flex items-center justify-center">
                    <feature.icon className="w-5 h-5 text-[#6366f1]" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-3 text-sm text-[#9ca3af] leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Value */}
        <section id="value" className="px-6 py-16" aria-labelledby="value-title">
          <div className="max-w-6xl mx-auto grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 id="value-title" className="text-3xl font-semibold">Enterprise-grade infrastructure for modern digital banking</h2>
              <p className="mt-3 text-[#9ca3af] leading-relaxed">
                A complete fintech ecosystem engineered for secure digital asset management, seamless merchant onboarding,
                and automated compliance workflows.
              </p>
              <div className="mt-6 space-y-3">
                {VALUE_POINTS.map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-[#9ca3af]">
                    <span className="w-6 h-6 rounded-full bg-[#6366f1]/10 text-[#6366f1] flex items-center justify-center">
                      <Check className="w-4 h-4" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between text-sm text-[#9ca3af]">
                <span>Operations</span>
                <span>Last 24h</span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { label: 'Verified users', value: '1,240', icon: ShieldCheck },
                  { label: 'Merchant payouts', value: '94', icon: Store },
                  { label: 'Wallet transfers', value: '4,820', icon: Wallet },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between bg-[#0f0f0f] border border-white/5 rounded-xl px-4 py-3"
                  >
                    <div className="flex items-center gap-3 text-sm text-[#9ca3af]">
                      <row.icon className="w-4 h-4 text-[#6366f1]" />
                      {row.label}
                    </div>
                    <div className="text-white font-semibold">{row.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="px-6 pb-20" aria-labelledby="contact-title">
          <div className="max-w-6xl mx-auto bg-[#111111] border border-white/5 rounded-2xl p-8 md:p-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div>
                <h3 id="contact-title" className="text-2xl font-semibold">Talk to our team</h3>
                <p className="mt-2 text-[#9ca3af]">
                  Leave your contact details and we will reach out within 24 hours.
                </p>
              </div>
              <form className="w-full max-w-md space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-[#737373]">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    required
                    className="mt-2 bg-[#0f0f0f] border border-white/5 text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1]"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-[0.15em] text-[#737373]">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    required
                    className="mt-2 bg-[#0f0f0f] border border-white/5 text-white rounded-lg px-4 py-3 w-full focus:outline-none focus:border-[#6366f1]"
                    placeholder="name@company.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending...' : 'Send request'}
                  <ArrowRight className="w-4 h-4" />
                </button>
                {isSuccess && (
                  <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                    Thank you! Our team will reach out shortly.
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-[#9ca3af]">
          <span>© 2026 eWallet. All rights reserved.</span>
          <div className="flex items-center gap-6">
            <button
              type="button"
              className="hover:text-white transition-colors"
              onClick={() => setActiveModal('privacy')}
            >
              Privacy
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors"
              onClick={() => setActiveModal('terms')}
            >
              Terms
            </button>
            <button
              type="button"
              className="hover:text-white transition-colors"
              onClick={() => setActiveModal('support')}
            >
              Support
            </button>
          </div>
        </div>
      </footer>

      {activeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
          onClick={() => setActiveModal(null)}
        >
          <div
            className="w-full max-w-lg md:max-w-xl rounded-2xl border border-white/5 bg-[#111111] p-8 shadow-xl max-h-[85vh] overflow-hidden"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white capitalize">{activeModal}</h3>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="text-[#9ca3af] hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2 text-left">
              {activeModal === 'privacy' && (
                <div className="text-sm text-neutral-300 leading-7 space-y-6 max-w-2xl mx-auto">
                  <div>
                    <h3 className="text-base font-semibold text-white">Privacy Policy</h3>
                    <p className="text-neutral-400">Last updated: May 2026</p>
                  </div>
                  <p>
                    Welcome to E-wallet. Your privacy and data security are our absolute priorities. This Privacy
                    Policy explains how we collect, use, and protect your personal and financial information.
                  </p>
                  <div>
                    <h4 className="text-sm font-semibold text-white">1. Information We Collect</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>Personal Identity: Full name, date of birth, and government-issued ID (for KYC verification).</li>
                      <li>Contact Data: Email address, phone number.</li>
                      <li>Financial Information: Linked bank accounts, card details (encrypted), and transaction history.</li>
                      <li>Technical Data: IP address, device information, and browser cookies.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">2. How We Use Your Data</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>To process your payments, transfers, and maintain your account.</li>
                      <li>To prevent fraud, money laundering, and unauthorized access (AML/CFT compliance).</li>
                      <li>To provide customer support and send critical security alerts.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">3. Data Protection &amp; Security</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>All financial transactions are encrypted using AES-256 and SSL/TLS protocols.</li>
                      <li>We strictly comply with international data protection standards. We never sell or rent your personal data to third parties.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">4. Your Rights</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>
                        You have the right to access, correct, or request the deletion of your personal data at any
                        time through your account settings or by contacting our support team.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              {activeModal === 'terms' && (
                <div className="text-sm text-neutral-300 leading-7 space-y-6 max-w-2xl mx-auto">
                  <div>
                    <h3 className="text-base font-semibold text-white">Terms of Service</h3>
                    <p className="text-neutral-400">Last updated: May 2026</p>
                  </div>
                  <p>
                    By creating an account or using the E-wallet platform, you agree to comply with and be bound by
                    the following Terms of Service. Please read them carefully.
                  </p>
                  <div>
                    <h4 className="text-sm font-semibold text-white">1. Account Eligibility &amp; Registration</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>You must be at least 18 years old (or the legal age of majority in your jurisdiction) to use this service.</li>
                      <li>You agree to provide accurate, current, and complete information during the registration and verification (KYC) process.</li>
                      <li>You are solely responsible for maintaining the confidentiality of your account credentials (password, PIN, 2FA).</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">2. Acceptable Use &amp; Prohibited Activities</h4>
                    <p className="text-neutral-400">You agree NOT to use E-wallet for:</p>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>Any illegal activities, including money laundering, fraud, or terrorist financing.</li>
                      <li>Purchasing prohibited goods or services.</li>
                      <li>Attempting to breach, reverse-engineer, or disrupt the platform's security infrastructure.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">3. Fees and Transactions</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>All fees associated with transfers, currency conversions, or withdrawals are clearly displayed before transaction confirmation.</li>
                      <li>E-wallet reserves the right to hold or cancel transactions suspected of fraudulent activity or policy violation.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">4. Limitation of Liability</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>
                        E-wallet provides services "as is" and is not liable for any indirect, incidental, or punitive
                        damages resulting from your use or inability to use the platform.
                      </li>
                    </ul>
                  </div>
                </div>
              )}
              {activeModal === 'support' && (
                <div className="text-sm text-neutral-300 leading-7 space-y-6 max-w-2xl mx-auto">
                  <div>
                    <h3 className="text-base font-semibold text-white">Support &amp; Help Center</h3>
                    <p className="text-neutral-400">
                      Need assistance? Our dedicated support team is here to help you secure and manage your digital
                      assets 24/7.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Frequently Asked Questions (FAQ)</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>How long do verification (KYC) approvals take? Identity verification typically takes between 10 minutes to 2 hours. You will receive a push notification and an email once approved.</li>
                      <li>What should I do if I notice an unauthorized transaction? Immediately freeze your wallet/cards via the security settings in your dashboard and contact our fraud prevention team instantly.</li>
                      <li>Are there limits on daily transfers? Yes, limits depend on your account verification tier. You can view and request to upgrade your limits in your Profile.</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">Contact Us Directly</h4>
                    <ul className="mt-3 list-disc pl-5 space-y-2 text-neutral-400">
                      <li>Email Support: support@ewallet.com (Average response time: &lt; 15 minutes)</li>
                      <li>Live Chat: Available 24/7 inside the web dashboard or mobile app.</li>
                      <li>Security &amp; Fraud Hotline: +1 (800) 555-WALLET (For urgent account freezing).</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                className="mt-8 px-5 py-2.5 rounded-lg border border-white/5 text-sm text-white hover:border-white/10 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
