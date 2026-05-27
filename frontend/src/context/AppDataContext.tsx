import { createContext, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Transaction, WalletBalance } from '@/types';

const FX_RATES: Record<string, number> = {
  USD: 1,
  EUR: 1.08,
  KZT: 0.0021,
  RUB: 0.011,
  GBP: 1.27,
};

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const INITIAL_BALANCES: WalletBalance[] = [
  { currency: 'USD', balance: 1250.5, locked_balance: 120 },
  { currency: 'EUR', balance: 980.0, locked_balance: 0 },
  { currency: 'KZT', balance: 125000, locked_balance: 0 },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 1001,
    type: 'deposit',
    status: 'completed',
    amount: 1200,
    fee: 0,
    currency: 'USD',
    description: 'Card top up',
    created_at: daysAgo(1),
  },
  {
    id: 1002,
    type: 'transfer_out',
    status: 'completed',
    amount: 220,
    fee: 1.1,
    currency: 'USD',
    description: 'Merchant payout',
    created_at: daysAgo(2),
  },
  {
    id: 1003,
    type: 'deposit',
    status: 'completed',
    amount: 12000,
    fee: 0,
    currency: 'KZT',
    description: 'Bank transfer',
    created_at: daysAgo(3),
  },
  {
    id: 1004,
    type: 'withdrawal',
    status: 'pending',
    amount: 450,
    fee: 2.25,
    currency: 'EUR',
    description: 'Withdrawal request',
    created_at: daysAgo(4),
  },
  {
    id: 1005,
    type: 'transfer_in',
    status: 'completed',
    amount: 85,
    fee: 0,
    currency: 'USD',
    description: 'Refund received',
    created_at: daysAgo(6),
  },
  {
    id: 1006,
    type: 'payment',
    status: 'completed',
    amount: 140,
    fee: 0,
    currency: 'USD',
    description: 'Card payment',
    created_at: daysAgo(7),
  },
  {
    id: 1007,
    type: 'transfer_out',
    status: 'completed',
    amount: 32,
    fee: 0.16,
    currency: 'USD',
    description: 'Coffee shop',
    created_at: daysAgo(8),
  },
  {
    id: 1008,
    type: 'deposit',
    status: 'completed',
    amount: 500,
    fee: 0,
    currency: 'EUR',
    description: 'Salary deposit',
    created_at: daysAgo(9),
  },
  {
    id: 1009,
    type: 'transfer_in',
    status: 'completed',
    amount: 25000,
    fee: 0,
    currency: 'KZT',
    description: 'Invoice #INV-1082 received',
    created_at: daysAgo(10),
  },
  {
    id: 1010,
    type: 'withdrawal',
    status: 'completed',
    amount: 200,
    fee: 2,
    currency: 'USD',
    description: 'ATM withdrawal',
    created_at: daysAgo(12),
  },
  {
    id: 1011,
    type: 'payment',
    status: 'completed',
    amount: 12000,
    fee: 0,
    currency: 'KZT',
    description: 'Online purchase',
    created_at: daysAgo(14),
  },
  {
    id: 1012,
    type: 'transfer_out',
    status: 'completed',
    amount: 150,
    fee: 0.75,
    currency: 'EUR',
    description: 'Freelance payment',
    created_at: daysAgo(15),
  },
  {
    id: 1013,
    type: 'deposit',
    status: 'completed',
    amount: 500,
    fee: 0,
    currency: 'USD',
    description: 'Stripe payout',
    created_at: daysAgo(18),
  },
  {
    id: 1014,
    type: 'transfer_in',
    status: 'completed',
    amount: 250,
    fee: 0,
    currency: 'EUR',
    description: 'Salary bonus',
    created_at: daysAgo(20),
  },
  {
    id: 1015,
    type: 'withdrawal',
    status: 'pending',
    amount: 50000,
    fee: 250,
    currency: 'KZT',
    description: 'Bank withdrawal',
    created_at: daysAgo(21),
  },
  {
    id: 1016,
    type: 'payment',
    status: 'completed',
    amount: 89,
    fee: 0,
    currency: 'USD',
    description: 'Subscription renewal',
    created_at: daysAgo(22),
  },
  {
    id: 1017,
    type: 'deposit',
    status: 'completed',
    amount: 75000,
    fee: 0,
    currency: 'KZT',
    description: 'Agent top-up',
    created_at: daysAgo(25),
  },
  {
    id: 1018,
    type: 'transfer_out',
    status: 'failed',
    amount: 450,
    fee: 2.25,
    currency: 'USD',
    description: 'Wire transfer',
    created_at: daysAgo(26),
  },
  {
    id: 1019,
    type: 'refund',
    status: 'completed',
    amount: 35,
    fee: 0,
    currency: 'EUR',
    description: 'Merchant refund',
    created_at: daysAgo(28),
  },
  {
    id: 1020,
    type: 'deposit',
    status: 'completed',
    amount: 1000,
    fee: 15,
    currency: 'USD',
    description: 'Card funding',
    created_at: daysAgo(30),
  },
];

interface AddTransactionInput {
  type: Transaction['type'];
  status: Transaction['status'];
  amount: number;
  fee?: number;
  currency: string;
  description?: string;
}

interface AppDataContextValue {
  balances: WalletBalance[];
  transactions: Transaction[];
  addCurrency: (currency: string) => void;
  addTransaction: (input: AddTransactionInput) => Transaction;
  addDeposit: (currency: string, amount: number, fee?: number, description?: string) => Transaction;
  addWithdrawal: (currency: string, amount: number, fee?: number, description?: string) => Transaction;
  addTransfer: (currency: string, amount: number, fee?: number, description?: string) => Transaction;
  updateBalance: (currency: string, delta: number) => void;
  totalBalanceUsd: number;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [balances, setBalances] = useState<WalletBalance[]>(INITIAL_BALANCES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const nextId = useRef(INITIAL_TRANSACTIONS.length ? Math.max(...INITIAL_TRANSACTIONS.map((t) => t.id)) + 1 : 1);

  function addCurrency(currency: string) {
    setBalances((prev) => {
      if (prev.some((b) => b.currency === currency)) return prev;
      return [...prev, { currency, balance: 0, locked_balance: 0 }];
    });
  }

  function updateBalance(currency: string, delta: number) {
    setBalances((prev) => {
      const existing = prev.find((b) => b.currency === currency);
      if (!existing) {
        return [...prev, { currency, balance: Math.max(0, delta), locked_balance: 0 }];
      }
      return prev.map((b) => (
        b.currency === currency
          ? { ...b, balance: Math.max(0, b.balance + delta) }
          : b
      ));
    });
  }

  function addTransaction(input: AddTransactionInput) {
    const transaction: Transaction = {
      id: nextId.current++,
      type: input.type,
      status: input.status,
      amount: input.amount,
      fee: input.fee ?? 0,
      currency: input.currency,
      description: input.description ?? '',
      created_at: new Date().toISOString(),
    };
    setTransactions((prev) => [transaction, ...prev]);
    return transaction;
  }

  function addDeposit(currency: string, amount: number, fee = 0, description = 'Deposit') {
    updateBalance(currency, amount);
    return addTransaction({ type: 'deposit', status: 'completed', amount, fee, currency, description });
  }

  function addWithdrawal(currency: string, amount: number, fee = 0, description = 'Withdrawal') {
    updateBalance(currency, -amount);
    return addTransaction({ type: 'withdrawal', status: 'pending', amount, fee, currency, description });
  }

  function addTransfer(currency: string, amount: number, fee = 0, description = 'Transfer sent') {
    updateBalance(currency, -(amount + fee));
    return addTransaction({ type: 'transfer_out', status: 'completed', amount, fee, currency, description });
  }

  const totalBalanceUsd = useMemo(
    () => balances.reduce((sum, b) => sum + b.balance * (FX_RATES[b.currency] ?? 1), 0),
    [balances],
  );

  return (
    <AppDataContext.Provider
      value={{
        balances,
        transactions,
        addCurrency,
        addTransaction,
        addDeposit,
        addWithdrawal,
        addTransfer,
        updateBalance,
        totalBalanceUsd,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used within AppDataProvider');
  return ctx;
}
