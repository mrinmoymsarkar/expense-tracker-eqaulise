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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { categoryBadge } from '@/lib/data';
import { useCategories } from '@/hooks/use-categories';
import type { DisplayExpense } from '@/components/expense-list';

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
  deltaChip,
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
  index: number;
  loading?: boolean;
  deltaChip?: React.ReactNode;
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
          {deltaChip}
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Recent entry row (presentational only)                              */
/* ------------------------------------------------------------------ */

function RecentRow({ expense }: { expense: DisplayExpense }) {
  const { getCategory } = useCategories();
  const category = getCategory(expense.category);
  const CategoryIcon = category.icon;
  const badge = categoryBadge(category);

  const dateLabel = (() => {
    const d = new Date(expense.date);
    if (isToday(d)) return format(d, 'HH:mm');
    if (isYesterday(d)) return 'Yest';
    return format(d, 'd MMM');
  })();

  return (
    <div className="flex min-h-[44px] items-center gap-3 py-1">
      <div
        className={cn(
          'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-none text-sm',
          badge.className,
        )}
        style={badge.style}
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
  categoryChartData: { category: string; amount: number; color: string }[];
  monthlyChartData: Record<string, number | string>[];
  summary: Summary;
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  isAllTime: boolean;
  onToggleAllTime: () => void;
  budgets: Record<string, number>;
  spentByCategory: Record<string, number>;
  onOpenBudgetEditor: () => void;
  dailyChartData: { day: number; label: string; amount: number }[];
  paymentChartData: { method: string; amount: number; fill: string }[];
  spendDelta: { thisTotal: number; lastTotal: number; pct: number | null };
  topMerchants: { description: string; amount: number }[];
  budgetPace: number;
}

/* ------------------------------------------------------------------ */
/* DashboardMobile                                                     */
/* ------------------------------------------------------------------ */

function inrMobile(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export default function DashboardMobile({
  stats,
  expenses,
  categoryChartData,
  monthlyChartData,
  summary,
  monthLabel,
  onPrev,
  onNext,
  canGoNext,
  isAllTime,
  onToggleAllTime,
  budgets,
  spentByCategory,
  onOpenBudgetEditor,
  dailyChartData,
  paymentChartData,
  spendDelta,
  topMerchants,
  budgetPace,
}: DashboardMobileProps) {
  const { categories } = useCategories();
  const categoriesChartConfig = React.useMemo(
    () =>
      categories.reduce((cfg, c) => {
        cfg[c.value] = { label: c.label, color: c.chartColor };
        return cfg;
      }, {} as ChartConfig),
    [categories],
  );

  const recentExpenses = expenses.slice(0, 5);
  const categoryTotal = React.useMemo(
    () => categoryChartData.reduce((sum, d) => sum + d.amount, 0),
    [categoryChartData],
  );

  const budgetCategories = categories.filter((c) => budgets[c.value]);

  const dailyChartConfig: ChartConfig = {
    amount: { label: 'Spent', color: 'hsl(var(--primary))' },
  };

  const paymentChartConfig: ChartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {};
    paymentChartData.forEach((p) => {
      cfg[p.method] = { label: p.method, color: p.fill };
    });
    return cfg;
  }, [paymentChartData]);

  const paymentTotal = paymentChartData.reduce((s, p) => s + p.amount, 0);

  return (
    <div className="flex flex-col gap-3">
      {/* Month switcher */}
      <div className="flex items-center justify-center gap-1 pt-1">
        <button
          type="button"
          onClick={onPrev}
          disabled={isAllTime}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={onToggleAllTime}
          className="font-code text-[0.65rem] uppercase tracking-[0.18em] text-foreground px-2 py-1 rounded-md hover:bg-muted/60 transition-colors min-w-[130px] text-center"
        >
          {monthLabel}
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isAllTime || !canGoNext}
          className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* 2×2 stat grid */}
      <div className="grid grid-cols-2 gap-2">
        {stats.map((stat, i) => {
          const deltaChip =
            i === 0 && spendDelta.pct !== null ? (
              <span
                className={cn(
                  'ml-1 inline-flex items-center gap-0.5 font-code text-[0.55rem]',
                  spendDelta.pct > 0 ? 'text-destructive' : 'text-primary',
                )}
              >
                {spendDelta.pct > 0 ? (
                  <TrendingUp className="h-2.5 w-2.5" />
                ) : (
                  <TrendingDown className="h-2.5 w-2.5" />
                )}
                {spendDelta.pct > 0 ? '▲' : '▼'} {Math.abs(spendDelta.pct).toFixed(1)}%
              </span>
            ) : undefined;
          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              sub={stat.sub}
              tone={stat.tone}
              index={i}
              loading={i === 1 || i === 2 ? summary.loading : false}
              deltaChip={deltaChip}
            />
          );
        })}
      </div>

      {/* Recent entries card */}
      <Card className="anim-rise" style={{ animationDelay: '360ms' }}>
        <CardHeader className="pb-1">
          <CardTitle className="font-headline text-lg font-medium">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent className="pt-1">
          {recentExpenses.length === 0 ? (
            <p className="font-code py-4 text-center text-xs text-muted-foreground">
              No entries for {monthLabel}.
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

      {/* Charts card — tabbed */}
      <Card className="anim-rise" style={{ animationDelay: '450ms' }}>
        <Tabs defaultValue="category">
          <CardHeader className="pb-1">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="font-headline text-lg font-medium">Spending</CardTitle>
                <CardDescription className="font-code text-[0.6rem] uppercase tracking-[0.15em]">
                  {monthLabel}
                </CardDescription>
              </div>
              <TabsList className="h-7 gap-0.5 px-0.5">
                <TabsTrigger
                  value="category"
                  className="font-code h-6 px-1.5 text-[0.55rem] uppercase tracking-[0.1em]"
                >
                  Cat
                </TabsTrigger>
                <TabsTrigger
                  value="monthly"
                  className="font-code h-6 px-1.5 text-[0.55rem] uppercase tracking-[0.1em]"
                >
                  Month
                </TabsTrigger>
                <TabsTrigger
                  value="daily"
                  className="font-code h-6 px-1.5 text-[0.55rem] uppercase tracking-[0.1em]"
                >
                  Daily
                </TabsTrigger>
                <TabsTrigger
                  value="payment"
                  className="font-code h-6 px-1.5 text-[0.55rem] uppercase tracking-[0.1em]"
                >
                  Pay
                </TabsTrigger>
              </TabsList>
            </div>
          </CardHeader>
          <CardContent>
            <TabsContent value="category" className="m-0">
              {categoryChartData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center">
                  <p className="font-code text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    No expenses for {monthLabel}
                  </p>
                </div>
              ) : (
                <ChartContainer config={categoriesChartConfig} className="mx-auto h-[240px] w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="category" />}
                    />
                    <Pie
                      data={categoryChartData}
                      dataKey="amount"
                      nameKey="category"
                      innerRadius={55}
                      outerRadius={82}
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground font-headline text-xl font-semibold tnum"
                                >
                                  ₹{categoryTotal.toLocaleString('en-IN')}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 18}
                                  className="fill-muted-foreground font-code text-[0.55rem] uppercase tracking-[0.2em]"
                                >
                                  total spent
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="category" />}
                      className="flex-wrap gap-x-3 gap-y-1"
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </TabsContent>
            <TabsContent value="monthly" className="m-0">
              {monthlyChartData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center">
                  <p className="font-code text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    No monthly data yet
                  </p>
                </div>
              ) : (
                <ChartContainer config={categoriesChartConfig} className="h-[210px] w-full">
                  <BarChart
                    data={monthlyChartData}
                    accessibilityLayer
                    margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="month"
                      tickLine={false}
                      tickMargin={8}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString('en-IN', { notation: 'compact' })}`
                      }
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      tick={{ fontSize: 10 }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" hideLabel />}
                    />
                    {Object.keys(categoriesChartConfig).map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={`var(--color-${key})`}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              )}
            </TabsContent>
            <TabsContent value="daily" className="m-0">
              {dailyChartData.every((d) => d.amount === 0) ? (
                <div className="flex h-[200px] items-center justify-center">
                  <p className="font-code text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    No daily data for {monthLabel}
                  </p>
                </div>
              ) : (
                <ChartContainer config={dailyChartConfig} className="h-[195px] w-full">
                  <AreaChart
                    data={dailyChartData}
                    margin={{ top: 8, right: 10, bottom: 8, left: 10 }}
                  >
                    <defs>
                      <linearGradient id="dailyGradMobile" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={6}
                      interval={6}
                      tick={{ fontSize: 9 }}
                    />
                    <YAxis
                      tickFormatter={(value) =>
                        `₹${Number(value).toLocaleString('en-IN', { notation: 'compact' })}`
                      }
                      tickLine={false}
                      axisLine={false}
                      tickMargin={4}
                      tick={{ fontSize: 9 }}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent
                        formatter={(value) => [inrMobile(Number(value)), 'Spent']}
                        labelFormatter={(label) => `Day ${label}`}
                      />}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="hsl(var(--primary))"
                      strokeWidth={1.5}
                      fill="url(#dailyGradMobile)"
                      dot={false}
                    />
                  </AreaChart>
                </ChartContainer>
              )}
            </TabsContent>
            <TabsContent value="payment" className="m-0">
              {paymentChartData.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center">
                  <p className="font-code text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                    No payment data for {monthLabel}
                  </p>
                </div>
              ) : (
                <ChartContainer config={paymentChartConfig} className="mx-auto h-[210px] w-full">
                  <PieChart>
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent hideLabel nameKey="method" />}
                    />
                    <Pie
                      data={paymentChartData}
                      dataKey="amount"
                      nameKey="method"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                      strokeWidth={0}
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`pay-cell-m-${index}`} fill={entry.fill} />
                      ))}
                      <Label
                        content={({ viewBox }) => {
                          if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                            return (
                              <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                <tspan
                                  x={viewBox.cx}
                                  y={viewBox.cy}
                                  className="fill-foreground font-headline text-lg font-semibold tnum"
                                >
                                  ₹{paymentTotal.toLocaleString('en-IN')}
                                </tspan>
                                <tspan
                                  x={viewBox.cx}
                                  y={(viewBox.cy || 0) + 16}
                                  className="fill-muted-foreground font-code text-[0.55rem] uppercase tracking-[0.2em]"
                                >
                                  total
                                </tspan>
                              </text>
                            );
                          }
                        }}
                      />
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent nameKey="method" />}
                      className="flex-wrap gap-x-3 gap-y-1"
                    />
                  </PieChart>
                </ChartContainer>
              )}
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>

      {/* Top Merchants card */}
      <Card className="anim-rise" style={{ animationDelay: '500ms' }}>
        <CardHeader className="pb-1">
          <CardTitle className="font-headline text-lg font-medium">Top Merchants</CardTitle>
          <CardDescription className="font-code text-[0.6rem] uppercase tracking-[0.15em]">
            {monthLabel}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-1">
          {topMerchants.length === 0 ? (
            <p className="font-code py-4 text-center text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
              No entries for {monthLabel}
            </p>
          ) : (
            <div>
              {topMerchants.map((m, idx) => (
                <React.Fragment key={m.description}>
                  <div className="flex items-center gap-2.5 py-2">
                    <span className="font-code text-[0.58rem] text-muted-foreground w-4 shrink-0 tnum">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">{m.description}</span>
                    <span className="tnum font-code text-sm shrink-0">
                      {inrMobile(m.amount)}
                    </span>
                  </div>
                  {idx < topMerchants.length - 1 && (
                    <div className="border-b border-dashed border-border/60" />
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budgets section */}
      <Card className="anim-rise" style={{ animationDelay: '540ms' }}>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline text-lg font-medium">Budgets</CardTitle>
            <button
              type="button"
              onClick={onOpenBudgetEditor}
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-1">
          {budgetCategories.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-6">
              <p className="font-code text-[0.62rem] uppercase tracking-[0.2em] text-muted-foreground">
                No budgets set
              </p>
              <Button
                variant="outline"
                size="sm"
                className="font-code text-[0.62rem] uppercase tracking-[0.15em]"
                onClick={onOpenBudgetEditor}
              >
                Set monthly budgets
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {budgetCategories.map((cat) => {
                const Icon = cat.icon;
                const spent = spentByCategory[cat.value] ?? 0;
                const budget = budgets[cat.value];
                const pct = Math.min((spent / budget) * 100, 100);
                const over = spent > budget;
                const overPace = spent > budget * budgetPace;
                return (
                  <div key={cat.value} className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {(() => { const badge = categoryBadge(cat); return (
                        <div className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded', badge.className)} style={badge.style}>
                          <Icon className="h-2.5 w-2.5" />
                        </div>
                        ); })()}
                        <span className="font-code text-[0.6rem] uppercase tracking-[0.12em]">
                          {cat.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={cn('tnum font-code text-[0.58rem]', over ? 'text-destructive' : 'text-muted-foreground')}>
                          ₹{spent.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')}
                        </span>
                        <span className={cn('tnum font-code text-[0.55rem] font-medium', over ? 'text-destructive' : 'text-muted-foreground')}>
                          {Math.round((spent / budget) * 100)}%
                        </span>
                      </div>
                    </div>
                    <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: over ? 'hsl(var(--destructive))' : cat.chartColor,
                        }}
                      />
                      <div
                        className="absolute top-0 h-full w-0.5 bg-foreground/40"
                        style={{ left: `${Math.min(budgetPace * 100, 100)}%` }}
                      />
                    </div>
                    <p className={cn('font-code text-[0.55rem]', overPace ? 'text-destructive' : 'text-muted-foreground')}>
                      {overPace ? 'over pace' : 'on track'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
