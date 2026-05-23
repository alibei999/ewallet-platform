import api from './axios';
import type { Transaction } from '@/types';

interface TransferPayload {
  recipient_email: string;
  amount: number;
  currency: string;
  description?: string;
}

interface TransferResponse {
  transaction: Transaction;
  message: string;
}

export async function sendTransfer(
  payload: TransferPayload,
): Promise<TransferResponse> {
  const { data } = await api.post<TransferResponse>('/transfers', payload);
  return data;
}
