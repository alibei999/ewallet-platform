import { createContext, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import Dialog from '@/components/ui/Dialog';
import Drawer from '@/components/ui/Drawer';
import useMediaQuery from '@/lib/useMediaQuery';
import FundModal from '@/components/modals/FundModal';
import TransferModal from '@/components/modals/TransferModal';
import AddCurrencyModal from '@/components/modals/AddCurrencyModal';

export type ActionModalType = 'deposit' | 'withdraw' | 'transfer' | 'add-currency' | null;

interface ActionModalState {
  type: ActionModalType;
  currency?: string;
}

interface ActionModalContextValue {
  openDeposit: (currency?: string) => void;
  openWithdraw: (currency?: string) => void;
  openTransfer: (currency?: string) => void;
  openAddCurrency: () => void;
  close: () => void;
}

const ActionModalContext = createContext<ActionModalContextValue | null>(null);

export function ActionModalProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ActionModalState>({ type: null });
  const isMobile = useMediaQuery('(max-width: 640px)');
  const Wrapper = isMobile ? Drawer : Dialog;

  function close() {
    setState({ type: null });
  }

  const value = useMemo(
    () => ({
      openDeposit: (currency?: string) => setState({ type: 'deposit', currency }),
      openWithdraw: (currency?: string) => setState({ type: 'withdraw', currency }),
      openTransfer: (currency?: string) => setState({ type: 'transfer', currency }),
      openAddCurrency: () => setState({ type: 'add-currency' }),
      close,
    }),
    [],
  );

  return (
    <ActionModalContext.Provider value={value}>
      {children}
      <Wrapper open={state.type === 'deposit'} onOpenChange={(open) => !open && close()}>
        <FundModal mode="deposit" initialCurrency={state.currency} onClose={close} />
      </Wrapper>
      <Wrapper open={state.type === 'withdraw'} onOpenChange={(open) => !open && close()}>
        <FundModal mode="withdraw" initialCurrency={state.currency} onClose={close} />
      </Wrapper>
      <Wrapper open={state.type === 'transfer'} onOpenChange={(open) => !open && close()}>
        <TransferModal initialCurrency={state.currency} onClose={close} />
      </Wrapper>
      <Wrapper open={state.type === 'add-currency'} onOpenChange={(open) => !open && close()}>
        <AddCurrencyModal onClose={close} />
      </Wrapper>
    </ActionModalContext.Provider>
  );
}

export function useActionModals(): ActionModalContextValue {
  const ctx = useContext(ActionModalContext);
  if (!ctx) throw new Error('useActionModals must be used within ActionModalProvider');
  return ctx;
}
