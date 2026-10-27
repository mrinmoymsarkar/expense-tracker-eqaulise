'use client';

import { useMemo } from 'react';
import type { LucideIcon } from 'lucide-react';
import { categories as builtinCategories, iconMap, FALLBACK_ICON } from '@/lib/data';
import { useData } from '@/components/providers/data-provider';

export interface ResolvedCategory {
  value: string;
  label: string;
  icon: LucideIcon;
  color: string;
  chartColor: string;
  isCustom: boolean;
}

export function useCategories(): { categories: ResolvedCategory[]; getCategory: (value: string) => ResolvedCategory } {
  const { profile } = useData();
  return useMemo(() => {
    const builtin: ResolvedCategory[] = builtinCategories.map((c) => ({
      value: c.value,
      label: c.label,
      icon: c.icon,
      color: c.color,
      chartColor: c.chartColor,
      isCustom: false,
    }));
    const custom: ResolvedCategory[] = (profile?.categories ?? []).map((c) => ({
      value: c.value,
      label: c.label,
      icon: iconMap[c.icon] ?? FALLBACK_ICON,
      color: '',
      chartColor: c.chartColor,
      isCustom: true,
    }));
    const all = [...builtin, ...custom];
    const byValue = new Map(all.map((c) => [c.value, c]));
    // Unknown values (for example a deleted custom category) used to render as the
    // first built-in ("Food & Dining"). Show an explicit Uncategorised category instead.
    const uncategorised: ResolvedCategory = {
      value: 'Uncategorised',
      label: 'Uncategorised',
      icon: FALLBACK_ICON,
      color: '',
      chartColor: '#9ca3af',
      isCustom: false,
    };
    const getCategory = (value: string) => byValue.get(value) ?? uncategorised;
    return { categories: all, getCategory };
  }, [profile?.categories]);
}
