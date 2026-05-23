export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
}

export interface WalletBalance {
  currency: string;
  balance: number;
  locked_balance: number;
}

export interface Transaction {
  id: number;
  type:
    | 'deposit'
    | 'withdrawal'
    | 'transfer_in'
    | 'transfer_out'
    | 'payment'
    | 'refund';
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  fee: number;
  currency: string;
  description: string;
  created_at: string;
}

export interface KYCStatus {
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  full_name?: string;
  created_at?: string;
}

export interface Merchant {
  id: number;
  business_name: string;
  api_key: string;
  webhook_url: string;
  is_active: boolean;
}

export interface Invoice {
  id: number;
  order_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  description: string;
  expires_at: string;
  paid_at?: string;
  created_at: string;
}

export interface WebhookLog {
  id: number;
  invoice_id: number;
  event: string;
  payload: Record<string, unknown>;
  status_code: number;
  delivered_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionFilters {
  type?: Transaction['type'];
  status?: Transaction['status'];
  currency?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  limit?: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
