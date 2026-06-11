import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import type { ExpenseFormValues } from '@/lib/types';

// Standalone group-expense write for callers (e.g. AddExpenseSheet) that pick
// the target group at submit time and can't use the groupId-bound hook.
export async function addGroupExpense(
  groupId: string,
  uid: string,
  v: ExpenseFormValues
): Promise<void> {
  const db = getDb();
  await addDoc(collection(db, 'groups', groupId, 'expenses'), {
    description: v.description,
    category: v.category,
    amount: v.amount,
    date: Timestamp.fromDate(v.date),
    paymentMethod: v.paymentMethod,
    notes: v.notes ?? '',
    paidBy: v.paidBy ?? uid,
    splitMethod: v.splitMethod ?? 'equal',
    splits: v.splits ?? {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
  });
  await updateDoc(doc(db, 'groups', groupId), {
    totalExpenses: increment(v.amount),
    updatedAt: serverTimestamp(),
  });
}

export async function updateGroupExpense(
  groupId: string,
  expenseId: string,
  uid: string,
  v: ExpenseFormValues
): Promise<void> {
  const db = getDb();
  const expRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  const existing = await getDoc(expRef);
  const oldAmount: number = existing.exists() ? (existing.data().amount ?? 0) : 0;

  await updateDoc(expRef, {
    description: v.description,
    category: v.category,
    amount: v.amount,
    date: Timestamp.fromDate(v.date),
    paymentMethod: v.paymentMethod,
    notes: v.notes ?? '',
    paidBy: v.paidBy ?? uid,
    splitMethod: v.splitMethod ?? 'equal',
    splits: v.splits ?? {},
    updatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'groups', groupId), {
    totalExpenses: increment(v.amount - oldAmount),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGroupExpense(
  groupId: string,
  expenseId: string
): Promise<void> {
  const db = getDb();
  const expRef = doc(db, 'groups', groupId, 'expenses', expenseId);
  const existing = await getDoc(expRef);
  const amount: number = existing.exists() ? (existing.data().amount ?? 0) : 0;

  await deleteDoc(expRef);
  await updateDoc(doc(db, 'groups', groupId), {
    totalExpenses: increment(-amount),
    updatedAt: serverTimestamp(),
  });
}
