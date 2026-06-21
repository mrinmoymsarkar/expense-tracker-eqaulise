'use client';

import React, { useState, useMemo } from 'react';
import { Search, X, Users, Trash2, Loader2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { categoryBadge, getPaymentMethod } from '@/lib/data';
import { useCategories } from '@/hooks/use-categories';
import { useSwipeToDelete } from '@/hooks/use-swipe-to-delete';

/* ------------------------------------------------------------------ */
/* DisplayExpense type — exported so Expenses + Dashboard can import   */
/* ------------------------------------------------------------------ */

export interface DisplayExpense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO
  group: string; // group NAME or ""
  groupId: string | null; // null = personal expense
  paymentMethod: string;
  notes: string;
  tags?: string[];
  paidBy?: string;
  splitMethod?: 'equal' | 'exact' | 'percentage';
  splits?: Record<string, number>;
  pending?: boolean;
}

/* ------------------------------------------------------------------ */
/* Props                                                                */
/* ------------------------------------------------------------------ */

interface ExpenseListProps {
  expenses: DisplayExpense[];
  onTap: (e: DisplayExpense) => void;
  onDelete: (e: DisplayExpense) => void;
  showSearch?: boolean;
  groups?: { id: string; name: string }[];
}

/* ------------------------------------------------------------------ */
/* Single swipeable row                                                 */
/* ------------------------------------------------------------------ */

function ExpenseRow({
  expense,
  onTap,
  onDelete,
}: {
  expense: DisplayExpense;
  onTap: (e: DisplayExpense) => void;
  onDelete: (e: DisplayExpense) => void;
}) {
  const { handlers, translateX, swiping } = useSwipeToDelete(() => onDelete(expense));
  const { getCategory } = useCategories();
  const category = getCategory(expense.category);
  const CategoryIcon = category.icon;
  const badge = categoryBadge(category);
  const paymentMethod = getPaymentMethod(expense.paymentMethod);
  const PaymentIcon = paymentMethod.icon;

  const dateLabel = (() => {
    const d = new Date(expense.date);
    const now = new Date();
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yest';
    if (d.getFullYear() === now.getFullYear()) return format(d, 'd MMM');
    return format(d, 'd MMM yy');
  })();

  return (
    <div className="relative overflow-hidden">
      {/* Delete background layer */}
      <div className="absolute inset-0 flex items-center justify-end bg-destructive px-4">
        <Trash2 className="h-5 w-5 text-destructive-foreground" />
      </div>

      {/* Foreground row */}
      <div
        className={cn(
          'relative flex min-h-[56px] cursor-pointer items-center gap-3 bg-background px-3 py-2 transition-colors hover:bg-muted/50',
          !swiping && 'transition-transform duration-200 ease-out',
        )}
        style={{ transform: `translateX(${translateX}px)` }}
        onClick={() => onTap(expense)}
        role="button"
        tabIndex={0}
        onKeyDown={(ev) => ev.key === 'Enter' && onTap(expense)}
        {...handlers}
      >
        {/* Category icon badge */}
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-none text-sm',
            badge.className,
          )}
          style={badge.style}
        >
          <CategoryIcon className="h-4 w-4" />
        </div>

        {/* Description + sub-line */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium leading-tight">{expense.description}</p>
          <p className="font-code mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            {expense.group ? (
              <>
                <Users className="h-3 w-3 shrink-0" />
                <span className="truncate">{expense.group}</span>
              </>
            ) : (
              <>
                <PaymentIcon className="h-3 w-3 shrink-0" />
                <span>{paymentMethod.label}</span>
              </>
            )}
            {expense.tags && expense.tags.length > 0 && (
              <>
                {expense.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="font-code text-[0.6rem] text-muted-foreground/70"
                  >
                    #{tag}
                  </span>
                ))}
                {expense.tags.length > 2 && (
                  <span className="font-code text-[0.6rem] text-muted-foreground/70">
                    +{expense.tags.length - 2}
                  </span>
                )}
              </>
            )}
          </p>
        </div>

        {/* Amount + date */}
        <div className="flex shrink-0 flex-col items-end gap-0.5">
          <div className="flex items-center gap-1">
            {expense.pending && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" aria-label="Syncing" />}
            <span className="tnum font-mono text-sm font-semibold">
              ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
            </span>
          </div>
          <span className="font-code text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
            {dateLabel}
          </span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Day-group header label                                               */
/* ------------------------------------------------------------------ */

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  if (isToday(d)) return 'Today';
  if (isYesterday(d)) return 'Yesterday';
  const base = format(d, 'EEE, d MMM');
  return d.getFullYear() !== now.getFullYear() ? `${base} ${d.getFullYear()}` : base;
}

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export function ExpenseList({
  expenses,
  onTap,
  onDelete,
  showSearch = true,
  groups,
}: ExpenseListProps) {
  const { categories } = useCategories();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  /* Filtered list */
  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        e.description.toLowerCase().includes(q) ||
        e.notes.toLowerCase().includes(q) ||
        e.group.toLowerCase().includes(q) ||
        (e.tags ?? []).some((t) => t.toLowerCase().includes(q));
      const matchesCategory = !activeCategory || e.category === activeCategory;
      const matchesGroup = !activeGroup || e.group === activeGroup;
      const matchesTag = !activeTag || (e.tags ?? []).includes(activeTag);
      return matchesSearch && matchesCategory && matchesGroup && matchesTag;
    });
  }, [expenses, search, activeCategory, activeGroup, activeTag]);

  /* Day-grouped list */
  const grouped = useMemo(() => {
    const map = new Map<string, DisplayExpense[]>();
    for (const e of filtered) {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      key,
      label: dayLabel(items[0].date),
      items,
    }));
  }, [filtered]);

  /* Unique group names for filter chips */
  const groupNames = useMemo(
    () => (groups ? groups.map((g) => g.name) : [...new Set(expenses.map((e) => e.group).filter(Boolean))]),
    [groups, expenses],
  );

  /* Unique tags for filter chips */
  const allTags = useMemo(() => {
    const set = new Set<string>();
    for (const e of expenses) {
      for (const t of (e.tags ?? [])) set.add(t);
    }
    return [...set].sort();
  }, [expenses]);

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            inputMode="search"
            placeholder="Search entries…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Filter chips */}
      <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
        {/* All chip */}
        <button
          onClick={() => { setActiveCategory(null); setActiveGroup(null); setActiveTag(null); }}
          className={cn(
            'flex h-7 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 font-code text-[0.6rem] uppercase tracking-[0.15em] transition-colors',
            !activeCategory && !activeGroup && !activeTag
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          All
        </button>

        {/* Category chips */}
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(isActive ? null : cat.value)}
              className={cn(
                'flex h-7 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 font-code text-[0.6rem] uppercase tracking-[0.15em] transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              <Icon className="h-3 w-3" />
              {cat.label.split(' ')[0]}
            </button>
          );
        })}

        {/* Group chips */}
        {groupNames.map((name) => {
          const isActive = activeGroup === name;
          return (
            <button
              key={name}
              onClick={() => setActiveGroup(isActive ? null : name)}
              className={cn(
                'flex h-7 shrink-0 snap-start items-center gap-1.5 rounded-full border px-3 font-code text-[0.6rem] uppercase tracking-[0.15em] transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              <Users className="h-3 w-3" />
              {name}
            </button>
          );
        })}

        {/* Tag chips */}
        {allTags.map((tag) => {
          const isActive = activeTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setActiveTag(isActive ? null : tag)}
              className={cn(
                'flex h-7 shrink-0 snap-start items-center rounded-full border border-dashed px-3 font-code text-[0.6rem] tracking-[0.15em] transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground border-primary border-solid'
                  : 'border-border bg-card text-muted-foreground hover:bg-muted',
              )}
            >
              #{tag}
            </button>
          );
        })}
      </div>

      {/* Empty states */}
      {expenses.length === 0 && (
        <div className="anim-rise flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
          <p className="font-headline text-lg font-medium">The ledger is empty</p>
          <p className="font-code text-xs text-muted-foreground">
            Add your first expense with the + button.
          </p>
        </div>
      )}

      {expenses.length > 0 && filtered.length === 0 && (
        <div className="anim-rise flex flex-col items-center gap-2 rounded-md border border-dashed border-border p-8 text-center">
          <p className="font-code text-xs text-muted-foreground">No entries match.</p>
        </div>
      )}

      {/* Grouped rows */}
      {grouped.map(({ key, label, items }) => (
        <div key={key}>
          {/* Day header */}
          <div className="font-code border-b border-dashed border-border py-2 text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
            {label}
          </div>

          {/* Rows */}
          <div>
            {items.map((e, idx) => (
              <div key={e.id} className="[content-visibility:auto] [contain-intrinsic-size:auto_64px]">
                <ExpenseRow expense={e} onTap={onTap} onDelete={onDelete} />
                {idx < items.length - 1 && (
                  <div className="mx-3 border-b border-dashed border-border/60" />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
