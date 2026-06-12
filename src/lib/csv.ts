import { format } from 'date-fns';
import type { DisplayExpense } from '@/components/expense-list';

function escapeCsvField(value: string): string {
  if (/[,"\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function exportExpensesCsv(expenses: DisplayExpense[], filename?: string): void {
  const today = format(new Date(), 'yyyy-MM-dd');
  const resolvedFilename = filename ?? `equalize-expenses-${today}.csv`;

  const headers = ['Date', 'Description', 'Category', 'Tags', 'Group', 'Payment Method', 'Notes', 'Amount (INR)'];

  const rows = expenses.map((e) => [
    format(new Date(e.date), 'dd-MM-yyyy'),
    e.description,
    e.category,
    (e.tags ?? []).join('; '),
    e.group,
    e.paymentMethod,
    e.notes,
    e.amount.toFixed(2),
  ]);

  const csvLines = [headers, ...rows]
    .map((row) => row.map(escapeCsvField).join(','))
    .join('\r\n');

  const BOM = '﻿';
  const blob = new Blob([BOM + csvLines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = resolvedFilename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
