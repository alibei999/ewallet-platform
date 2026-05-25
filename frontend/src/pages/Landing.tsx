import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Zap,
  Store,
  UserPlus,
  Wallet,
  Send,
  ArrowRight,
  Activity,
  Globe,
  Clock,
} from 'lucide-react';

const FEATURES = [
  {
    icon: ShieldCheck,
    title: 'Secure JWT Auth',
    description: 'Bank-level security with token authentication and encrypted data storage.',
  },
  {
    icon: Zap,
    title: 'Instant Transfers',
    description: 'Send money to anyone in seconds with ACID transactions and real-time updates.',
  },
  {
    icon: Store,
    title: 'Merchant API',
    description: 'Accept payments on your store with simple webhook integration and invoicing.',
  },
];

const STEPS = [
  {
    icon: UserPlus,
    step: '01',
    title: 'Register & KYC',
    description: 'Create your account and verify your identity in minutes.',
  },
  {
    icon: Wallet,
    step: '02',
    title: 'Fund Your Wallet',
    description: 'Deposit via bank transfer, card, or cryptocurrency.',
  },
  {
    icon: Send,
    step: '03',
    title: 'Send & Pay',
    description: 'Transfer money globally or pay merchants instantly.',
  },
];

const CURRENCIES = [
  { code: 'KZT', name: 'Tenge' },
  { code: 'USD', name: 'Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'RUB', name: 'Ruble' },
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'USDT', name: 'Tether' },
];

const STATS = [
  { value: '10,000+', label: 'Transactions Processed', icon: Activity },
  { value: '4', label: 'Currencies Supported', icon: Globe },
  { value: '99.9%', label: 'Uptime Guarantee', icon: ShieldCheck },
  { value: '<1s', label: 'Transfer Speed', icon: Clock },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a]/80 backdrop-blur-lg border-b border-[#222222]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-white">eWallet</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
              How it Works
            </a>
            <a href="#currencies" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
              Currencies
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm text-[#9ca3af] hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold bg-[#6366f1] hover:bg-[#5558e3] text-white px-4 py-2 rounded-lg transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6366f1]/10 border border-[#6366f1]/20 mb-8">
              <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
              <span className="text-sm text-[#6366f1]">Now accepting crypto deposits</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight text-balance">
              The Future of Digital Payments
            </h1>
            <p className="mt-6 text-xl text-[#9ca3af] max-w-2xl mx-auto text-pretty">
              Send money globally, pay merchants, manage crypto — all in one secure wallet platform built for the modern economy.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="flex items-center gap-2 bg-transparent border border-[#222222] hover:border-[#6366f1] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg"
              >
                View Demo
              </Link>
            </div>
          </div>

          {/* Dashboard Preview */}
          <div className="mt-20 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent z-10 pointer-events-none" />
            <div className="bg-[#111111] border border-[#222222] rounded-2xl p-4 md:p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 rounded-full bg-[#ef4444]" />
                <div className="w-3 h-3 rounded-full bg-[#f59e0b]" />
                <div className="w-3 h-3 rounded-full bg-[#22c55e]" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { code: 'KZT', amount: '125,000.00' },
                  { code: 'USD', amount: '1,250.50' },
                  { code: 'EUR', amount: '980.00' },
                  { code: 'RUB', amount: '45,000.00' },
                ].map((wallet) => (
                  <div
                    key={wallet.code}
                    className="bg-[#1a1a1a] border border-[#222222] rounded-xl p-4"
                  >
                    <span className="text-sm font-medium text-[#9ca3af]">{wallet.code}</span>
                    <p className="text-xl font-bold text-white mt-2">{wallet.amount}</p>
                    <p className="text-xs text-[#9ca3af] mt-1">Available balance</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-6 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Everything you need in one platform
            </h2>
            <p className="mt-4 text-[#9ca3af] max-w-2xl mx-auto">
              Built with security, speed, and simplicity at its core.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="bg-[#1a1a1a] border border-[#222222] rounded-2xl p-8 hover:border-[#6366f1]/50 transition-colors group"
              >
                <div className="w-14 h-14 bg-[#6366f1]/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-[#6366f1]/20 transition-colors">
                  <feature.icon className="w-7 h-7 text-[#6366f1]" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-[#9ca3af] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Get started in 3 simple steps
            </h2>
            <p className="mt-4 text-[#9ca3af] max-w-2xl mx-auto">
              Start sending and receiving money in minutes, not days.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, index) => (
              <div key={step.title} className="relative">
                {index < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-[60%] w-full h-px bg-gradient-to-r from-[#6366f1] to-transparent" />
                )}
                <div className="bg-[#1a1a1a] border border-[#222222] rounded-2xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#6366f1] rounded-xl flex items-center justify-center">
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-4xl font-bold text-[#222222]">{step.step}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                  <p className="text-[#9ca3af] leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Currencies */}
      <section id="currencies" className="py-20 px-6 bg-[#111111]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white">
              Supported Currencies
            </h2>
            <p className="mt-4 text-[#9ca3af]">
              Send and receive money in multiple fiat and crypto currencies.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {CURRENCIES.map((currency) => (
              <div
                key={currency.code}
                className="bg-[#1a1a1a] border border-[#222222] rounded-xl px-6 py-4 hover:border-[#6366f1]/50 transition-colors"
              >
                <p className="text-white font-semibold">{currency.code}</p>
                <p className="text-xs text-[#9ca3af]">{currency.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="bg-[#1a1a1a] border border-[#222222] rounded-2xl p-6 text-center"
              >
                <stat.icon className="w-8 h-8 text-[#6366f1] mx-auto mb-4" />
                <p className="text-3xl md:text-4xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-[#9ca3af] mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 bg-[#111111]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white">
            Ready to get started?
          </h2>
          <p className="mt-4 text-[#9ca3af] text-lg">
            Join thousands of users who trust eWallet for their digital payments.
          </p>
          <Link
            to="/register"
            className="inline-flex items-center gap-2 bg-[#6366f1] hover:bg-[#5558e3] text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg mt-8"
          >
            Create Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#222222]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <span className="text-xl font-bold text-white">eWallet</span>
            <div className="flex items-center gap-8">
              <a href="#features" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                How it Works
              </a>
              <a href="#currencies" className="text-sm text-[#9ca3af] hover:text-white transition-colors">
                Pricing
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-[#9ca3af] hover:text-white transition-colors"
              >
                GitHub
              </a>
            </div>
            <p className="text-sm text-[#9ca3af]">
              eWallet &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
