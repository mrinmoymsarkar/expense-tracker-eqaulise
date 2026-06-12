import { z } from 'zod';

export const expenseFormSchema = z.object({
  description: z.string().min(1),
  amount: z.coerce.number().positive(),
  category: z.string().min(1),
  paymentMethod: z.enum(['Card', 'UPI', 'Cash']),
  date: z.date(),
  notes: z.string().optional().default(''),
  tags: z.array(z.string()).optional().default([]),
  groupId: z.string().nullable().optional(),
  splitMethod: z.enum(['equal', 'exact', 'percentage']).optional().default('equal'),
  splits: z.record(z.number()).optional().default({}),
  paidBy: z.string().optional(),
});

export type ExpenseFormSchema = z.infer<typeof expenseFormSchema>;

export const createGroupSchema = z.object({
  name: z.string().min(1).max(50),
});

export type CreateGroupSchema = z.infer<typeof createGroupSchema>;

export const settleUpSchema = z.object({
  amount: z.coerce.number().positive(),
  method: z.enum(['Cash', 'UPI']),
  note: z.string().optional(),
});

export type SettleUpSchema = z.infer<typeof settleUpSchema>;
