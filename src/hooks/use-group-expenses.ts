'use client';

import { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  increment,
  getDoc,
} from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { getDb } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { GroupExpense, ExpenseFormValues } from '@/lib/types';

export function useGroupExpenses(groupId: string | null): {
  expenses: GroupExpense[];
  loading: boolean;
  addExpense: (v: ExpenseFormValues) => Promise<void>;
  updateExpense: (id: string, v: ExpenseFormValues) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
} {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<GroupExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !groupId) {
      setExpenses([]);
      setLoading(!groupId ? false : true);
      return;
    }

    const db = getDb();
    const ref = collection(db, 'groups', groupId, 'expenses');

    let unsub: (() => void) | undefined;

    const attach = (withOrder: boolean) => {
      const q = withOrder ? query(ref, orderBy('date', 'desc')) : query(ref);
      unsub = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snap) => {
          let docs = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
            pending: d.metadata.hasPendingWrites,
          } as GroupExpense));
          if (!withOrder) {
            docs = docs.sort((a, b) => {
              const aMs = a.date?.toMillis?.() ?? 0;
              const bMs = b.date?.toMillis?.() ?? 0;
              return bMs - aMs;
            });
          }
          setExpenses(docs);
          setLoading(false);
        },
        (err) => {
          if (withOrder) {
            // Composite index missing: fall back to client-side sort
            attach(false);
          } else {
            console.error(err);
            setLoading(false);
          }
        }
      );
    };

    attach(true);
    return () => unsub?.();
  }, [user, groupId]);

  // Firestore offline persistence: onSnapshot reflects writes from local cache
  // immediately; awaiting server ACK hangs the UI, so fire and forget.
  const addExpense = async (v: ExpenseFormValues) => {
    if (!user || !groupId) throw new Error('Not authenticated or no group');
    const db = getDb();
    const ref = collection(db, 'groups', groupId, 'expenses');
    addDoc(ref, {
      description: v.description,
      category: v.category,
      amount: v.amount,
      date: Timestamp.fromDate(v.date),
      paymentMethod: v.paymentMethod,
      notes: v.notes ?? '',
      tags: v.tags ?? [],
      paidBy: v.paidBy ?? user.uid,
      splitMethod: v.splitMethod ?? 'equal',
      splits: v.splits ?? {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
    }).catch((e) => toast({ variant: 'destructive', title: 'Save failed', description: e instanceof Error ? e.message : 'Could not save to server' }));
    updateDoc(doc(db, 'groups', groupId), {
      totalExpenses: increment(v.amount),
      updatedAt: serverTimestamp(),
    }).catch((e) => toast({ variant: 'destructive', title: 'Save failed', description: e instanceof Error ? e.message : 'Could not save to server' }));
  };

  const updateExpense = async (id: string, v: ExpenseFormValues) => {
    if (!user || !groupId) throw new Error('Not authenticated or no group');
    const db = getDb();
    const expRef = doc(db, 'groups', groupId, 'expenses', id);
    const existing = await getDoc(expRef);
    const oldAmount: number = existing.exists() ? (existing.data().amount ?? 0) : 0;

    updateDoc(expRef, {
      description: v.description,
      category: v.category,
      amount: v.amount,
      date: Timestamp.fromDate(v.date),
      paymentMethod: v.paymentMethod,
      notes: v.notes ?? '',
      tags: v.tags ?? [],
      paidBy: v.paidBy ?? user.uid,
      splitMethod: v.splitMethod ?? 'equal',
      splits: v.splits ?? {},
      updatedAt: serverTimestamp(),
    }).catch((e) => toast({ variant: 'destructive', title: 'Save failed', description: e instanceof Error ? e.message : 'Could not save to server' }));

    updateDoc(doc(db, 'groups', groupId), {
      totalExpenses: increment(v.amount - oldAmount),
      updatedAt: serverTimestamp(),
    }).catch((e) => toast({ variant: 'destructive', title: 'Save failed', description: e instanceof Error ? e.message : 'Could not save to server' }));
  };

  const deleteExpense = async (id: string) => {
    if (!user || !groupId) throw new Error('Not authenticated or no group');
    const db = getDb();
    const expRef = doc(db, 'groups', groupId, 'expenses', id);
    const existing = await getDoc(expRef);
    const amount: number = existing.exists() ? (existing.data().amount ?? 0) : 0;

    deleteDoc(expRef).catch((e) => toast({ variant: 'destructive', title: 'Save failed', description: e instanceof Error ? e.message : 'Could not save to server' }));
    updateDoc(doc(db, 'groups', groupId), {
      totalExpenses: increment(-amount),
      updatedAt: serverTimestamp(),
    }).catch((e) => toast({ variant: 'destructive', title: 'Save failed', description: e instanceof Error ? e.message : 'Could not save to server' }));
  };

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
