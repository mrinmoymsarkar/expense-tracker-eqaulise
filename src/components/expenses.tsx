'use client';

import React, { useState, useRef, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download } from 'lucide-react';
import { getCategory, getPaymentMethod } from '@/lib/data';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { exportExpensesCsv } from '@/lib/csv';
import { format } from 'date-fns';
import { useData } from '@/components/providers/data-provider';
import { useAuth } from '@/components/providers/auth-provider';
import {
  updateGroupExpense,
  deleteGroupExpense,
} from '@/lib/db/expenses';
import type { Group, ExpenseFormValues } from '@/lib/types';
import { ExpenseList, type DisplayExpense } from '@/components/expense-list';
import { ExpenseDetailSheet } from '@/components/expense-detail-sheet';
import { AddExpenseSheet } from '@/components/add-expense-sheet';

/* ------------------------------------------------------------------ */
/* Component                                                            */
/* ------------------------------------------------------------------ */

export default function Expenses({
  expenses,
  groups,
}: {
  expenses: DisplayExpense[];
  groups: Group[];
}) {
  const { toast } = useToast();
  const { updatePersonalExpense, deletePersonalExpense } = useData();
  const { user } = useAuth();

  /* Sheet / dialog state */
  const [selectedExpense, setSelectedExpense] = useState<DisplayExpense | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<DisplayExpense | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  /* Pending-delete ids — optimistically hidden until timeout fires */
  const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<string>>(new Set());
  const deleteTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /* Visible expenses (filter out pending deletes) */
  const visibleExpenses = expenses.filter((e) => !pendingDeleteIds.has(e.id));

  /* ---------------------------------------------------------------- */
  /* Delete with undo                                                  */
  /* ---------------------------------------------------------------- */

  const handleDelete = useCallback(
    (e: DisplayExpense) => {
      // Optimistically hide
      setPendingDeleteIds((prev) => new Set([...prev, e.id]));

      const { id: toastId, dismiss } = toast({
        title: 'Entry deleted',
        duration: 5000,
        action: (
          <ToastAction
            altText="Undo delete"
            onClick={() => {
              // Cancel the real delete
              const t = deleteTimers.current.get(e.id);
              if (t) {
                clearTimeout(t);
                deleteTimers.current.delete(e.id);
              }
              setPendingDeleteIds((prev) => {
                const next = new Set(prev);
                next.delete(e.id);
                return next;
              });
              dismiss();
            }}
          >
            Undo
          </ToastAction>
        ),
      });

      // Schedule the real delete after 5s
      const timer = setTimeout(async () => {
        deleteTimers.current.delete(e.id);
        try {
          if (e.groupId) {
            await deleteGroupExpense(e.groupId, e.id);
          } else {
            await deletePersonalExpense(e.id);
          }
        } catch {
          // Revert on error
          setPendingDeleteIds((prev) => {
            const next = new Set(prev);
            next.delete(e.id);
            return next;
          });
          toast({
            variant: 'destructive',
            title: 'Delete failed',
            description: 'Could not delete the entry. Please try again.',
          });
        }
      }, 5000);

      deleteTimers.current.set(e.id, timer);
    },
    [toast, deletePersonalExpense],
  );

  /* ---------------------------------------------------------------- */
  /* Edit submit                                                       */
  /* ---------------------------------------------------------------- */

  const handleEditSubmit = useCallback(
    async (values: ExpenseFormValues, editingId?: string) => {
      if (!editingId) return;
      const expense = editingExpense;
      if (!expense) return;

      if (expense.groupId) {
        if (!user) throw new Error('Not authenticated');
        await updateGroupExpense(expense.groupId, editingId, user.uid, values);
      } else {
        await updatePersonalExpense(editingId, values);
      }
    },
    [editingExpense, updatePersonalExpense, user],
  );

  /* ---------------------------------------------------------------- */
  /* Open detail on tap                                                */
  /* ---------------------------------------------------------------- */

  const handleTap = useCallback((e: DisplayExpense) => {
    setSelectedExpense(e);
    setDetailOpen(true);
  }, []);

  const handleEditFromDetail = useCallback((e: DisplayExpense) => {
    setEditingExpense(e);
    setEditOpen(true);
  }, []);

  /* ---------------------------------------------------------------- */
  /* CSV export                                                        */
  /* ---------------------------------------------------------------- */

  const handleExport = () => {
    if (visibleExpenses.length === 0) {
      toast({ title: 'Nothing to export', description: 'No expenses match the current view.' });
      return;
    }
    exportExpensesCsv(visibleExpenses);
  };

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-headline text-2xl font-medium">
            Recent Transactions
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={visibleExpenses.length === 0}
            aria-label="Export expenses as CSV"
            className="font-code text-xs uppercase tracking-wider min-h-[44px] md:min-h-0"
          >
            <Download className="h-4 w-4 md:mr-2" />
            <span className="hidden md:inline">Export CSV</span>
          </Button>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-code text-[0.65rem] uppercase tracking-[0.2em]">
                    Description
                  </TableHead>
                  <TableHead className="font-code text-[0.65rem] uppercase tracking-[0.2em]">
                    Category
                  </TableHead>
                  <TableHead className="font-code text-[0.65rem] uppercase tracking-[0.2em]">
                    Date
                  </TableHead>
                  <TableHead className="font-code text-[0.65rem] uppercase tracking-[0.2em]">
                    Group
                  </TableHead>
                  <TableHead className="font-code text-[0.65rem] uppercase tracking-[0.2em]">
                    Paid By
                  </TableHead>
                  <TableHead className="text-right font-code text-[0.65rem] uppercase tracking-[0.2em]">
                    Amount
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visibleExpenses.map((expense) => {
                  const cat = getCategory(expense.category);
                  const CatIcon = cat.icon;
                  const pm = getPaymentMethod(expense.paymentMethod);
                  const PmIcon = pm.icon;
                  return (
                    <TableRow
                      key={expense.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleTap(expense)}
                    >
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn('w-fit items-center gap-2', cat.color)}
                        >
                          <CatIcon className="h-4 w-4" />
                          <span>{expense.category}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(expense.date), 'PPP')}</TableCell>
                      <TableCell>{expense.group || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <PmIcon className="h-4 w-4" />
                          <span>{pm.label}</span>
                        </div>
                      </TableCell>
                      <TableCell className="tnum text-right font-mono font-medium">
                        ₹{expense.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile list */}
          <div className="md:hidden">
            <ExpenseList
              expenses={visibleExpenses}
              groups={groups.map((g) => ({ id: g.id, name: g.name }))}
              onTap={handleTap}
              onDelete={handleDelete}
            />
          </div>
        </CardContent>
      </Card>

      {/* Detail sheet */}
      <ExpenseDetailSheet
        expense={selectedExpense}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditFromDetail}
        onDelete={handleDelete}
      />

      {/* Edit sheet */}
      {editingExpense && (
        <AddExpenseSheet
          open={editOpen}
          onOpenChange={setEditOpen}
          groups={groups}
          defaultGroupId={editingExpense.groupId}
          initialValues={{
            id: editingExpense.id,
            description: editingExpense.description,
            amount: editingExpense.amount,
            category: editingExpense.category as ExpenseFormValues['category'],
            paymentMethod: editingExpense.paymentMethod as ExpenseFormValues['paymentMethod'],
            date: new Date(editingExpense.date),
            notes: editingExpense.notes,
            tags: editingExpense.tags ?? [],
            groupId: editingExpense.groupId,
            splitMethod: editingExpense.splitMethod ?? 'equal',
            splits: editingExpense.splits ?? {},
            paidBy: editingExpense.paidBy,
          }}
          onSubmit={handleEditSubmit}
        />
      )}
    </div>
  );
}
