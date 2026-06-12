'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, RepeatIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { useData } from '@/components/providers/data-provider';
import { useToast } from '@/hooks/use-toast';
import { getCategory } from '@/lib/data';
import { categories, paymentMethods } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { RecurringExpense, Category, PaymentMethod } from '@/lib/types';

/* ------------------------------------------------------------------ */
/* Form state                                                          */
/* ------------------------------------------------------------------ */

interface FormState {
  description: string;
  amount: string;
  category: Category;
  paymentMethod: PaymentMethod;
  dayOfMonth: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  description: '',
  amount: '',
  category: 'Housing',
  paymentMethod: 'UPI',
  dayOfMonth: '1',
  notes: '',
};

function formFromItem(item: RecurringExpense): FormState {
  return {
    description: item.description,
    amount: String(item.amount),
    category: item.category,
    paymentMethod: item.paymentMethod,
    dayOfMonth: String(item.dayOfMonth),
    notes: item.notes ?? '',
  };
}

/* ------------------------------------------------------------------ */
/* Add / Edit dialog                                                    */
/* ------------------------------------------------------------------ */

function RecurringDialog({
  open,
  onOpenChange,
  initial,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: FormState;
  onSave: (form: FormState) => Promise<void>;
}) {
  const [form, setForm] = useState<FormState>(initial);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  // Reset when dialog opens with new initial
  React.useEffect(() => {
    if (open) {
      setForm(initial);
      setErrors({});
    }
  }, [open, initial]);

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.description.trim()) e.description = 'Required';
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) e.amount = 'Must be > 0';
    const day = parseInt(form.dayOfMonth, 10);
    if (!form.dayOfMonth || isNaN(day) || day < 1 || day > 28) e.dayOfMonth = 'Must be 1–28';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await onSave(form);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const field = (key: keyof FormState) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl font-medium">
            {initial === EMPTY_FORM ? 'Add recurring' : 'Edit recurring'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Description */}
          <div className="space-y-1.5">
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Description
            </Label>
            <Input placeholder="Rent, Netflix, SIP…" {...field('description')} />
            {errors.description && (
              <p className="font-code text-[0.58rem] uppercase tracking-[0.15em] text-destructive">
                {errors.description}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Amount (₹)
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              placeholder="0.00"
              {...field('amount')}
            />
            {errors.amount && (
              <p className="font-code text-[0.58rem] uppercase tracking-[0.15em] text-destructive">
                {errors.amount}
              </p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Category
            </Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment method */}
          <div className="space-y-1.5">
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Payment Method
            </Label>
            <Select
              value={form.paymentMethod}
              onValueChange={(v) => setForm((f) => ({ ...f, paymentMethod: v as PaymentMethod }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day of month */}
          <div className="space-y-1.5">
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Day of Month
            </Label>
            <Input
              type="number"
              inputMode="numeric"
              min={1}
              max={28}
              {...field('dayOfMonth')}
            />
            <p className="font-code text-[0.58rem] uppercase tracking-[0.15em] text-muted-foreground">
              Use 1–28 so it works every month
            </p>
            {errors.dayOfMonth && (
              <p className="font-code text-[0.58rem] uppercase tracking-[0.15em] text-destructive">
                {errors.dayOfMonth}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Notes (optional)
            </Label>
            <Input placeholder="" {...field('notes')} />
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Recurring item row                                                   */
/* ------------------------------------------------------------------ */

function RecurringRow({
  item,
  onEdit,
  onToggle,
  onRemove,
}: {
  item: RecurringExpense;
  onEdit: (item: RecurringExpense) => void;
  onToggle: (item: RecurringExpense) => void;
  onRemove: (item: RecurringExpense) => void;
}) {
  const cat = getCategory(item.category);
  const CatIcon = cat.icon;

  return (
    <div className="flex items-center gap-3 border-b border-dashed border-border/60 py-3 last:border-0">
      {/* Category icon */}
      <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-sm', cat.color)}>
        <CatIcon className="h-4 w-4" />
      </span>

      {/* Details */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{item.description}</p>
        <p className="font-code text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
          ₹{item.amount.toLocaleString('en-IN')} · Monthly on day {item.dayOfMonth}
        </p>
      </div>

      {/* Category badge — hidden on small screens */}
      <Badge variant="outline" className={cn('hidden shrink-0 sm:flex items-center gap-1.5', cat.color)}>
        {item.category}
      </Badge>

      {/* Active toggle */}
      <Switch
        checked={item.active}
        onCheckedChange={() => onToggle(item)}
        aria-label={item.active ? 'Deactivate' : 'Activate'}
      />

      {/* Edit */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={() => onEdit(item)}
        aria-label="Edit"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Button>

      {/* Delete */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
            aria-label="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{item.description}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Future occurrences will not be added. Past entries already in your ledger are unaffected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => onRemove(item)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* RecurringManager                                                     */
/* ------------------------------------------------------------------ */

export default function RecurringManager() {
  const { recurring, addRecurring, updateRecurring, removeRecurring } = useData();
  const { toast } = useToast();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringExpense | null>(null);

  const dialogInitial: FormState =
    editTarget ? formFromItem(editTarget) : EMPTY_FORM;

  const handleDialogOpen = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleEdit = (item: RecurringExpense) => {
    setEditTarget(item);
    setDialogOpen(true);
  };

  const handleSave = async (form: FormState) => {
    try {
      if (editTarget) {
        await updateRecurring(editTarget.id, {
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          category: form.category,
          paymentMethod: form.paymentMethod,
          dayOfMonth: parseInt(form.dayOfMonth, 10),
          notes: form.notes.trim() || undefined,
        });
        toast({ title: 'Recurring entry updated' });
      } else {
        await addRecurring({
          description: form.description.trim(),
          amount: parseFloat(form.amount),
          category: form.category,
          paymentMethod: form.paymentMethod,
          dayOfMonth: parseInt(form.dayOfMonth, 10),
          notes: form.notes.trim() || undefined,
        });
        toast({ title: 'Recurring entry added' });
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      toast({ variant: 'destructive', title: 'Save failed', description: msg });
      throw e;
    }
  };

  const handleToggle = async (item: RecurringExpense) => {
    try {
      await updateRecurring(item.id, { active: !item.active });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      toast({ variant: 'destructive', title: 'Update failed', description: msg });
    }
  };

  const handleRemove = async (item: RecurringExpense) => {
    try {
      await removeRecurring(item.id);
      toast({ title: `"${item.description}" removed` });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Something went wrong.';
      toast({ variant: 'destructive', title: 'Delete failed', description: msg });
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between border-b border-dashed border-border px-6 py-4">
          <div>
            <h2 className="font-headline text-2xl font-medium">Recurring</h2>
            <p className="text-sm text-muted-foreground">Monthly expenses applied automatically.</p>
          </div>
          <Button
            onClick={handleDialogOpen}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            size="sm"
          >
            <RepeatIcon className="mr-2 h-4 w-4" />
            Add recurring
          </Button>
        </div>

        <CardContent className="pt-2">
          {recurring.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-10 text-center">
              <RepeatIcon className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                No recurring entries yet — add rent, subscriptions, EMIs.
              </p>
            </div>
          ) : (
            <div>
              {recurring.map((item) => (
                <RecurringRow
                  key={item.id}
                  item={item}
                  onEdit={handleEdit}
                  onToggle={handleToggle}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RecurringDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v);
          if (!v) setEditTarget(null);
        }}
        initial={dialogInitial}
        onSave={handleSave}
      />
    </>
  );
}
