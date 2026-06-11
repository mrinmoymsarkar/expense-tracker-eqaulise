'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { getDb } from '@/lib/firebase';
import {
  computeNetBalances,
  simplifyDebts,
  getUserBalance,
} from '@/lib/balances';
import type { Group, GroupExpense, Settlement } from '@/lib/types';

interface GroupSnapshot {
  expenses: GroupExpense[];
  settlements: Settlement[];
}

export type GroupExpenseWithGroup = GroupExpense & { groupId: string; groupName: string };

export function useDashboardSummary(groups: Group[]): {
  youOweTotal: number;
  youAreOwedTotal: number;
  activeGroupCount: number;
  allGroupExpenses: GroupExpenseWithGroup[];
  loading: boolean;
} {
  const { user } = useAuth();
  const [snapshots, setSnapshots] = useState<Map<string, GroupSnapshot>>(new Map());
  const [loading, setLoading] = useState(true);

  // Key the effect on the id set, not array identity — group doc updates
  // (e.g. totalExpenses increments) produce new arrays every snapshot and
  // would otherwise tear down and recreate every listener.
  const groupIdsKey = groups.map((g) => g.id).sort().join(',');

  useEffect(() => {
    if (!user || !groupIdsKey) {
      setSnapshots(new Map());
      setLoading(false);
      return;
    }

    const groupIds = groupIdsKey.split(',');
    const db = getDb();
    const unsubscribers: (() => void)[] = [];
    const pending = new Set<string>(groupIds);

    for (const groupId of groupIds) {
      const expRef = collection(db, 'groups', groupId, 'expenses');
      const expQ = query(expRef, orderBy('date', 'desc'));

      const unsubExp = onSnapshot(expQ, (snap) => {
        const expenses = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GroupExpense));
        setSnapshots((prev) => {
          const next = new Map(prev);
          const existing = next.get(groupId) ?? { expenses: [], settlements: [] };
          next.set(groupId, { ...existing, expenses });
          return next;
        });
        pending.delete(groupId);
        if (pending.size === 0) setLoading(false);
      });

      const settleRef = collection(db, 'groups', groupId, 'settlements');
      const settleQ = query(settleRef, orderBy('date', 'desc'));

      const unsubSettle = onSnapshot(settleQ, (snap) => {
        const settlements = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Settlement));
        setSnapshots((prev) => {
          const next = new Map(prev);
          const existing = next.get(groupId) ?? { expenses: [], settlements: [] };
          next.set(groupId, { ...existing, settlements });
          return next;
        });
      });

      unsubscribers.push(unsubExp, unsubSettle);
    }

    return () => {
      for (const unsub of unsubscribers) unsub();
    };
  }, [user, groupIdsKey]);

  const allGroupExpenses = useMemo<GroupExpenseWithGroup[]>(() => {
    const nameById = new Map(groups.map((g) => [g.id, g.name]));
    const all: GroupExpenseWithGroup[] = [];
    snapshots.forEach((snap, groupId) => {
      for (const e of snap.expenses) {
        all.push({ ...e, groupId, groupName: nameById.get(groupId) ?? '' });
      }
    });
    all.sort((a, b) => b.date.toMillis() - a.date.toMillis());
    return all;
  }, [snapshots, groups]);

  let youOweTotal = 0;
  let youAreOwedTotal = 0;
  let activeGroupCount = 0;

  if (user) {
    for (const group of groups) {
      const snap = snapshots.get(group.id);
      if (!snap) continue;

      const netBalances = computeNetBalances(snap.expenses, snap.settlements, group.memberUids);
      const plan = simplifyDebts(netBalances);
      const { youOwe, youAreOwed } = getUserBalance(user.uid, netBalances, plan);

      if (youOwe > 0 || youAreOwed > 0) {
        activeGroupCount++;
        youOweTotal += youOwe;
        youAreOwedTotal += youAreOwed;
      }
    }
  }

  return {
    youOweTotal: Math.round(youOweTotal * 100) / 100,
    youAreOwedTotal: Math.round(youAreOwedTotal * 100) / 100,
    activeGroupCount,
    allGroupExpenses,
    loading,
  };
}
