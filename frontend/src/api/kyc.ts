import api from './axios';
import type { KYCStatus } from '@/types';

interface KYCPayload {
  full_name: string;
  date_of_birth: string;
  address: string;
  id_number: string;
  id_type: 'passport' | 'national_id' | 'drivers_license';
}

export async function submit(payload: KYCPayload): Promise<KYCStatus> {
  const { data } = await api.post<KYCStatus>('/kyc/submit', payload);
  return data;
}

export async function getStatus(): Promise<KYCStatus> {
  const { data } = await api.get<KYCStatus>('/kyc/status');
  return data;
}
