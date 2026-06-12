'use client';

import React, {
  useRef,
  useState,
  useEffect,
  useTransition,
  useCallback,
} from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  Camera,
  Loader2,
  ChevronDown,
  Sparkles,
  X,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { Group, ExpenseFormValues, SplitMethod, SplitMap, Category, PaymentMethod } from '@/lib/types';
import { expenseFormSchema } from '@/lib/schemas';
import { categories, paymentMethods } from '@/lib/data';
import { computeSplits } from '@/lib/balances';
import { processReceipt, getSplitSuggestion } from '@/app/actions';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLastPaymentMethod } from '@/hooks/use-last-payment-method';
import { useSwipeDown } from '@/hooks/use-swipe-down';
import { useVisualViewport } from '@/hooks/use-visual-viewport';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { SplitEditor } from '@/components/split-editor';

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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */

interface AddExpenseSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groups: Group[];
  defaultGroupId?: string | null;
  initialValues?: Partial<ExpenseFormValues> & { id?: string };
  onSubmit: (values: ExpenseFormValues, editingId?: string) => Promise<void>;
  existingTags?: string[];
}

/* ------------------------------------------------------------------ */
/* Internal form shape (we keep time as a string, date as Date)        */
/* ------------------------------------------------------------------ */

type FormShape = {
  description: string;
  amount: string; // string for the giant input; converted to number on submit
  category: Category;
  paymentMethod: PaymentMethod;
  date: Date;
  timeStr: string;
  notes: string;
  tags: string[];
  groupId: string; // 'personal' | actual group id
  splitMethod: SplitMethod;
  splits: SplitMap;
  paidBy: string;
};

function toTimeStr(d: Date): string {
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function mergeDateAndTime(date: Date, timeStr: string): Date {
  const [hh, mm] = timeStr.split(':').map(Number);
  const merged = new Date(date);
  merged.setHours(isNaN(hh) ? 0 : hh, isNaN(mm) ? 0 : mm, 0, 0);
  return merged;
}

/* ------------------------------------------------------------------ */
/* Form body (shared between Sheet and Dialog)                         */
/* ------------------------------------------------------------------ */

interface ExpenseFormBodyProps {
  isEditMode: boolean;
  isMobile: boolean;
  groups: Group[];
  defaultGroupId: string | null;
  initialValues?: Partial<ExpenseFormValues> & { id?: string };
  onClose: () => void;
  onSubmit: (values: ExpenseFormValues, editingId?: string) => Promise<void>;
  open: boolean;
  existingTags?: string[];
}

function ExpenseFormBody({
  isEditMode,
  isMobile,
  groups,
  defaultGroupId,
  initialValues,
  onClose,
  onSubmit,
  open,
  existingTags,
}: ExpenseFormBodyProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [lastPm, setLastPm] = useLastPaymentMethod();
  const swipe = useSwipeDown(onClose);

  const [isScanning, setIsScanning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [splitValue, setSplitValue] = useState<{ method: SplitMethod; splits: SplitMap }>({
    method: 'equal',
    splits: {},
  });
  const [paidBy, setPaidBy] = useState(user?.uid ?? '');
  const [isPending, startTransition] = useTransition();
  const [suggestReasoning, setSuggestReasoning] = useState<string | null>(null);
  const [suggestedMethodName, setSuggestedMethodName] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const [tagInputValue, setTagInputValue] = useState('');

  useEffect(() => {
    if (open && !isEditMode) {
      const t = setTimeout(() => amountRef.current?.focus({ preventScroll: true }), 300);
      return () => clearTimeout(t);
    }
  }, [open, isEditMode]);

  const handleInputFocus = (e: React.FocusEvent<HTMLElement>) => {
    setTimeout(() => (e.target as HTMLElement).scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
  };

  /* Default values -------------------------------------------------- */
  function buildDefaults(): FormShape {
    const now = new Date();
    if (isEditMode && initialValues) {
      return {
        description: initialValues.description ?? '',
        amount: initialValues.amount != null ? String(initialValues.amount) : '',
        category: (initialValues.category as Category) ?? 'Food',
        paymentMethod: initialValues.paymentMethod ?? lastPm,
        date: initialValues.date ?? now,
        timeStr: toTimeStr(initialValues.date ?? now),
        notes: initialValues.notes ?? '',
        tags: initialValues.tags ?? [],
        groupId: initialValues.groupId ?? 'personal',
        splitMethod: initialValues.splitMethod ?? 'equal',
        splits: initialValues.splits ?? {},
        paidBy: initialValues.paidBy ?? user?.uid ?? '',
      };
    }
    return {
      description: '',
      amount: '',
      category: 'Food',
      paymentMethod: lastPm,
      date: now,
      timeStr: toTimeStr(now),
      notes: '',
      tags: [],
      groupId: defaultGroupId ?? 'personal',
      splitMethod: 'equal',
      splits: {},
      paidBy: user?.uid ?? '',
    };
  }

  const [formState, setFormState] = useState<FormShape>(buildDefaults);
  const [errors, setErrors] = useState<Partial<Record<keyof FormShape, string>>>({});

  /* Reset when open changes ----------------------------------------- */
  useEffect(() => {
    if (open) {
      const defaults = buildDefaults();
      setFormState(defaults);
      setErrors({});
      setSplitValue({ method: defaults.splitMethod, splits: defaults.splits });
      setPaidBy(defaults.paidBy || user?.uid || '');
      setSuggestReasoning(null);
      setSuggestedMethodName(null);
      setTagInputValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* Active group ---------------------------------------------------- */
  const activeGroup = formState.groupId !== 'personal'
    ? groups.find((g) => g.id === formState.groupId) ?? null
    : null;

  const groupMembers = activeGroup
    ? Object.entries(activeGroup.members).map(([uid, info]) => ({
        uid,
        displayName: info.displayName,
      }))
    : [];

  const memberUids = groupMembers.map((m) => m.uid);

  const amountNum = parseFloat(formState.amount) || 0;

  /* Validate -------------------------------------------------------- */
  function validate(): boolean {
    const errs: Partial<Record<keyof FormShape, string>> = {};
    if (!formState.description.trim()) errs.description = 'Required';
    if (!formState.amount || isNaN(parseFloat(formState.amount)) || parseFloat(formState.amount) <= 0) {
      errs.amount = 'Enter a valid amount';
    }
    if (!formState.category) errs.category = 'Required';
    if (!formState.paymentMethod) errs.paymentMethod = 'Required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  /* Receipt scan ---------------------------------------------------- */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setIsScanning(true);
      try {
        const dataUri = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        let geminiOk = false;
        try {
          const result = await processReceipt({ receiptDataUri: dataUri });
          if (!result.error && result.data) {
            const { description, amount, category } = result.data;
            const validCategory = categories.find((c) => c.value === category)?.value as Category | undefined;
            setFormState((prev) => ({
              ...prev,
              description: description ?? prev.description,
              amount: amount != null ? String(amount) : prev.amount,
              category: validCategory ?? prev.category,
            }));
            toast({ title: 'Receipt scanned', description: description });
            geminiOk = true;
          }
        } catch {
          // fall through to local OCR
        }

        if (!geminiOk) {
          try {
            const { scanReceiptLocal } = await import('@/lib/ocr/receipt-ocr');
            const local = await scanReceiptLocal(dataUri);
            if (local.amount !== null || local.description) {
              const validCategory = categories.find((c) => c.value === local.category)?.value as Category | undefined;
              setFormState((prev) => ({
                ...prev,
                ...(local.description ? { description: local.description } : {}),
                ...(local.amount !== null ? { amount: String(local.amount) } : {}),
                category: validCategory ?? prev.category,
              }));
              toast({
                title: 'Scanned on device',
                description: 'Used offline OCR — please double-check the values.',
              });
            } else {
              toast({
                variant: 'destructive',
                title: 'Scan failed',
                description: 'Could not extract data from the receipt',
              });
            }
          } catch (localErr) {
            toast({
              variant: 'destructive',
              title: 'Scan failed',
              description: localErr instanceof Error ? localErr.message : 'Could not scan receipt',
            });
          }
        }
      } finally {
        setIsScanning(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [toast],
  );

  /* AI split suggestion --------------------------------------------- */
  const handleSuggestSplit = useCallback(() => {
    startTransition(async () => {
      const result = await getSplitSuggestion({
        description: formState.description || 'expense',
        numPeople: groupMembers.length,
      });
      if (result.error) {
        toast({ variant: 'destructive', title: 'AI suggestion failed', description: result.error });
        return;
      }
      const raw = (result.method ?? '').toLowerCase();
      let mapped: SplitMethod | null = null;
      if (raw.includes('equal')) mapped = 'equal';
      else if (raw.includes('exact') || raw.includes('amount')) mapped = 'exact';
      else if (raw.includes('percent')) mapped = 'percentage';

      setSuggestReasoning(result.reasoning ?? null);
      setSuggestedMethodName(result.method ?? null);

      if (mapped) {
        const newSplits = computeSplits(mapped, amountNum, memberUids);
        setSplitValue({ method: mapped, splits: newSplits });
      }
    });
  }, [formState.description, groupMembers.length, amountNum, memberUids, toast]);

  /* Tag helpers ----------------------------------------------------- */
  const normalizeTag = (raw: string): string =>
    raw.trim().toLowerCase().replace(/^#+/, '').replace(/\s+/g, '-');

  const addTagFromInput = useCallback((raw: string) => {
    const parts = raw.split(',').map(normalizeTag).filter(Boolean);
    if (parts.length === 0) return;
    setFormState((prev) => {
      const next = [...prev.tags];
      for (const t of parts) {
        if (t && !next.includes(t)) next.push(t);
      }
      return { ...prev, tags: next };
    });
    setTagInputValue('');
  }, []);

  const removeTag = useCallback((tag: string) => {
    setFormState((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }));
  }, []);

  const addTagDirect = useCallback((tag: string) => {
    setFormState((prev) => {
      if (prev.tags.includes(tag)) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
    });
  }, []);

  /* Submit ---------------------------------------------------------- */
  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const finalDate = mergeDateAndTime(formState.date, formState.timeStr);
    let finalSplits = splitValue.splits;

    if (activeGroup) {
      // Validate splits
      if (splitValue.method === 'equal' || Object.keys(finalSplits).length === 0) {
        finalSplits = computeSplits('equal', amountNum, memberUids);
      } else if (splitValue.method === 'exact') {
        const sum = Object.values(finalSplits).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - amountNum) > 0.01) {
          toast({
            variant: 'destructive',
            title: 'Split mismatch',
            description: `Exact splits sum ₹${sum.toFixed(2)} ≠ total ₹${amountNum.toFixed(2)}`,
          });
          return;
        }
      } else if (splitValue.method === 'percentage') {
        const sum = Object.values(finalSplits).reduce((a, b) => a + b, 0);
        if (Math.abs(sum - amountNum) > 0.01) {
          finalSplits = computeSplits('equal', amountNum, memberUids);
        }
      }
    }

    const values: ExpenseFormValues = {
      description: formState.description.trim(),
      amount: amountNum,
      category: formState.category,
      paymentMethod: formState.paymentMethod,
      date: finalDate,
      notes: formState.notes,
      tags: formState.tags,
      groupId: formState.groupId === 'personal' ? null : formState.groupId,
      splitMethod: splitValue.method,
      splits: finalSplits,
      paidBy: paidBy || user?.uid || '',
    };

    setIsSubmitting(true);
    try {
      await onSubmit(values, initialValues?.id);
      toast({
        title: isEditMode ? 'Entry updated' : 'Added to ledger',
        description: `₹${amountNum.toFixed(2)} — ${values.description}`,
      });
      onClose();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err instanceof Error ? err.message : 'Something went wrong',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    validate,
    formState,
    splitValue,
    activeGroup,
    amountNum,
    memberUids,
    paidBy,
    user?.uid,
    onSubmit,
    initialValues?.id,
    isEditMode,
    toast,
    onClose,
  ]);

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  const headerZoneHandlers = isMobile ? swipe.handlers : {};

  return (
    <div className="flex h-full flex-col">
      {/* Drag handle + header zone */}
      <div
        className="shrink-0 px-4 pt-2 pb-3 cursor-grab"
        {...headerZoneHandlers}
      >
        {isMobile && (
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border" aria-hidden="true" />
        )}
        <div className={`flex items-center justify-between ${!isMobile ? 'pr-8' : ''}`}>
          <span className="font-code text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {isEditMode ? 'Edit entry' : 'New entry'}
          </span>
          <div className="flex items-center gap-2">
            {/* Scan button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 font-code text-xs"
              disabled={isScanning}
              onClick={() => fileInputRef.current?.click()}
              aria-label="Scan receipt"
            >
              {isScanning ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Camera className="h-3.5 w-3.5" />
              )}
              {isMobile ? 'Scan' : 'Scan receipt'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="sr-only"
              tabIndex={-1}
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="space-y-5 pb-4">

          {/* 1. Amount row */}
          <div className="space-y-1">
            <div className="flex items-baseline gap-1 border-b border-dashed border-border pb-2">
              <span className="font-headline text-3xl text-muted-foreground">₹</span>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                placeholder="0"
                value={formState.amount}
                onChange={(e) =>
                  setFormState((prev) => ({ ...prev, amount: e.target.value }))
                }
                onFocus={handleInputFocus}
                className="w-full bg-transparent border-none outline-none focus-visible:ring-0 font-headline text-5xl font-semibold tnum"
                aria-label="Amount"
              />
            </div>
            {errors.amount && (
              <p className="font-code text-[0.65rem] text-destructive">{errors.amount}</p>
            )}
          </div>

          {/* 2. Description */}
          <div className="space-y-1">
            <Input
              placeholder="What was this for?"
              className="h-11"
              value={formState.description}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, description: e.target.value }))
              }
              onFocus={handleInputFocus}
              aria-label="Description"
            />
            {errors.description && (
              <p className="font-code text-[0.65rem] text-destructive">{errors.description}</p>
            )}
          </div>

          {/* 3. Category chips */}
          <div className="space-y-2">
            <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Category
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x scrollbar-none">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isSelected = formState.category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        category: cat.value as Category,
                      }))
                    }
                    className={cn(
                      'flex min-h-[44px] shrink-0 snap-start flex-col items-center gap-1 rounded-md border px-3 py-2 font-code text-[0.6rem] uppercase tracking-wider transition-colors',
                      isSelected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                    aria-pressed={isSelected}
                    aria-label={cat.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{cat.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Payment pills */}
          <div className="space-y-2">
            <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Payment
            </span>
            <div className="flex gap-2">
              {paymentMethods.map((pm) => {
                const Icon = pm.icon;
                const isSelected = formState.paymentMethod === pm.value;
                return (
                  <button
                    key={pm.value}
                    type="button"
                    onClick={() => {
                      const v = pm.value as PaymentMethod;
                      setFormState((prev) => ({ ...prev, paymentMethod: v }));
                      setLastPm(v);
                    }}
                    className={cn(
                      'flex h-11 flex-1 items-center justify-center gap-1.5 rounded-md border font-code text-xs uppercase tracking-wider transition-colors',
                      isSelected
                        ? 'bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))] border-transparent'
                        : 'border-border bg-card text-muted-foreground hover:bg-muted',
                    )}
                    aria-pressed={isSelected}
                  >
                    <Icon className="h-4 w-4" />
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. More options collapsible */}
          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center justify-between py-1 font-code text-xs uppercase tracking-[0.2em] text-muted-foreground"
              >
                More options
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    moreOpen && 'rotate-180',
                  )}
                />
              </button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-3">
              {/* Date + Time */}
              <div className="flex gap-3">
                <div className="flex-1 space-y-1">
                  <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Date
                  </span>
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-11 w-full justify-start text-left font-normal text-sm"
                      >
                        {format(formState.date, 'PPP')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formState.date}
                        onSelect={(d) => {
                          if (d) {
                            setFormState((prev) => ({ ...prev, date: d }));
                            setDatePickerOpen(false);
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-28 space-y-1">
                  <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                    Time
                  </span>
                  <Input
                    type="time"
                    value={formState.timeStr}
                    onChange={(e) =>
                      setFormState((prev) => ({ ...prev, timeStr: e.target.value }))
                    }
                    className="h-11"
                  />
                </div>
              </div>

              {/* Group select */}
              <div className="space-y-1">
                <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Group
                </span>
                <Select
                  value={formState.groupId}
                  onValueChange={(v) =>
                    setFormState((prev) => ({ ...prev, groupId: v }))
                  }
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="None (personal)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">None (personal)</SelectItem>
                    {groups.map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Notes
                </span>
                <Textarea
                  placeholder="Any additional notes..."
                  className="resize-none"
                  rows={3}
                  value={formState.notes}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  onFocus={handleInputFocus}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                  Tags
                </span>
                {formState.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formState.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-sm border border-dashed border-border px-2 py-0.5 font-code text-xs text-foreground"
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="flex h-4 w-4 min-w-[24px] items-center justify-center text-muted-foreground hover:text-foreground"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <Input
                  placeholder="office, goa-trip…"
                  enterKeyHint="done"
                  value={tagInputValue}
                  onFocus={handleInputFocus}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v.endsWith(',')) {
                      addTagFromInput(v);
                    } else {
                      setTagInputValue(v);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTagFromInput(tagInputValue);
                    }
                  }}
                  onBlur={() => {
                    if (tagInputValue.trim()) addTagFromInput(tagInputValue);
                  }}
                  className="h-10"
                />
                {existingTags && existingTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {existingTags
                      .filter((t) => !formState.tags.includes(t))
                      .slice(0, 8)
                      .map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => addTagDirect(tag)}
                          className="inline-flex items-center rounded-sm border border-dashed border-border/60 px-2 py-0.5 font-code text-xs text-muted-foreground hover:border-border hover:text-foreground transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* 6. Split editor (when group selected) */}
          {activeGroup && groupMembers.length > 0 && (
            <div className="anim-rise rounded-md border border-dashed border-accent p-4 space-y-4">
              <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                Split
              </span>

              {/* AI suggest button */}
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2 font-code text-xs uppercase tracking-[0.15em]"
                onClick={handleSuggestSplit}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Suggest split method
              </Button>

              {/* AI suggestion result */}
              {suggestReasoning && (
                <div className="anim-rise rounded-sm border border-dashed border-accent bg-accent/10 p-3 space-y-1">
                  {suggestedMethodName && (
                    <p className="font-code text-xs uppercase tracking-[0.15em] text-primary">
                      {suggestedMethodName}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{suggestReasoning}</p>
                </div>
              )}

              <SplitEditor
                totalAmount={amountNum}
                members={groupMembers}
                value={splitValue}
                onChange={setSplitValue}
                paidBy={paidBy}
                onPaidByChange={setPaidBy}
                currentUid={user?.uid ?? ''}
              />
            </div>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div
        className="shrink-0 border-t bg-background px-4 py-3"
        style={{ paddingBottom: 'calc(0.75rem + var(--sab))' }}
      >
        <Button
          type="button"
          className="h-14 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-headline text-lg"
          disabled={isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isEditMode ? (
            'Save changes'
          ) : (
            `Add to ledger — ₹${amountNum > 0 ? amountNum.toLocaleString('en-IN') : '0'}`
          )}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Public component                                                     */
/* ------------------------------------------------------------------ */

export function AddExpenseSheet({
  open,
  onOpenChange,
  groups,
  defaultGroupId,
  initialValues,
  onSubmit,
  existingTags,
}: AddExpenseSheetProps) {
  const isMobile = useIsMobile();
  const isEditMode = Boolean(initialValues?.id);
  const { vvHeight, keyboardOpen } = useVisualViewport();

  useEffect(() => {
    if (keyboardOpen) {
      window.scrollTo(0, 0);
    }
  }, [keyboardOpen]);

  const bodyProps: ExpenseFormBodyProps = {
    isEditMode,
    isMobile,
    groups,
    defaultGroupId: defaultGroupId ?? null,
    initialValues,
    onClose: () => onOpenChange(false),
    onSubmit,
    open,
    existingTags,
  };

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[92svh] rounded-t-lg border-t p-0 flex flex-col"
          style={keyboardOpen && vvHeight ? { height: vvHeight, maxHeight: vvHeight } : undefined}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>{isEditMode ? 'Edit expense' : 'Add expense'}</SheetTitle>
          </SheetHeader>
          <ExpenseFormBody {...bodyProps} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg h-[90vh] p-0 flex flex-col overflow-hidden">
        <DialogTitle className="sr-only">
          {isEditMode ? 'Edit expense' : 'Add expense'}
        </DialogTitle>
        <ExpenseFormBody {...bodyProps} />
      </DialogContent>
    </Dialog>
  );
}
