'use client';

import React from 'react';
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
import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Pencil } from 'lucide-react';
import { categoryBadge } from '@/lib/data';
import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';
import type { DisplayExpense } from '@/components/expense-list';
import DashboardMobile from '@/components/dashboard-mobile';
import { useData } from '@/components/providers/data-provider';
import { BudgetEditor } from '@/components/budget-editor';

/* ------------------------------------------------------------------ */
/* Summary type                                                        */
/* ------------------------------------------------------------------ */

interface DashboardSummary {
  youOweTotal: number;
  youAreOwedTotal: number;
  activeGroupCount: number;
  loading: boolean;
  allGroupExpenses?: unknown[];
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

interface DashboardProps {
  expenses: DisplayExpense[];
  summary: DashboardSummary;
}

/* ------------------------------------------------------------------ */
/* Helper: format INR                                                  */
/* ------------------------------------------------------------------ */

function inr(amount: number): string {
  return amount.toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/* ------------------------------------------------------------------ */
/* Helper: month label                                                 */
/* ------------------------------------------------------------------ */

function formatMonthLabel(d: Date): string {
  return d.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
}

function isSameMonth(date: Date, ref: Date): boolean {
  return date.getFullYear() === ref.getFullYear() && date.getMonth() === ref.getMonth();
}

/* ------------------------------------------------------------------ */
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export default function Dashboard({ expenses, summary }: DashboardProps) {
  const { profile } = useData();
  const { categories, getCategory } = useCategories();

  const categoriesChartConfig = React.useMemo(
    () =>
      categories.reduce((cfg, c) => {
        cfg[c.value] = { label: c.label, color: c.chartColor };
        return cfg;
      }, {} as ChartConfig),
    [categories],
  );
  const [selectedMonth, setSelectedMonth] = React.useState<Date | 'all'>(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [budgetEditorOpen, setBudgetEditorOpen] = React.useState(false);

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const isAllTime = selectedMonth === 'all';

  const canGoNext =
    !isAllTime &&
    (selectedMonth.getFullYear() < currentMonthStart.getFullYear() ||
      selectedMonth.getMonth() < currentMonthStart.getMonth());

  const handlePrev = () => {
    if (isAllTime) return;
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() - 1);
    setSelectedMonth(d);
  };

  const handleNext = () => {
    if (isAllTime || !canGoNext) return;
    const d = new Date(selectedMonth);
    d.setMonth(d.getMonth() + 1);
    setSelectedMonth(d);
  };

  const handleToggleAllTime = () => {
    if (isAllTime) {
      setSelectedMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    } else {
      setSelectedMonth('all');
    }
  };

  const monthLabel = isAllTime ? 'All time' : formatMonthLabel(selectedMonth as Date);

  const filteredExpenses = React.useMemo(() => {
    if (isAllTime) return expenses;
    return expenses.filter((e) => isSameMonth(new Date(e.date), selectedMonth as Date));
  }, [expenses, selectedMonth, isAllTime]);

  const categoryChartData = React.useMemo(() => {
    return filteredExpenses.reduce(
      (acc, expense) => {
        const existing = acc.find((item) => item.category === expense.category);
        if (existing) {
          existing.amount += expense.amount;
        } else {
          acc.push({
            category: expense.category,
            amount: expense.amount,
            color: getCategory(expense.category).chartColor,
          });
        }
        return acc;
      },
      [] as { category: string; amount: number; color: string }[],
    );
  }, [filteredExpenses]);

  const categoryTotal = React.useMemo(
    () => categoryChartData.reduce((sum, d) => sum + d.amount, 0),
    [categoryChartData],
  );

  const monthlyChartData = React.useMemo(() => {
    const monthOrder = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const dataByMonth = expenses.reduce(
      (acc, expense) => {
        const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
        if (!acc[month]) acc[month] = { month };
        const prev = acc[month][expense.category];
        acc[month][expense.category] = (typeof prev === 'number' ? prev : 0) + expense.amount;
        return acc;
      },
      {} as Record<string, Record<string, number | string>>,
    );
    return Object.values(dataByMonth).sort(
      (a, b) =>
        monthOrder.indexOf(a.month as string) - monthOrder.indexOf(b.month as string),
    );
  }, [expenses]);

  const totalSpent = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  const stats = [
    {
      label: 'Total Spent',
      value: inr(totalSpent),
      sub: isAllTime ? 'All entries' : monthLabel,
      tone: '',
    },
    {
      label: 'You Owe',
      value: summary.loading ? '—' : inr(summary.youOweTotal),
      sub: `Across ${summary.activeGroupCount} group${summary.activeGroupCount === 1 ? '' : 's'}`,
      tone: 'text-destructive',
    },
    {
      label: 'You Are Owed',
      value: summary.loading ? '—' : inr(summary.youAreOwedTotal),
      sub: 'with open balances',
      tone: 'text-primary',
    },
    {
      label: 'Active Groups',
      value: String(summary.activeGroupCount),
      sub: 'with open balances',
      tone: '',
    },
  ];

  const budgets = profile?.budgets ?? {};
  const budgetCategories = categories.filter((c) => budgets[c.value]);

  const budgetRefMonth = isAllTime ? currentMonthStart : (selectedMonth as Date);
  const budgetExpenses = React.useMemo(() => {
    return expenses.filter((e) => isSameMonth(new Date(e.date), budgetRefMonth));
  }, [expenses, budgetRefMonth]);

  const spentByCategory = React.useMemo(() => {
    return budgetExpenses.reduce((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + e.amount;
      return acc;
    }, {} as Record<string, number>);
  }, [budgetExpenses]);

  const monthSwitcher = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={handlePrev}
        disabled={isAllTime}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-30"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={handleToggleAllTime}
        className="font-code text-[0.65rem] uppercase tracking-[0.18em] text-foreground px-2 py-1 rounded-md hover:bg-muted/60 transition-colors min-w-[120px] text-center"
      >
        {monthLabel}
      </button>
      <button
        type="button"
        onClick={handleNext}
        disabled={isAllTime || !canGoNext}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-30"
      >
        <ChevronRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <div className="grid gap-6">
      <BudgetEditor open={budgetEditorOpen} onOpenChange={setBudgetEditorOpen} />

      {/* Mobile layout */}
      <div className="md:hidden">
        <DashboardMobile
          stats={stats}
          expenses={filteredExpenses}
          categoryChartData={categoryChartData}
          summary={summary}
          monthLabel={monthLabel}
          onPrev={handlePrev}
          onNext={handleNext}
          canGoNext={canGoNext}
          isAllTime={isAllTime}
          onToggleAllTime={handleToggleAllTime}
          budgets={budgets}
          spentByCategory={spentByCategory}
          onOpenBudgetEditor={() => setBudgetEditorOpen(true)}
        />
      </div>

      {/* Desktop layout */}
      <div className="hidden md:grid md:gap-6">
        {/* 4-stat row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, i) => (
            <Card
              key={stat.label}
              className="anim-rise relative overflow-hidden"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 right-2 select-none font-headline text-7xl font-light italic text-foreground/[0.06]"
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <CardHeader className="pb-2">
                <CardTitle className="font-code text-[0.65rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn('tnum font-headline text-3xl font-semibold', stat.tone)}>
                  {stat.value}
                </div>
                <p className="mt-3 border-t border-dashed pt-2 font-code text-xs text-muted-foreground">
                  {stat.sub}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts card */}
        <Card className="anim-rise" style={{ animationDelay: '360ms' }}>
          <Tabs defaultValue="category">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="font-headline text-2xl font-medium">
                    Spending Overview
                  </CardTitle>
                  <CardDescription>
                    View your expenses by category or over time.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  {monthSwitcher}
                  <TabsList>
                    <TabsTrigger value="category">By Category</TabsTrigger>
                    <TabsTrigger value="monthly">By Month</TabsTrigger>
                  </TabsList>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="category" className="m-0">
                {categoryChartData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="font-code text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                      No expenses for {monthLabel}
                    </p>
                  </div>
                ) : (
                  <ChartContainer config={categoriesChartConfig} className="mx-auto aspect-square h-[300px]">
                    <PieChart>
                      <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent hideLabel nameKey="category" />}
                      />
                      <Pie
                        data={categoryChartData}
                        dataKey="amount"
                        nameKey="category"
                        innerRadius={70}
                        outerRadius={105}
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
                                    className="fill-foreground font-headline text-2xl font-semibold tnum"
                                  >
                                    ₹{categoryTotal.toLocaleString('en-IN')}
                                  </tspan>
                                  <tspan
                                    x={viewBox.cx}
                                    y={(viewBox.cy || 0) + 22}
                                    className="fill-muted-foreground font-code text-[0.6rem] uppercase tracking-[0.2em]"
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
                        className="flex-wrap gap-x-4 gap-y-1"
                      />
                    </PieChart>
                  </ChartContainer>
                )}
              </TabsContent>
              <TabsContent value="monthly" className="m-0">
                {monthlyChartData.length === 0 ? (
                  <div className="flex h-[300px] items-center justify-center">
                    <p className="font-code text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                      No monthly data yet
                    </p>
                  </div>
                ) : (
                  <ChartContainer config={categoriesChartConfig} className="h-[300px] w-full">
                    <BarChart
                      data={monthlyChartData}
                      accessibilityLayer
                      margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                    >
                      <CartesianGrid vertical={false} />
                      <XAxis
                        dataKey="month"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                      />
                      <YAxis
                        tickFormatter={(value) =>
                          `₹${Number(value).toLocaleString('en-IN', { notation: 'compact' })}`
                        }
                        tickLine={false}
                        axisLine={false}
                        tickMargin={10}
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
            </CardContent>
          </Tabs>
        </Card>

        {/* Budgets card */}
        <Card className="anim-rise" style={{ animationDelay: '450ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-headline text-2xl font-medium">Budgets</CardTitle>
                <CardDescription className="font-code text-[0.6rem] uppercase tracking-[0.15em]">
                  {isAllTime ? formatMonthLabel(currentMonthStart) : monthLabel}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setBudgetEditorOpen(true)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {budgetCategories.length === 0 ? (
              <div className="flex flex-col items-center gap-3 rounded-md border border-dashed border-border py-8">
                <p className="font-code text-[0.65rem] uppercase tracking-[0.2em] text-muted-foreground">
                  No budgets set
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="font-code text-[0.65rem] uppercase tracking-[0.15em]"
                  onClick={() => setBudgetEditorOpen(true)}
                >
                  Set monthly budgets
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {budgetCategories.map((cat) => {
                  const Icon = cat.icon;
                  const spent = spentByCategory[cat.value] ?? 0;
                  const budget = budgets[cat.value];
                  const pct = Math.min((spent / budget) * 100, 100);
                  const over = spent > budget;
                  return (
                    <div key={cat.value} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          {(() => { const badge = categoryBadge(cat); return (
                          <div className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded', badge.className)} style={badge.style}>
                            <Icon className="h-3 w-3" />
                          </div>
                          ); })()}
                          <span className="font-code text-[0.65rem] uppercase tracking-[0.15em]">
                            {cat.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={cn('tnum font-code text-[0.65rem]', over ? 'text-destructive' : 'text-muted-foreground')}>
                            ₹{spent.toLocaleString('en-IN')} / ₹{budget.toLocaleString('en-IN')}
                          </span>
                          <span className={cn('tnum font-code text-[0.6rem] font-medium', over ? 'text-destructive' : 'text-muted-foreground')}>
                            {Math.round((spent / budget) * 100)}%
                          </span>
                        </div>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: over ? 'hsl(var(--destructive))' : cat.chartColor,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
