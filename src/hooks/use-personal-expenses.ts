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
} from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { getDb } from '@/lib/firebase';
import type { PersonalExpense, ExpenseFormValues } from '@/lib/types';

export function usePersonalExpenses(): {
  expenses: PersonalExpense[];
  loading: boolean;
  addExpense: (v: ExpenseFormValues) => Promise<void>;
  updateExpense: (id: string, v: ExpenseFormValues) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
} {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    const db = getDb();
    const ref = collection(db, 'users', user.uid, 'personalExpenses');
    const q = query(ref, orderBy('date', 'desc'));

    const unsub = onSnapshot(q, (snap) => {
      setExpenses(snap.docs.map((d) => ({ id: d.id, ...d.data() } as PersonalExpense)));
      setLoading(false);
    });

    return unsub;
  }, [user]);

  // Firestore offline persistence: onSnapshot reflects writes from local cache
  // immediately; awaiting server ACK hangs the UI, so fire and forget.
  const addExpense = async (v: ExpenseFormValues) => {
    if (!user) throw new Error('Not authenticated');
    const db = getDb();
    const ref = collection(db, 'users', user.uid, 'personalExpenses');
    addDoc(ref, {
      description: v.description,
      category: v.category,
      amount: v.amount,
      date: Timestamp.fromDate(v.date),
      paymentMethod: v.paymentMethod,
      notes: v.notes ?? '',
      tags: v.tags ?? [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: user.uid,
    }).catch(console.error);
  };

  const updateExpense = async (id: string, v: ExpenseFormValues) => {
    if (!user) throw new Error('Not authenticated');
    const db = getDb();
    const ref = doc(db, 'users', user.uid, 'personalExpenses', id);
    updateDoc(ref, {
      description: v.description,
      category: v.category,
      amount: v.amount,
      date: Timestamp.fromDate(v.date),
      paymentMethod: v.paymentMethod,
      notes: v.notes ?? '',
      tags: v.tags ?? [],
      updatedAt: serverTimestamp(),
    }).catch(console.error);
  };

  const deleteExpense = async (id: string) => {
    if (!user) throw new Error('Not authenticated');
    const db = getDb();
    deleteDoc(doc(db, 'users', user.uid, 'personalExpenses', id)).catch(console.error);
  };

  return { expenses, loading, addExpense, updateExpense, deleteExpense };
}
