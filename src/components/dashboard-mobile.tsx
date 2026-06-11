'use client';

import React from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { categories, getCategory, getPaymentMethod } from '@/lib/data';
import type { DisplayExpense } from '@/components/expense-list';

/* ------------------------------------------------------------------ */
/* Chart config                                                         */
/* ------------------------------------------------------------------ */

const categoryColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const categoryChartConfig = {
  amount: {
    label: 'Amount',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

/* ------------------------------------------------------------------ */
/* Summary type                                                        */
/* ------------------------------------------------------------------ */

interface Summary {
  youOweTotal: number;
  youAreOwedTotal: number;
  activeGroupCount: number;
  loading: boolean;
}

/* ------------------------------------------------------------------ */
/* Stat card                                                           */
/* ------------------------------------------------------------------ */

function StatCard({
  label,
  value,
  sub,
  tone,
  index,
  loading,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
  index: number;
  loading?: boolean;
}) {
  return (
    <Card
      className="anim-rise relative overflow-hidden"
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-1 right-2 select-none font-headline text-5xl font-light italic text-foreground/[0.06]"
      >
        {String(index + 1).padStart(2, '0')}
      </span>
      <CardHeader className="pb-1 pt-3 px-3">
        <CardTitle className="font-code text-[0.58rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        {loading ? (
          <Skeleton className="h-7 w-3/4" />
        ) : (
          <div className={cn('tnum font-headline text-2xl font-semibold', tone)}>
            {value}
          </div>
        )}
        <p className="mt-2 border-t border-dashed pt-1.5 font-code text-[0.6rem] text-muted-foreground">
          {sub}
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Recent entry row (presentational only)                              */
/* ------------------------------------------------------------------ */

function RecentRow({ expense }: { expense: DisplayExpense }) {
  const category = getCategory(expense.category);
  const CategoryIcon = category.icon;

  const dateLabel = (() => {
    const d = new Date(expense.date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yest';
    return format(d, 'd MMM');
  })();

  return (
    <div className="flex min-h-[48px] items-center gap-3 py-1.5">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-none text-sm',
          category.color,
        )}
      >
        <CategoryIcon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight">{expense.description}</p>
        {expense.group && (
          <p className="font-code text-[0.6rem] text-muted-foreground truncate">{expense.group}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="tnum font-mono text-sm font-semibold">
          ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
        </span>
        <span className="font-code text-[0.58rem] uppercase tracking-[0.1em] text-muted-foreground">
          {dateLabel}
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface DashboardMobileProps {
  stats: { label: string; value: string; sub: string; tone?: string }[];
  expenses: DisplayExpense[];
  categoryChartData: { category: string; amount: number }[];
  summary: Summary;
}

/* ------------------------------------------------------------------ */
/* DashboardMobile                                                     */
/* ------------------------------------------------------------------ */

export default function DashboardMobile({
  stats,
  expenses,
  categoryChartData,
  summary,
}: DashboardMobileProps) {
  const recentExpenses = expenses.slice(0, 5);

  return (
    <div className="flex flex-col gap-4">
      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            sub={stat.sub}
            tone={stat.tone}
            index={i}
            loading={i === 1 || i === 2 ? summary.loading : false}
          />
        ))}
      </div>

      {/* Recent entries card */}
      <Card className="anim-rise" style={{ animationDelay: '360ms' }}>
        <CardHeader className="pb-1">
          <CardTitle className="font-headline text-lg font-medium">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          {recentExpenses.length === 0 ? (
            <p className="font-code py-4 text-center text-xs text-muted-foreground">
              No entries yet.
            </p>
          ) : (
            <div>
              {recentExpenses.map((e, idx) => (
                <React.Fragment key={e.id}>
                  <RecentRow expense={e} />
                  {idx < recentExpenses.length - 1 && (
                    <div className="border-b border-dashed border-border/60" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category chart */}
      <Card className="anim-rise" style={{ animationDelay: '450ms' }}>
        <CardHeader className="pb-1">
          <CardTitle className="font-headline text-lg font-medium">By Category</CardTitle>
          <CardDescription className="font-code text-[0.6rem] uppercase tracking-[0.15em]">
            All-time spending
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={categoryChartConfig} className="h-[220px] w-full">
            <BarChart
              data={categoryChartData}
              accessibilityLayer
              margin={{ top: 10, right: 10, bottom: 10, left: 0 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="category"
                tickLine={false}
                tickMargin={8}
                axisLine={false}
                tickFormatter={(value) => value.slice(0, 3)}
                className="font-code text-[0.6rem]"
              />
              <YAxis
                tickFormatter={(value) => `₹${Number(value).toLocaleString('en-IN', { notation: 'compact' })}`}
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                width={48}
                className="font-code text-[0.6rem]"
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="dot" />}
              />
              <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
