'use client';

import { useMemo } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useGroupExpenses } from './use-group-expenses';
import { useSettlements } from './use-settlements';
import {
  computeNetBalances,
  simplifyDebts,
  getUserBalance,
} from '@/lib/balances';
import type { Group, MemberBalance, SettlementTransaction } from '@/lib/types';

export function useGroupBalances(group: Group | null): {
  memberBalances: MemberBalance[];
  settlementPlan: SettlementTransaction[];
  youOwe: number;
  youAreOwed: number;
  loading: boolean;
} {
  const { user } = useAuth();
  const { expenses, loading: expLoading } = useGroupExpenses(group?.id ?? null);
  const { settlements, loading: settleLoading } = useSettlements(group?.id ?? null);

  const memberBalances = useMemo((): MemberBalance[] => {
    if (!group) return [];
    const netBalances = computeNetBalances(expenses, settlements, group.memberUids);
    return group.memberUids.map((uid) => ({
      uid,
      displayName: group.members[uid]?.displayName ?? uid,
      netAmount: netBalances[uid] ?? 0,
    }));
  }, [group, expenses, settlements]);

  const settlementPlan = useMemo((): SettlementTransaction[] => {
    if (!group) return [];
    const netBalances = computeNetBalances(expenses, settlements, group.memberUids);
    return simplifyDebts(netBalances);
  }, [group, expenses, settlements]);

  const { youOwe, youAreOwed } = useMemo(() => {
    if (!user || !group) return { youOwe: 0, youAreOwed: 0 };
    const netBalances = computeNetBalances(expenses, settlements, group.memberUids);
    return getUserBalance(user.uid, netBalances, settlementPlan);
  }, [user, group, expenses, settlements, settlementPlan]);

  return {
    memberBalances,
    settlementPlan,
    youOwe,
    youAreOwed,
    loading: expLoading || settleLoading,
  };
}
