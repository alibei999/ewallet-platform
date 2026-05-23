import api from './axios';
import type { Merchant, Invoice, WebhookLog, PaginatedResponse } from '@/types';

interface RegisterMerchantPayload {
  business_name: string;
  webhook_url: string;
}

interface CreateInvoicePayload {
  order_id: string;
  amount: number;
  currency: string;
  description: string;
  expires_in_minutes?: number;
}

export async function registerMerchant(
  payload: RegisterMerchantPayload,
): Promise<Merchant> {
  const { data } = await api.post<Merchant>('/merchant/register', payload);
  return data;
}

export async function getMerchantInfo(): Promise<Merchant> {
  const { data } = await api.get<Merchant>('/merchant/me');
  return data;
}

export async function getInvoices(params?: {
  page?: number;
  limit?: number;
  status?: Invoice['status'];
}): Promise<PaginatedResponse<Invoice>> {
  const { data } = await api.get<PaginatedResponse<Invoice>>(
    '/merchant/invoices',
    { params },
  );
  return data;
}

export async function createInvoice(
  payload: CreateInvoicePayload,
): Promise<Invoice> {
  const { data } = await api.post<Invoice>('/merchant/invoices', payload);
  return data;
}

export async function getWebhookLogs(params?: {
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<WebhookLog>> {
  const { data } = await api.get<PaginatedResponse<WebhookLog>>(
    '/merchant/webhooks',
    { params },
  );
  return data;
}
