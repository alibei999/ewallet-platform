import api from './axios';
import type { WalletBalance } from '@/types';

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

interface WalletBalanceDto {
  currency: string;
  balance: number | string;
  frozen_amount: number | string;
}

interface WalletDto {
  id: string;
  user_id: string;
  is_active: boolean;
  balances: WalletBalanceDto[];
}

interface TransactionDto {
  id: string;
  type: string;
  status: string;
  amount: number | string;
  fee?: number | string;
  currency: string;
  description?: string;
  created_at?: string;
}

export interface FundPayload {
  amount: number;
  currency: string;
  card_number?: string;
  description?: string;
}

export interface FundResult {
  transaction_id: string;
  amount: number;
  currency: string;
  status: string;
}

function mapBalances(wallet: WalletDto | undefined): WalletBalance[] {
  if (!wallet?.balances?.length) return [];
  return wallet.balances.map((b) => ({
    currency: b.currency,
    balance: Number(b.balance),
    locked_balance: Number(b.frozen_amount),
  }));
}

function mapTransaction(tx: TransactionDto): FundResult {
  return {
    transaction_id: tx.id,
    amount: Number(tx.amount),
    currency: tx.currency,
    status: tx.status,
  };
}

export async function createWallet(): Promise<WalletBalance[]> {
  const { data } = await api.post<ApiEnvelope<WalletDto>>('/wallet/create');
  return mapBalances(data.data);
}

export async function getBalance(): Promise<WalletBalance[]> {
  const { data } = await api.get<ApiEnvelope<WalletDto>>('/wallet/balance');
  return mapBalances(data.data);
}

export async function deposit(payload: FundPayload): Promise<FundResult> {
  const { data } = await api.post<ApiEnvelope<TransactionDto>>('/wallet/deposit', {
    amount: payload.amount,
    currency: payload.currency,
    card_number: payload.card_number?.trim() || '4242424242424242',
  });
  return mapTransaction(data.data);
}

export async function withdraw(payload: FundPayload): Promise<FundResult> {
  const { data } = await api.post<ApiEnvelope<TransactionDto>>('/wallet/withdraw', {
    amount: payload.amount,
    currency: payload.currency,
    card_number: payload.card_number?.trim() || '4242424242424242',
    description: payload.description,
  });
  return mapTransaction(data.data);
}
