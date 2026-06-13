'use client';

import React, { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { categoryBadge, getPaymentMethod } from '@/lib/data';
import { useCategories } from '@/hooks/use-categories';
import type { DisplayExpense } from '@/components/expense-list';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */

interface ExpenseDetailSheetProps {
  expense: DisplayExpense | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (e: DisplayExpense) => void;
  onDelete: (e: DisplayExpense) => void;
}

/* ------------------------------------------------------------------ */
/* Detail row (microcaps label → value)                                */
/* ------------------------------------------------------------------ */

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-dashed border-border/60 py-2.5 last:border-0">
      <span className="font-code shrink-0 text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="text-right text-sm font-medium">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Inner content (shared between Sheet and Dialog)                     */
/* ------------------------------------------------------------------ */

function DetailContent({
  expense,
  onEdit,
  onDelete,
  onClose,
}: {
  expense: DisplayExpense;
  onEdit: (e: DisplayExpense) => void;
  onDelete: (e: DisplayExpense) => void;
  onClose: () => void;
}) {
  const { getCategory } = useCategories();
  const category = getCategory(expense.category);
  const CategoryIcon = category.icon;
  const badge = categoryBadge(category);
  const paymentMethod = getPaymentMethod(expense.paymentMethod);
  const PaymentIcon = paymentMethod.icon;

  const dateObj = new Date(expense.date);

  const splitCount = expense.splits ? Object.keys(expense.splits).length : 0;

  return (
    <div className="flex flex-col gap-0">
      {/* Big amount */}
      <div className="border-b border-dashed border-border pb-4 text-center">
        <p className="tnum font-headline text-5xl font-semibold tracking-tight">
          ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <p className="mt-1 text-sm font-medium text-muted-foreground">{expense.description}</p>
      </div>

      {/* Dashed rows */}
      <div className="pt-2">
        <DetailRow label="Category">
          <Badge variant="outline" className={cn('w-fit items-center gap-1.5', badge.className)} style={badge.style}>
            <CategoryIcon className="h-3.5 w-3.5" />
            <span>{category.label}</span>
          </Badge>
        </DetailRow>

        <DetailRow label="Date">
          <span className="font-code text-xs">{format(dateObj, 'PPP p')}</span>
        </DetailRow>

        <DetailRow label="Paid via">
          <span className="flex items-center gap-1.5">
            <PaymentIcon className="h-3.5 w-3.5" />
            {paymentMethod.label}
          </span>
        </DetailRow>

        {expense.group && (
          <DetailRow label="Group">{expense.group}</DetailRow>
        )}

        {expense.notes && (
          <DetailRow label="Notes">
            <span className="text-right text-xs text-muted-foreground">{expense.notes}</span>
          </DetailRow>
        )}

        {expense.tags && expense.tags.length > 0 && (
          <DetailRow label="Tags">
            <div className="flex flex-wrap justify-end gap-1">
              {expense.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center rounded-sm border border-dashed border-border px-1.5 py-0.5 font-code text-[0.6rem] text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </DetailRow>
        )}

        {splitCount > 0 && expense.splitMethod && (
          <DetailRow label="Split">
            <span className="font-code text-xs uppercase tracking-[0.1em]">
              {expense.splitMethod} · {splitCount} {splitCount === 1 ? 'way' : 'ways'}
            </span>
          </DetailRow>
        )}
      </div>

      {/* Footer buttons */}
      <div className="mt-4 flex gap-3 border-t border-dashed border-border pt-4">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => {
            onEdit(expense);
            onClose();
          }}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex-1 gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this entry?</AlertDialogTitle>
              <AlertDialogDescription>
                This cannot be undone. The expense will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => {
                  onDelete(expense);
                  onClose();
                }}
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                     */
/* ------------------------------------------------------------------ */

export function ExpenseDetailSheet({
  expense,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ExpenseDetailSheetProps) {
  const isMobile = useIsMobile();

  if (!expense) return null;

  const handleClose = () => onOpenChange(false);

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-auto max-h-[80svh] rounded-t-lg border-t p-6"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{expense.description}</SheetTitle>
          </SheetHeader>
          <DetailContent
            expense={expense}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={handleClose}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6">
        <DialogTitle className="sr-only">{expense.description}</DialogTitle>
        <DetailContent
          expense={expense}
          onEdit={onEdit}
          onDelete={onDelete}
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
}
