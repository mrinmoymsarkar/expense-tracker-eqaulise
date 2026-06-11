"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Plus, QrCode } from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

/* ── Create group form ─────────────────────────────────────────── */

function CreateGroupForm({
  setOpen,
  addGroup,
}: {
  setOpen: (open: boolean) => void;
  addGroup: (group: { name: string }) => Promise<void>;
}) {
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ variant: "destructive", title: "Group name is required" });
      return;
    }
    try {
      setPending(true);
      await addGroup({ name: name.trim() });
      toast({ title: "Group created" });
      setOpen(false);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Could not create group",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="font-headline text-xl">
          New Group
        </DialogTitle>
        <DialogDescription className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Start splitting expenses with friends
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-1.5">
          <Label
            htmlFor="group-name"
            className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground"
          >
            Group name
          </Label>
          <Input
            id="group-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Goa Trip '25"
            disabled={pending}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          variant="outline"
          type="button"
          onClick={() => setOpen(false)}
          disabled={pending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create
        </Button>
      </DialogFooter>
    </form>
  );
}

/* ── Join with code dialog ─────────────────────────────────────── */

function JoinGroupDialog({
  joinGroupByCode,
}: {
  joinGroupByCode: (code: string) => Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) {
      toast({ variant: "destructive", title: "Enter an invite code" });
      return;
    }
    try {
      setPending(true);
      await joinGroupByCode(trimmed);
      toast({ title: "Joined group" });
      setOpen(false);
      setCode("");
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Could not join group",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <QrCode className="mr-2 h-4 w-4" />
          Join with code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="font-headline text-xl">
              Join a group
            </DialogTitle>
            <DialogDescription className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Enter the 8-character invite code
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              disabled={pending}
              className="font-code text-center text-lg tracking-widest"
              autoComplete="off"
              spellCheck={false}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => setOpen(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={pending}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Join
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ── Empty state ───────────────────────────────────────────────── */

function EmptyGroups({
  addGroup,
  joinGroupByCode,
}: {
  addGroup: (group: { name: string }) => Promise<void>;
  joinGroupByCode: (code: string) => Promise<void>;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="anim-rise flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-dashed border-border p-8 text-center">
      <p className="font-headline text-xl font-medium">No groups yet</p>
      <p className="mt-1 max-w-xs font-code text-[0.65rem] uppercase tracking-[0.15em] text-muted-foreground">
        Create a group or join with a code to start splitting
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <CreateGroupForm setOpen={setCreateOpen} addGroup={addGroup} />
          </DialogContent>
        </Dialog>
        <JoinGroupDialog joinGroupByCode={joinGroupByCode} />
      </div>
    </div>
  );
}

/* ── Main component ────────────────────────────────────────────── */

export default function Groups({
  groups,
  addGroup,
  joinGroupByCode,
  onSelectGroup,
}: {
  groups: Group[];
  addGroup: (group: { name: string }) => Promise<void>;
  joinGroupByCode: (code: string) => Promise<void>;
  onSelectGroup: (group: Group) => void;
}) {
  const [createOpen, setCreateOpen] = React.useState(false);

  return (
    <div className="grid gap-6">
      {/* Header row */}
      <div className="flex items-center justify-end gap-2">
        <JoinGroupDialog joinGroupByCode={joinGroupByCode} />
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <CreateGroupForm setOpen={setCreateOpen} addGroup={addGroup} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state */}
      {groups.length === 0 && (
        <EmptyGroups addGroup={addGroup} joinGroupByCode={joinGroupByCode} />
      )}

      {/* Cards grid */}
      {groups.length > 0 && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((group, i) => {
            const memberValues = Object.values(group.members);
            const visible = memberValues.slice(0, 5);
            const overflow = memberValues.length - visible.length;

            return (
              <Card
                key={group.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectGroup(group)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") onSelectGroup(group);
                }}
                className={cn(
                  "anim-rise group/card flex cursor-pointer flex-col overflow-hidden transition-all duration-300",
                  "hover:-translate-y-1 hover:border-foreground/25 hover:shadow-[0_12px_32px_-16px_hsl(var(--foreground)/0.35)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                )}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Cover image */}
                <div className="relative border-b">
                  <Image
                    src={group.imageUrl}
                    alt={group.name}
                    width={400}
                    height={175}
                    className="aspect-[16/7] w-full object-cover saturate-[0.85] transition-all duration-300 group-hover/card:saturate-100 md:aspect-[16/9]"
                    data-ai-hint={group.imageHint}
                  />
                </div>

                <CardContent className="flex-grow pt-4">
                  <CardTitle className="font-headline text-xl font-medium">
                    {group.name}
                  </CardTitle>

                  {/* Member avatars */}
                  <div className="mt-3 flex items-center">
                    <div className="flex -space-x-2 overflow-hidden">
                      {visible.map((member, idx) => (
                        <Avatar
                          key={idx}
                          className="inline-block h-8 w-8 rounded-full ring-2 ring-card"
                        >
                          {member.photoURL && (
                            <AvatarImage
                              src={member.photoURL}
                              alt={member.displayName}
                              data-ai-hint="person avatar"
                            />
                          )}
                          <AvatarFallback className="text-[0.6rem] font-medium uppercase">
                            {member.displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                    {overflow > 0 && (
                      <span className="ml-2 font-code text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                        +{overflow} more
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex items-center justify-between border-t border-dashed pt-4">
                  <span className="tnum font-code text-sm text-muted-foreground">
                    ₹{group.totalExpenses.toLocaleString()} total
                  </span>
                  <span className="font-code text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground">
                    View ledger →
                  </span>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
