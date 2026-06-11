'use client';

import React, { createContext, useContext } from 'react';
import { useGroups } from '@/hooks/use-groups';
import { usePersonalExpenses } from '@/hooks/use-personal-expenses';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import type { Group, PersonalExpense, UserProfile, ExpenseFormValues } from '@/lib/types';

interface DataContextValue {
  groups: Group[];
  groupsLoading: boolean;
  createGroup: (data: { name: string }) => Promise<string>;
  joinGroupByCode: (code: string) => Promise<void>;
  personalExpenses: PersonalExpense[];
  personalLoading: boolean;
  addPersonalExpense: (v: ExpenseFormValues) => Promise<void>;
  updatePersonalExpense: (id: string, v: ExpenseFormValues) => Promise<void>;
  deletePersonalExpense: (id: string) => Promise<void>;
  profile: UserProfile | null;
  profileLoading: boolean;
  updateProfile: (data: Partial<Omit<UserProfile, 'uid' | 'createdAt'>>) => Promise<void>;
  summary: ReturnType<typeof useDashboardSummary>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const {
    groups,
    loading: groupsLoading,
    createGroup,
    joinGroupByCode,
  } = useGroups();

  const {
    expenses: personalExpenses,
    loading: personalLoading,
    addExpense: addPersonalExpense,
    updateExpense: updatePersonalExpense,
    deleteExpense: deletePersonalExpense,
  } = usePersonalExpenses();

  const {
    profile,
    loading: profileLoading,
    updateProfile,
  } = useUserProfile();

  const summary = useDashboardSummary(groups);

  return (
    <DataContext.Provider
      value={{
        groups,
        groupsLoading,
        createGroup,
        joinGroupByCode,
        personalExpenses,
        personalLoading,
        addPersonalExpense,
        updatePersonalExpense,
        deletePersonalExpense,
        profile,
        profileLoading,
        updateProfile,
        summary,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useData must be used within a DataProvider');
  }
  return ctx;
}
