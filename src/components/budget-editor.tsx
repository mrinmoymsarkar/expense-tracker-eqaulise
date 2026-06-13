'use client';

import React from 'react';
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
import { categoryBadge } from '@/lib/data';
import { useCategories } from '@/hooks/use-categories';
import { cn } from '@/lib/utils';

interface BudgetEditorProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

function BudgetEditorBody({ onClose }: { onClose: () => void }) {
  const { profile, updateProfile } = useData();
  const { toast } = useToast();
  const { categories } = useCategories();

  const [values, setValues] = React.useState<Record<string, string>>(() => {
    const b = profile?.budgets ?? {};
    return Object.fromEntries(
      categories.map((c) => [c.value, b[c.value] ? String(b[c.value]) : ''])
    );
  });
  const [pending, setPending] = React.useState(false);

  const handleSave = async () => {
    const budgets: Record<string, number> = {};
    for (const c of categories) {
      const n = parseFloat(values[c.value]);
      if (n > 0) budgets[c.value] = n;
    }
    try {
      setPending(true);
      await updateProfile({ budgets });
      toast({ title: 'Budgets saved' });
      onClose();
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Could not save budgets',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="space-y-4 pb-4">
      <p className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
        Set a monthly ₹ limit per category. Leave empty for no limit.
      </p>
      <div className="space-y-3">
        {categories.map((cat) => {
          const Icon = cat.icon;
          return (
            <div key={cat.value} className="flex items-center gap-3">
              {(() => { const badge = categoryBadge(cat); return (
              <div
                className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-md', badge.className)}
                style={badge.style}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              ); })()}
              <Label className="min-w-[120px] font-code text-[0.65rem] uppercase tracking-[0.15em]">
                {cat.label}
              </Label>
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-3 flex items-center font-headline text-base text-muted-foreground">
                  ₹
                </span>
                <Input
                  inputMode="decimal"
                  placeholder="No limit"
                  value={values[cat.value]}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [cat.value]: e.target.value }))
                  }
                  className="tnum pl-7 font-headline"
                />
              </div>
            </div>
          );
        })}
      </div>
      <Button
        className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90"
        onClick={handleSave}
        disabled={pending}
      >
        Save Budgets
      </Button>
    </div>
  );
}

export function BudgetEditor({ open, onOpenChange }: BudgetEditorProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-[85svh] rounded-t-lg overflow-y-auto">
          <SheetHeader className="mb-3">
            <SheetTitle className="font-headline text-xl">Monthly Budgets</SheetTitle>
            <SheetDescription className="sr-only">
              Set monthly spending limits per category
            </SheetDescription>
          </SheetHeader>
          <BudgetEditorBody onClose={() => onOpenChange(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Monthly Budgets</DialogTitle>
          <DialogDescription className="sr-only">
            Set monthly spending limits per category
          </DialogDescription>
        </DialogHeader>
        <BudgetEditorBody onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
