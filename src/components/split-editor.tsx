'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { SplitMethod, SplitMap } from '@/lib/types';
import { computeSplits } from '@/lib/balances';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';

interface SplitEditorProps {
  totalAmount: number;
  members: { uid: string; displayName: string }[];
  value: { method: SplitMethod; splits: SplitMap };
  onChange: (v: { method: SplitMethod; splits: SplitMap }) => void;
  paidBy: string;
  onPaidByChange: (uid: string) => void;
  currentUid: string;
}

const METHODS: { key: SplitMethod; label: string }[] = [
  { key: 'equal', label: 'Equal' },
  { key: 'exact', label: 'Exact' },
  { key: 'percentage', label: '%' },
];

export function SplitEditor({
  totalAmount,
  members,
  value,
  onChange,
  paidBy,
  onPaidByChange,
  currentUid,
}: SplitEditorProps) {
  const { method, splits } = value;
  const memberUids = members.map((m) => m.uid);

  // Local percentage state (kept as string for input display)
  const [pctInputs, setPctInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const uid of memberUids) {
      init[uid] = '';
    }
    return init;
  });

  // Local exact state (kept as string for input display)
  const [exactInputs, setExactInputs] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const uid of memberUids) {
      init[uid] = splits[uid] !== undefined ? String(splits[uid]) : '';
    }
    return init;
  });

  // Recompute & bubble up when equal method or totalAmount/members changes
  useEffect(() => {
    if (method === 'equal' && memberUids.length > 0) {
      const newSplits = computeSplits('equal', totalAmount, memberUids);
      onChange({ method: 'equal', splits: newSplits });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method, totalAmount, memberUids.join(',')]);

  // When method changes, reset local inputs
  useEffect(() => {
    if (method === 'exact') {
      const init: Record<string, string> = {};
      for (const uid of memberUids) {
        init[uid] = splits[uid] !== undefined ? String(splits[uid]) : '';
      }
      setExactInputs(init);
    } else if (method === 'percentage') {
      const init: Record<string, string> = {};
      for (const uid of memberUids) {
        init[uid] = '';
      }
      setPctInputs(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method]);

  const handleMethodChange = useCallback(
    (newMethod: SplitMethod) => {
      if (newMethod === 'equal') {
        const newSplits = computeSplits('equal', totalAmount, memberUids);
        onChange({ method: 'equal', splits: newSplits });
      } else if (newMethod === 'exact') {
        const newSplits = computeSplits('exact', totalAmount, memberUids);
        const initInputs: Record<string, string> = {};
        for (const uid of memberUids) {
          initInputs[uid] = '';
        }
        setExactInputs(initInputs);
        onChange({ method: 'exact', splits: newSplits });
      } else {
        const initPcts: Record<string, string> = {};
        for (const uid of memberUids) {
          initPcts[uid] = '';
        }
        setPctInputs(initPcts);
        const newSplits = computeSplits('percentage', totalAmount, memberUids, {});
        onChange({ method: 'percentage', splits: newSplits });
      }
    },
    [totalAmount, memberUids, onChange],
  );

  const handleExactChange = useCallback(
    (uid: string, raw: string) => {
      setExactInputs((prev) => ({ ...prev, [uid]: raw }));
      const val = parseFloat(raw);
      const safeVal = isNaN(val) ? 0 : val;
      const overrides: Record<string, number> = {};
      for (const id of memberUids) {
        overrides[id] = id === uid ? safeVal : (parseFloat(exactInputs[id] || '0') || 0);
      }
      const newSplits = computeSplits('exact', totalAmount, memberUids, overrides);
      onChange({ method: 'exact', splits: newSplits });
    },
    [exactInputs, memberUids, totalAmount, onChange],
  );

  const handlePctChange = useCallback(
    (uid: string, raw: string) => {
      setPctInputs((prev) => {
        const updated = { ...prev, [uid]: raw };
        const pctOverrides: Record<string, number> = {};
        for (const id of memberUids) {
          pctOverrides[id] = parseFloat(updated[id] || '0') || 0;
        }
        const newSplits = computeSplits('percentage', totalAmount, memberUids, pctOverrides);
        onChange({ method: 'percentage', splits: newSplits });
        return updated;
      });
    },
    [memberUids, totalAmount, onChange],
  );

  // Derived sums
  const exactSum = memberUids.reduce((acc, uid) => {
    return acc + (parseFloat(exactInputs[uid] || '0') || 0);
  }, 0);
  const exactRemaining = Math.round((totalAmount - exactSum) * 100) / 100;

  const pctSum = memberUids.reduce((acc, uid) => {
    return acc + (parseFloat(pctInputs[uid] || '0') || 0);
  }, 0);
  const pctRemaining = Math.round((100 - pctSum) * 100) / 100;

  const equalSplits =
    method === 'equal' && memberUids.length > 0
      ? computeSplits('equal', totalAmount, memberUids)
      : splits;

  if (members.length === 0) {
    return (
      <p className="font-code text-xs text-muted-foreground">No members to split with.</p>
    );
  }

  return (
    <div className="space-y-4">
      {/* Paid by row */}
      <div className="flex items-center gap-3">
        <span className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground shrink-0">
          Paid by
        </span>
        <Select value={paidBy} onValueChange={onPaidByChange}>
          <SelectTrigger className="h-9 flex-1 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.uid} value={m.uid}>
                {m.displayName}
                {m.uid === currentUid ? ' (you)' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Method toggle */}
      <div className="flex rounded-sm border border-border overflow-hidden">
        {METHODS.map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => handleMethodChange(m.key)}
            className={cn(
              'flex-1 py-2 font-code text-xs uppercase tracking-[0.15em] transition-colors',
              method === m.key
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground hover:bg-muted',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* totalAmount=0 guard */}
      {totalAmount === 0 && (
        <p className="font-code text-xs text-muted-foreground italic">Enter an amount first</p>
      )}

      {/* Member rows */}
      {totalAmount > 0 && (
        <div className="space-y-0">
          {members.map((member, idx) => (
            <div
              key={member.uid}
              className={cn(
                'flex min-h-[44px] items-center justify-between gap-3 py-2',
                idx < members.length - 1 && 'border-b border-dashed border-border',
              )}
            >
              <span className="text-sm font-medium flex-1 truncate">
                {member.displayName}
                {member.uid === currentUid ? (
                  <span className="font-code text-[0.55rem] text-muted-foreground ml-1 uppercase tracking-wider">
                    you
                  </span>
                ) : null}
              </span>

              {method === 'equal' && (
                <span className="tnum font-code text-sm text-foreground/80 shrink-0">
                  ₹{(equalSplits[member.uid] ?? 0).toFixed(2)}
                </span>
              )}

              {method === 'exact' && (
                <div className="flex items-center gap-1 shrink-0">
                  <span className="font-headline text-sm text-muted-foreground">₹</span>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={exactInputs[member.uid] ?? ''}
                    onChange={(e) => handleExactChange(member.uid, e.target.value)}
                    className="h-8 w-24 text-right tnum text-sm"
                    placeholder="0.00"
                  />
                </div>
              )}

              {method === 'percentage' && (
                <div className="flex items-center gap-1 shrink-0">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={pctInputs[member.uid] ?? ''}
                    onChange={(e) => handlePctChange(member.uid, e.target.value)}
                    className="h-8 w-20 text-right tnum text-sm"
                    placeholder="0"
                  />
                  <span className="font-code text-xs text-muted-foreground">%</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer: remaining */}
      {totalAmount > 0 && method === 'exact' && (
        <div
          className={cn(
            'font-code text-xs',
            Math.abs(exactRemaining) < 0.01 ? 'text-primary' : 'text-destructive',
          )}
        >
          Remaining ₹{exactRemaining.toFixed(2)}
        </div>
      )}

      {totalAmount > 0 && method === 'percentage' && (
        <div
          className={cn(
            'font-code text-xs',
            Math.abs(pctRemaining) < 0.01 ? 'text-primary' : 'text-destructive',
          )}
        >
          Remaining {pctRemaining.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
