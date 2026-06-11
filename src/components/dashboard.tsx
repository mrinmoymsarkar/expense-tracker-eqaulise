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
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { categories } from '@/lib/data';
import { cn } from '@/lib/utils';
import type { DisplayExpense } from '@/components/expense-list';
import DashboardMobile from '@/components/dashboard-mobile';

/* ------------------------------------------------------------------ */
/* Chart configs                                                       */
/* ------------------------------------------------------------------ */

const categoryChartConfig = {
  amount: {
    label: 'Amount',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

const categoryColors = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const monthlyChartConfig = categories.reduce((config, category, index) => {
  config[category.value] = {
    label: category.label,
    color: categoryColors[index % categoryColors.length],
  };
  return config;
}, {} as ChartConfig);

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
/* Dashboard                                                           */
/* ------------------------------------------------------------------ */

export default function Dashboard({ expenses, summary }: DashboardProps) {
  const categoryChartData = React.useMemo(() => {
    return expenses.reduce(
      (acc, expense) => {
        const existing = acc.find((item) => item.category === expense.category);
        if (existing) {
          existing.amount += expense.amount;
        } else {
          acc.push({ category: expense.category, amount: expense.amount });
        }
        return acc;
      },
      [] as { category: string; amount: number }[],
    );
  }, [expenses]);

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

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  /* Build stats array (shared by desktop + mobile) */
  const stats = [
    {
      label: 'Total Spent',
      value: inr(totalSpent),
      sub: 'All entries',
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

  return (
    <div className="grid gap-6">
      {/* Mobile layout */}
      <div className="md:hidden">
        <DashboardMobile
          stats={stats}
          expenses={expenses}
          categoryChartData={categoryChartData}
          summary={summary}
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
                <TabsList>
                  <TabsTrigger value="category">By Category</TabsTrigger>
                  <TabsTrigger value="monthly">By Month</TabsTrigger>
                </TabsList>
              </div>
            </CardHeader>
            <CardContent>
              <TabsContent value="category" className="m-0">
                <ChartContainer config={categoryChartConfig} className="h-[300px] w-full">
                  <BarChart
                    data={categoryChartData}
                    accessibilityLayer
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="category"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                      tickFormatter={(value) => value.slice(0, 3)}
                    />
                    <YAxis
                      tickFormatter={(value) => `₹${value}`}
                      tickLine={false}
                      axisLine={false}
                      tickMargin={10}
                    />
                    <ChartTooltip
                      cursor={false}
                      content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="amount" fill="var(--color-amount)" radius={4} />
                  </BarChart>
                </ChartContainer>
              </TabsContent>
              <TabsContent value="monthly" className="m-0">
                <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
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
                    {Object.keys(monthlyChartConfig).map((key) => (
                      <Bar
                        key={key}
                        dataKey={key}
                        fill={`var(--color-${key})`}
                        stackId="a"
                      />
                    ))}
                  </BarChart>
                </ChartContainer>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
