'use client';

import { useEffect, useRef } from 'react';
import {
  doc,
  collection,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { UserProfile, RecurringExpense } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Period helpers                                                       */
/* ------------------------------------------------------------------ */

function toPeriod(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function parsePeriod(period: string): { year: number; monthIndex: number } {
  const [y, m] = period.split('-').map(Number);
  return { year: y, monthIndex: m - 1 };
}

function prevPeriod(year: number, month: number): string {
  if (month === 0) return toPeriod(year - 1, 11);
  return toPeriod(year, month - 1);
}

/** All 'YYYY-MM' periods strictly after `after`, up to and including `upTo`. */
function periodsAfter(after: string, upTo: string): string[] {
  const result: string[] = [];
  const { year: sy, monthIndex: sm } = parsePeriod(after);
  const { year: ey, monthIndex: em } = parsePeriod(upTo);

  let y = sy;
  let m = sm + 1;
  if (m > 11) { y += 1; m = 0; }

  while (y < ey || (y === ey && m <= em)) {
    result.push(toPeriod(y, m));
    m += 1;
    if (m > 11) { y += 1; m = 0; }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* useRecurring                                                         */
/* ------------------------------------------------------------------ */

export function useRecurring(
  profile: UserProfile | null,
  updateProfile: (data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) => Promise<void>,
): {
  recurring: RecurringExpense[];
  addRecurring: (item: Omit<RecurringExpense, 'id' | 'lastApplied' | 'active'>) => Promise<void>;
  updateRecurring: (id: string, patch: Partial<Omit<RecurringExpense, 'id'>>) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
} {
  const recurring = profile?.recurring ?? [];

  const addRecurring = async (
    item: Omit<RecurringExpense, 'id' | 'lastApplied' | 'active'>,
  ) => {
    const now = new Date();
    const year = now.getFullYear();
    const monthIndex = now.getMonth();
    const day = now.getDate();

    // If already past dayOfMonth this month, lastApplied = current month (fires next month).
    // Otherwise lastApplied = prev month (fires this month when day arrives).
    const lastApplied =
      day >= item.dayOfMonth
        ? toPeriod(year, monthIndex)
        : prevPeriod(year, monthIndex);

    const entry: RecurringExpense = {
      ...item,
      id: crypto.randomUUID(),
      active: true,
      lastApplied,
    };

    await updateProfile({ recurring: [...recurring, entry] });
  };

  const updateRecurring = async (id: string, patch: Partial<Omit<RecurringExpense, 'id'>>) => {
    await updateProfile({
      recurring: recurring.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    });
  };

  const removeRecurring = async (id: string) => {
    await updateProfile({ recurring: recurring.filter((r) => r.id !== id) });
  };

  return { recurring, addRecurring, updateRecurring, removeRecurring };
}

/* ------------------------------------------------------------------ */
/* useRecurringCatchUp                                                  */
/* ------------------------------------------------------------------ */

export function useRecurringCatchUp(
  profile: UserProfile | null,
  uid: string | null,
) {
  const { toast } = useToast();
  const ranRef = useRef<string | null>(null);

  useEffect(() => {
    if (!profile || !uid) return;

    // Guard: only run once per unique profile snapshot (keyed by recurring serialization).
    const key = uid + ':' + JSON.stringify(profile.recurring ?? []);
    if (ranRef.current === key) return;
    ranRef.current = key;

    const activeItems = (profile.recurring ?? []).filter((r) => r.active);
    if (activeItems.length === 0) return;

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthIndex = now.getMonth();
    const today = now.getDate();
    const currentPeriod = toPeriod(currentYear, currentMonthIndex);

    // Determine if any items are potentially due before hitting Firestore.
    const potentiallyDue = activeItems.some((item) => {
      const periods = periodsAfter(item.lastApplied, currentPeriod);
      return periods.some((p) => {
        if (p === currentPeriod) return today >= item.dayOfMonth;
        return true;
      });
    });

    if (!potentiallyDue) return;

    const db = getDb();
    const profileRef = doc(db, 'users', uid);
    const expensesCol = collection(db, 'users', uid, 'personalExpenses');

    runTransaction(db, async (tx) => {
      const freshSnap = await tx.get(profileRef);
      if (!freshSnap.exists()) return 0;

      const freshRecurring: RecurringExpense[] =
        (freshSnap.data().recurring as RecurringExpense[] | undefined) ?? [];

      const updatedRecurring = [...freshRecurring];
      let added = 0;

      for (let i = 0; i < updatedRecurring.length; i++) {
        const item = updatedRecurring[i];
        if (!item.active) continue;

        const periods = periodsAfter(item.lastApplied, currentPeriod).slice(0, 12);
        const duePeriods = periods.filter((p) => {
          if (p === currentPeriod) return today >= item.dayOfMonth;
          return true;
        });

        if (duePeriods.length === 0) continue;

        for (const period of duePeriods) {
          const { year, monthIndex } = parsePeriod(period);
          const expenseDate = new Date(year, monthIndex, item.dayOfMonth, 9, 0);
          const newDocRef = doc(expensesCol);
          tx.set(newDocRef, {
            description: item.description,
            category: item.category,
            amount: item.amount,
            paymentMethod: item.paymentMethod,
            notes: item.notes ?? '',
            tags: item.tags ?? [],
            date: Timestamp.fromDate(expenseDate),
            recurringId: item.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: uid,
          });
          added += 1;
        }

        updatedRecurring[i] = { ...item, lastApplied: currentPeriod };
      }

      if (added > 0) {
        tx.update(profileRef, { recurring: updatedRecurring });
      }

      return added;
    })
      .then((n) => {
        if (n && n > 0) {
          const noun = n === 1 ? 'entry' : 'entries';
          toast({
            title: `${n} recurring ${noun} added to your ledger`,
          });
        }
      })
      .catch(console.error);
  }, [profile, uid, toast]);
}
