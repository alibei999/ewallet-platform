import api from './axios';
import type { WalletBalance } from '@/types';

interface FundPayload {
  amount: number;
  currency: string;
}

interface DepositResponse {
  transaction_id: number;
  amount: number;
  currency: string;
  status: string;
  bank_reference: string;
}

interface WithdrawResponse {
  transaction_id: number;
  amount: number;
  currency: string;
  status: string;
  bank_reference: string;
}

export async function getBalance(): Promise<WalletBalance[]> {
  const { data } = await api.get<WalletBalance[]>('/wallet/balance');
  return data;
}

export async function deposit(payload: FundPayload): Promise<DepositResponse> {
  const { data } = await api.post<DepositResponse>('/wallet/deposit', payload);
  return data;
}

export async function withdraw(payload: FundPayload): Promise<WithdrawResponse> {
  const { data } = await api.post<WithdrawResponse>('/wallet/withdraw', payload);
  return data;
}
