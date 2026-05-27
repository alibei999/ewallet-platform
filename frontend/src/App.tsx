import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { AppDataProvider } from '@/context/AppDataContext';
import { ToastProvider } from '@/context/ToastContext';
import { ActionModalProvider } from '@/context/ActionModalContext';
import ToastViewport from '@/components/ui/ToastViewport';
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleRoute from '@/components/RoleRoute';
import Layout from '@/components/Layout';

import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import Dashboard from '@/pages/Dashboard';
import Wallet from '@/pages/Wallet';
import Transfer from '@/pages/Transfer';
import Transactions from '@/pages/Transactions';
import TransactionDetail from '@/pages/TransactionDetail';
import Merchant from '@/pages/Merchant';
import Crypto from '@/pages/Crypto';
import Settings from '@/pages/Settings';
import InvoicePay from '@/pages/InvoicePay';
import AdminUsers from '@/pages/admin/Users';
import AdminKYC from '@/pages/admin/KYC';
import AdminTransactions from '@/pages/admin/Transactions';

function AppLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppDataProvider>
          <ToastProvider>
            <ActionModalProvider>
              <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected – regular users */}
          <Route path="/dashboard" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/wallet" element={<AppLayout><Wallet /></AppLayout>} />
          <Route path="/transfer" element={<AppLayout><Transfer /></AppLayout>} />
          <Route path="/deposit" element={<Navigate to="/wallet" replace />} />
          <Route path="/withdraw" element={<Navigate to="/wallet" replace />} />
          <Route path="/transactions" element={<AppLayout><Transactions /></AppLayout>} />
          <Route path="/transactions/:id" element={<AppLayout><TransactionDetail /></AppLayout>} />
          <Route path="/merchant" element={<AppLayout><Merchant /></AppLayout>} />
          <Route path="/crypto" element={<AppLayout><Crypto /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          <Route path="/invoices/:id/pay" element={<AppLayout><InvoicePay /></AppLayout>} />

          {/* Protected – admin only */}
          <Route
            path="/admin/users"
            element={
              <AppLayout>
                <RoleRoute role="admin"><AdminUsers /></RoleRoute>
              </AppLayout>
            }
          />
          <Route
            path="/admin/kyc"
            element={
              <AppLayout>
                <RoleRoute role="admin"><AdminKYC /></RoleRoute>
              </AppLayout>
            }
          />
          <Route
            path="/admin/transactions"
            element={
              <AppLayout>
                <RoleRoute role="admin"><AdminTransactions /></RoleRoute>
              </AppLayout>
            }
          />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
              </Routes>
              <ToastViewport />
            </ActionModalProvider>
          </ToastProvider>
        </AppDataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
