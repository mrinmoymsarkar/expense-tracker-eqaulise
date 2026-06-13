'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useData } from '@/components/providers/data-provider';
import { useIsMobile } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { categories as builtinCategories, iconMap, customColorPalette, builtinChartColors } from '@/lib/data';
import { cn } from '@/lib/utils';

interface CategoryEditorProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing?: { value: string; label: string; icon: string; chartColor: string } | null;
}

const ICON_ENTRIES = Object.entries(iconMap);

function pickDefaultColor(
  profile: { categories?: Array<{ chartColor: string }> } | null,
  editingColor?: string,
): string {
  const used = new Set([
    ...builtinChartColors,
    ...(profile?.categories ?? []).map((c) => c.chartColor),
  ]);
  if (editingColor) used.delete(editingColor);

  const palette = customColorPalette.find((hex) => !used.has(hex));
  if (palette) return palette;

  let n = (profile?.categories?.length ?? 0);
  let color = `hsl(${(n * 137.5) % 360} 65% 60%)`;
  while (used.has(color)) {
    n += 1;
    color = `hsl(${(n * 137.5) % 360} 65% 60%)`;
  }
  return color;
}

function CategoryEditorBody({
  onClose,
  editing,
}: {
  onClose: () => void;
  editing?: { value: string; label: string; icon: string; chartColor: string } | null;
}) {
  const { profile, updateProfile } = useData();
  const { toast } = useToast();

  const defaultIcon = editing?.icon ?? ICON_ENTRIES[0]?.[0] ?? '';
  const defaultColor = useMemo(
    () => (editing ? editing.chartColor : pickDefaultColor(profile, undefined)),
    [],
  );

  const [label, setLabel] = useState(editing?.label ?? '');
  const [icon, setIcon] = useState(defaultIcon);
  const [chartColor, setChartColor] = useState(defaultColor);
  const [pending, setPending] = useState(false);

  const used = useMemo(() => {
    const s = new Set([
      ...builtinChartColors,
      ...(profile?.categories ?? []).map((c) => c.chartColor),
    ]);
    if (editing?.chartColor) s.delete(editing.chartColor);
    return s;
  }, [profile?.categories, editing?.chartColor]);

  const handleSave = async () => {
    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      toast({ variant: 'destructive', title: 'Label is required' });
      return;
    }

    const builtinLabels = builtinCategories.map((c) => c.label.toLowerCase());
    const customLabels = (profile?.categories ?? [])
      .filter((c) => !editing || c.value !== editing.value)
      .map((c) => c.label.toLowerCase());

    if (builtinLabels.includes(trimmedLabel.toLowerCase()) || customLabels.includes(trimmedLabel.toLowerCase())) {
      toast({ variant: 'destructive', title: 'A category with that name already exists' });
      return;
    }

    if (used.has(chartColor)) {
      toast({ variant: 'destructive', title: 'That color is already in use' });
      return;
    }

    try {
      setPending(true);
      if (editing) {
        const next = (profile?.categories ?? []).map((c) =>
          c.value === editing.value ? { ...c, label: trimmedLabel, icon, chartColor } : c,
        );
        await updateProfile({ categories: next });
        toast({ title: 'Category updated' });
      } else {
        const value = 'c_' + crypto.randomUUID().slice(0, 8);
        await updateProfile({
          categories: [
            ...(profile?.categories ?? []),
            { value, label: trimmedLabel, icon, chartColor },
          ],
        });
        toast({ title: 'Category added' });
      }
      onClose();
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Could not save category',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-5 pb-4">
      <div className="space-y-1.5">
        <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Label
        </Label>
        <Input
          placeholder="e.g. Groceries"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Icon
        </Label>
        <div className="grid grid-cols-7 gap-1.5">
          {ICON_ENTRIES.map(([name, Icon]) => (
            <button
              key={name}
              type="button"
              onClick={() => setIcon(name)}
              className={cn(
                'flex h-9 w-full items-center justify-center rounded-sm border transition-colors',
                icon === name
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 hover:border-border',
              )}
              aria-label={name}
            >
              <Icon className="h-4 w-4" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Color
        </Label>
        <div className="flex flex-wrap gap-2">
          {customColorPalette.map((hex) => {
            const isUsed = used.has(hex);
            const isSelected = chartColor === hex;
            return (
              <button
                key={hex}
                type="button"
                disabled={isUsed}
                onClick={() => !isUsed && setChartColor(hex)}
                className={cn(
                  'h-7 w-7 rounded-sm border-2 transition-all',
                  isUsed ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
                  isSelected ? 'border-foreground scale-110' : 'border-transparent',
                )}
                style={{ backgroundColor: hex }}
                aria-label={hex}
              />
            );
          })}
        </div>
      </div>

      <Button
        className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90"
        onClick={handleSave}
        disabled={pending}
      >
        {editing ? 'Save Changes' : 'Add Category'}
      </Button>
    </div>
  );
}

export function CategoryEditor({ open, onOpenChange, editing }: CategoryEditorProps) {
  const isMobile = useIsMobile();
  const title = editing ? 'Edit Category' : 'New Category';

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85svh] rounded-t-lg overflow-y-auto">
          <SheetHeader className="mb-3">
            <SheetTitle className="font-headline text-xl">{title}</SheetTitle>
            <SheetDescription className="sr-only">
              {editing ? 'Edit an existing custom category' : 'Create a new custom category'}
            </SheetDescription>
          </SheetHeader>
          <CategoryEditorBody onClose={() => onOpenChange(false)} editing={editing} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {editing ? 'Edit an existing custom category' : 'Create a new custom category'}
          </DialogDescription>
        </DialogHeader>
        <CategoryEditorBody onClose={() => onOpenChange(false)} editing={editing} />
      </DialogContent>
    </Dialog>
  );
}
