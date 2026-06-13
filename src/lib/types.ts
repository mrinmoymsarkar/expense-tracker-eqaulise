import type { Timestamp } from 'firebase/firestore';

export type SplitMethod = 'equal' | 'exact' | 'percentage';
export type SplitMap = Record<string, number>;
export type PaymentMethod = 'Card' | 'UPI' | 'Cash';
export type Category = 'Food' | 'Shopping' | 'Transport' | 'Housing' | 'Entertainment' | 'Health' | 'Travel' | (string & {});

export interface RecurringExpense {
  id: string;
  description: string;
  amount: number;
  category: Category;
  paymentMethod: PaymentMethod;
  dayOfMonth: number; // 1-28
  notes?: string;
  tags?: string[];
  active: boolean;
  lastApplied: string; // 'YYYY-MM' period most recently materialized
}

export interface PersonalExpense {
  id: string;
  description: string;
  category: Category;
  amount: number;
  date: Timestamp;
  paymentMethod: PaymentMethod;
  notes: string;
  tags?: string[];
  recurringId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
}

export interface GroupExpense extends PersonalExpense {
  paidBy: string;
  splitMethod: SplitMethod;
  splits: SplitMap;
}

export type AnyExpense =
  | (PersonalExpense & { type: 'personal'; groupId: null })
  | (GroupExpense & { type: 'group'; groupId: string; groupName: string });

export interface GroupMemberInfo {
  displayName: string;
  photoURL: string | null;
  email: string;
  upiId?: string;
}

export interface Group {
  id: string;
  name: string;
  imageUrl: string;
  imageHint: string;
  createdBy: string;
  memberUids: string[];
  members: Record<string, GroupMemberInfo>;
  inviteCode: string;
  totalExpenses: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type SettlementMethod = 'Cash' | 'UPI';

export interface Settlement {
  id: string;
  fromUid: string;
  toUid: string;
  amount: number;
  method: SettlementMethod;
  note: string;
  date: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
}

export type Currency = 'INR' | 'USD' | 'EUR';
export type DateFormat = 'dd-MM-yyyy' | 'MM-dd-yyyy' | 'yyyy-MM-dd';
export type Language = 'en' | 'hi';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  upiId?: string;
  currency: Currency;
  dateFormat: DateFormat;
  language: Language;
  createdAt: Timestamp;
  budgets?: Record<string, number>;
  recurring?: RecurringExpense[];
  categories?: Array<{ value: string; label: string; icon: string; chartColor: string }>;
}

export interface MemberBalance {
  uid: string;
  displayName: string;
  netAmount: number;
}

export interface SettlementTransaction {
  fromUid: string;
  toUid: string;
  amount: number;
}

export interface ExpenseFormValues {
  description: string;
  amount: number;
  category: Category;
  paymentMethod: PaymentMethod;
  date: Date;
  notes: string;
  tags?: string[];
  groupId: string | null;
  splitMethod: SplitMethod;
  splits: SplitMap;
  paidBy?: string;
}
