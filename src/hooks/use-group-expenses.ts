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
import type { GroupExpense, ExpenseFormValues } from '@/lib/types';

export function useGroupExpenses(groupId: string | null): {
  expenses: GroupExpense[];
  loading: boolean;
  addExpense: (v: ExpenseFormValues) => Promise<void>;
  updateExpense: (id: string, v: ExpenseFormValues) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
} {
  const { user } = useAuth();
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
    const q = query(ref, orderBy('date', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupExpense)));
      setLoading(false);
    });

    return unsub;
  }, [user, groupId]);

  const addExpense = async (v: ExpenseFormValues) => {
    if (!user || !groupId) throw new Error('Not authenticated or no group');
    const db = getDb();
    const ref = collection(db, 'groups', groupId, 'expenses');
    await addDoc(ref, {
      description: v.description,
      category: v.category,
      amount: v.amount,
      date: Timestamp.fromDate(v.date),
      paymentMethod: v.paymentMethod,
      notes: v.notes ?? '',
      paidBy: v.paidBy ?? user.uid,
      splitMethod: v.splitMethod ?? 'equal',
      splits: v.splits ?? {},
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
    });
    await updateDoc(doc(db, 'groups', groupId), {
      totalExpenses: increment(v.amount),
      updatedAt: serverTimestamp(),
    });
  };

  const updateExpense = async (id: string, v: ExpenseFormValues) => {
    if (!user || !groupId) throw new Error('Not authenticated or no group');
    const db = getDb();
    const expRef = doc(db, 'groups', groupId, 'expenses', id);
    const existing = await getDoc(expRef);
    const oldAmount: number = existing.exists() ? (existing.data().amount ?? 0) : 0;

    await updateDoc(expRef, {
      description: v.description,
      category: v.category,
      amount: v.amount,
      date: Timestamp.fromDate(v.date),
      paymentMethod: v.paymentMethod,
      notes: v.notes ?? '',
      paidBy: v.paidBy ?? user.uid,
      splitMethod: v.splitMethod ?? 'equal',
      splits: v.splits ?? {},
      updatedAt: serverTimestamp(),
    });

    const delta = v.amount - oldAmount;
    await updateDoc(doc(db, 'groups', groupId), {
      totalExpenses: increment(delta),
      updatedAt: serverTimestamp(),
    });
  };

  const deleteExpense = async (id: string) => {
    if (!user || !groupId) throw new Error('Not authenticated or no group');
    const db = getDb();
    const expRef = doc(db, 'groups', groupId, 'expenses', id);
    const existing = await getDoc(expRef);
    const amount: number = existing.exists() ? (existing.data().amount ?? 0) : 0;

    await deleteDoc(expRef);
    await updateDoc(doc(db, 'groups', groupId), {
      totalExpenses: increment(-amount),
      updatedAt: serverTimestamp(),
    });
  };

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
