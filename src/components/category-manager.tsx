'use client';

import React, { useState } from 'react';
import { Pencil, Trash2, Tags } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useData } from '@/components/providers/data-provider';
import { useToast } from '@/hooks/use-toast';
import { iconMap, FALLBACK_ICON } from '@/lib/data';
import { CategoryEditor } from '@/components/category-editor';

type CustomCategory = { value: string; label: string; icon: string; chartColor: string };

export default function CategoryManager() {
  const { profile, updateProfile } = useData();
  const { toast } = useToast();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomCategory | null>(null);

  const customCategories = profile?.categories ?? [];

  const handleAdd = () => {
    setEditTarget(null);
    setEditorOpen(true);
  };

  const handleEdit = (cat: CustomCategory) => {
    setEditTarget(cat);
    setEditorOpen(true);
  };

  const handleDelete = async (value: string, label: string) => {
    try {
      await updateProfile({
        categories: customCategories.filter((c) => c.value !== value),
      });
      toast({ title: `"${label}" removed` });
    } catch (err: unknown) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  };

  return (
    <>
      <Card>
        <div className="flex items-center justify-between border-b border-dashed border-border px-6 py-4">
          <div>
            <h2 className="font-headline text-2xl font-medium">Custom Categories</h2>
            <p className="text-sm text-muted-foreground">Your own spending categories.</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-accent text-accent-foreground hover:bg-accent/90"
            size="sm"
          >
            <Tags className="mr-2 h-4 w-4" />
            Add category
          </Button>
        </div>

        <CardContent className="pt-2">
          {customCategories.length === 0 ? (
            <div className="mt-4 flex flex-col items-center justify-center rounded-sm border border-dashed border-border py-10 text-center">
              <Tags className="mb-3 h-8 w-8 text-muted-foreground/40" />
              <p className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
                No custom categories yet — add your own like Groceries or Rent.
              </p>
            </div>
          ) : (
            <div>
              {customCategories.map((cat) => {
                const Icon = iconMap[cat.icon] ?? FALLBACK_ICON;
                return (
                  <div
                    key={cat.value}
                    className="flex items-center gap-3 border-b border-dashed border-border/60 py-3 last:border-0"
                  >
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm"
                      style={{ backgroundColor: cat.chartColor + '26', color: cat.chartColor }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>

                    <p className="min-w-0 flex-1 text-sm font-medium">{cat.label}</p>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleEdit(cat)}
                      aria-label="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{cat.label}"?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Existing expenses tagged with this category will still show it, but new expenses cannot use it.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDelete(cat.value, cat.label)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CategoryEditor
        open={editorOpen}
        onOpenChange={(o) => {
          setEditorOpen(o);
          if (!o) setEditTarget(null);
        }}
        editing={editTarget}
      />
    </>
  );
}
