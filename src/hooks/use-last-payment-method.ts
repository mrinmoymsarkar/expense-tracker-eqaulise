'use client';

import { useState } from 'react';
import type { PaymentMethod } from '@/lib/types';

const STORAGE_KEY = 'equalize:lastPaymentMethod';

function readFromStorage(): PaymentMethod {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'Card' || stored === 'UPI' || stored === 'Cash') {
      return stored;
    }
  } catch {
    // localStorage unavailable (SSR or private browsing)
  }
  return 'UPI';
}

export function useLastPaymentMethod(): [PaymentMethod, (m: PaymentMethod) => void] {
  const [method, setMethod] = useState<PaymentMethod>(() => readFromStorage());

  const setAndPersist = (m: PaymentMethod) => {
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
    setMethod(m);
  };

  return [method, setAndPersist];
}
