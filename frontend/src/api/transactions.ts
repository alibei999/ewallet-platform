import api from './axios';
import type { Transaction, PaginatedResponse, TransactionFilters } from '@/types';

export async function getAll(
  filters?: TransactionFilters,
): Promise<PaginatedResponse<Transaction>> {
  const { data } = await api.get<PaginatedResponse<Transaction>>(
    '/transactions',
    { params: filters },
  );
  return data;
}

export async function getById(id: number): Promise<Transaction> {
  const { data } = await api.get<Transaction>(`/transactions/${id}`);
  return data;
}
