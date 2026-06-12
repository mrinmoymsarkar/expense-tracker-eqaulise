"use client";

import React from "react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Check,
  Copy,
  IndianRupee,
  MessageCircle,
  Scale,
  Users,
} from "lucide-react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useGroupExpenses } from "@/hooks/use-group-expenses";
import { useSettlements } from "@/hooks/use-settlements";
import { useGroupBalances } from "@/hooks/use-group-balances";
import { useToast } from "@/hooks/use-toast";
import { getCategory } from "@/lib/data";
import { cn } from "@/lib/utils";
import { GroupMemberManager } from "@/components/group-member-manager";
import { SettleUpSheet } from "@/components/settle-up-sheet";
import type { Group, SettlementTransaction } from "@/lib/types";

export default function GroupDetail({
  group,
  onBack,
}: {
  group: Group;
  onBack: () => void;
}) {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const { toast } = useToast();

  const { expenses, loading: expLoading } = useGroupExpenses(group.id);
  const { settlements, loading: settleLoading } = useSettlements(group.id);
  const {
    settlementPlan,
    youOwe,
    youAreOwed,
    loading: balLoading,
  } = useGroupBalances(group);

  const [membersOpen, setMembersOpen] = React.useState(false);
  const [settleOpen, setSettleOpen] = React.useState(false);
  const [settlePreselect, setSettlePreselect] =
    React.useState<SettlementTransaction | null>(null);
  const [codeCopied, setCodeCopied] = React.useState(false);

  const totalBalance = youAreOwed - youOwe;
  const memberValues = Object.values(group.members);
  const loading = expLoading || settleLoading || balLoading;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(group.inviteCode);
      setCodeCopied(true);
      toast({ title: "Code copied" });
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "Could not copy" });
    }
  };

  const getMemberName = (memberUid: string) =>
    memberUid === uid
      ? "You"
      : (group.members[memberUid]?.displayName ?? "Unknown");

  const openSettleFor = (txn: SettlementTransaction) => {
    setSettlePreselect(txn);
    setSettleOpen(true);
  };

  const openSettleGeneral = () => {
    setSettlePreselect(null);
    setSettleOpen(true);
  };

  return (
    <div className="grid gap-6">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onBack}
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>

        <div className="flex min-w-0 flex-grow items-center gap-3">
          <Image
            src={group.imageUrl}
            alt={group.name}
            width={56}
            height={56}
            className="aspect-square h-14 w-14 shrink-0 rounded-lg object-cover"
            data-ai-hint={group.imageHint}
          />
          <div className="min-w-0">
            <h1 className="truncate font-headline text-2xl font-medium sm:text-3xl">
              {group.name}
            </h1>
            <div className="flex items-center font-code text-sm text-muted-foreground">
              <IndianRupee className="mr-1 h-3.5 w-3.5 shrink-0" />
              <span className="tnum truncate">
                {group.totalExpenses.toLocaleString()} in total expenses
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons in header */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMembersOpen(true)}
          >
            <Users className="mr-1.5 h-3.5 w-3.5" />
            Members
          </Button>

          <button
            type="button"
            onClick={copyCode}
            className={cn(
              "flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1 transition-colors",
              "font-code text-xs tracking-widest text-muted-foreground hover:border-foreground/40 hover:text-foreground"
            )}
          >
            <span>{group.inviteCode}</span>
            {codeCopied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

      {/* ── Balance cards ──────────────────────────────── */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="anim-rise">
          <CardHeader className="pb-2">
            <CardDescription className="font-code text-[0.65rem] uppercase tracking-[0.2em]">
              Your total balance
            </CardDescription>
            {balLoading ? (
              <Skeleton className="h-9 w-32" />
            ) : (
              <CardTitle
                className={cn(
                  "tnum font-headline text-3xl font-semibold",
                  totalBalance >= 0 ? "text-primary" : "text-destructive"
                )}
              >
                {totalBalance >= 0
                  ? `₹${totalBalance.toLocaleString()}`
                  : `-₹${Math.abs(totalBalance).toLocaleString()}`}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {balLoading ? (
              <Skeleton className="h-4 w-48" />
            ) : (
              <div className="truncate border-t border-dashed pt-2 font-code text-xs text-muted-foreground">
                <span className="tnum">
                  You are owed ₹{youAreOwed.toLocaleString()}, and you owe ₹
                  {youOwe.toLocaleString()}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="anim-rise" style={{ animationDelay: "90ms" }}>
          <CardHeader className="pb-2">
            <CardDescription className="font-code text-[0.65rem] uppercase tracking-[0.2em]">
              Members
            </CardDescription>
            <CardTitle className="tnum font-headline text-3xl font-semibold">
              {memberValues.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex -space-x-2 overflow-hidden">
              {memberValues.slice(0, 6).map((member, idx) => (
                <Avatar
                  key={idx}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-background"
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
          </CardContent>
        </Card>
      </div>

      {/* ── Group balances ─────────────────────────────── */}
      <Card className="anim-rise" style={{ animationDelay: "180ms" }}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl font-medium">
            Group Balances
          </CardTitle>
          <CardDescription className="font-code text-[0.6rem] uppercase tracking-[0.15em]">
            Who owes whom — simplified
          </CardDescription>
        </CardHeader>
        <CardContent>
          {balLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-12 w-full" />
              ))}
            </div>
          ) : settlementPlan.length === 0 ? (
            <p className="font-code text-sm text-muted-foreground">
              All settled up ✓
            </p>
          ) : (
            <div className="divide-y divide-dashed divide-border">
              {settlementPlan.map((s, idx) => {
                const isCurrentUserPayer = s.fromUid === uid;
                return (
                  <div
                    key={idx}
                    className="flex min-h-[44px] items-center justify-between gap-2 py-2"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[0.6rem] uppercase">
                          {getMemberName(s.fromUid).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium">
                        {getMemberName(s.fromUid)}
                      </span>
                    </div>

                    <div className="flex shrink-0 flex-col items-center px-1 text-center text-muted-foreground">
                      <span className="font-code text-[0.6rem] uppercase tracking-[0.2em]">
                        owes
                      </span>
                      <span className="tnum font-headline text-sm font-semibold text-foreground">
                        ₹{s.amount.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-2 justify-end">
                      <span className="truncate text-right text-sm font-medium">
                        {getMemberName(s.toUid)}
                      </span>
                      <Avatar className="h-7 w-7 shrink-0">
                        <AvatarFallback className="text-[0.6rem] uppercase">
                          {getMemberName(s.toUid).slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {isCurrentUserPayer && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="ml-1 h-7 px-2 font-code text-[0.6rem] uppercase tracking-[0.1em]"
                          onClick={() => openSettleFor(s)}
                        >
                          Settle
                        </Button>
                      )}
                      {s.toUid === uid && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-1 h-7 px-2 font-code text-[0.6rem] uppercase tracking-[0.1em]"
                          onClick={() => {
                            const me = group.members[uid];
                            const them = group.members[s.fromUid];
                            const amountStr = s.amount.toLocaleString("en-IN");
                            const msg =
                              `Hi ${them?.displayName?.split(" ")[0] ?? "there"}! Gentle reminder from Equalize: ₹${amountStr} pending for "${group.name}".` +
                              (me?.upiId ? ` You can pay me via UPI: ${me.upiId}` : "");
                            window.open(
                              `https://wa.me/?text=${encodeURIComponent(msg)}`,
                              "_blank",
                              "noopener"
                            );
                          }}
                        >
                          <MessageCircle className="h-3 w-3" />
                          <span className="ml-1">Remind</span>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Full-width Settle Up CTA */}
          <Button
            className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90 h-11"
            onClick={openSettleGeneral}
          >
            <Scale className="mr-2 h-4 w-4" />
            Settle Up
          </Button>
        </CardContent>
      </Card>

      {/* ── Expense entries ────────────────────────────── */}
      <Card className="anim-rise" style={{ animationDelay: "270ms" }}>
        <CardHeader>
          <CardTitle className="font-headline text-2xl font-medium">
            Entries
          </CardTitle>
          <CardDescription className="font-code text-[0.6rem] uppercase tracking-[0.15em]">
            Group expense log — newest first
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-14 w-full" />
              ))}
            </div>
          ) : expenses.length === 0 ? (
            <p className="font-code text-sm text-muted-foreground">
              No entries yet — add the first expense.
            </p>
          ) : (
            <div className="divide-y divide-dashed divide-border">
              {expenses.map((exp) => {
                const cat = getCategory(exp.category);
                const CatIcon = cat.icon;
                const paidByName = getMemberName(exp.paidBy);
                return (
                  <div
                    key={exp.id}
                    className="flex items-center gap-3 py-3"
                  >
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
                        cat.color
                      )}
                    >
                      <CatIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-grow">
                      <p className="truncate text-sm font-medium">
                        {exp.description}
                      </p>
                      <p className="font-code text-[0.6rem] uppercase tracking-[0.1em] text-muted-foreground">
                        Paid by {paidByName} ·{" "}
                        {exp.date
                          ? format(exp.date.toDate(), "PP")
                          : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="tnum font-headline text-base font-semibold">
                        ₹{exp.amount.toLocaleString()}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-code text-[0.55rem] uppercase tracking-[0.1em] px-1 py-0",
                          cat.color
                        )}
                      >
                        {cat.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Settlement history ─────────────────────────── */}
      {settlements.length > 0 && (
        <Card className="anim-rise" style={{ animationDelay: "360ms" }}>
          <CardHeader>
            <CardTitle className="font-headline text-xl font-medium text-muted-foreground">
              Settlement History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-dashed divide-border">
              {settlements.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-2 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {getMemberName(s.fromUid)}
                      </span>{" "}
                      paid{" "}
                      <span className="font-medium text-foreground">
                        {getMemberName(s.toUid)}
                      </span>
                    </p>
                    {s.note && (
                      <p className="truncate font-code text-xs text-muted-foreground">
                        {s.note}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="tnum font-headline text-sm font-semibold">
                      ₹{s.amount.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className="font-code text-[0.55rem] uppercase tracking-[0.1em] px-1 py-0"
                      >
                        {s.method}
                      </Badge>
                      {s.date && (
                        <span className="font-code text-[0.6rem] text-muted-foreground">
                          {format(s.date.toDate(), "d MMM")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Modals ─────────────────────────────────────── */}
      <GroupMemberManager
        group={group}
        open={membersOpen}
        onOpenChange={setMembersOpen}
      />

      <SettleUpSheet
        group={group}
        open={settleOpen}
        onOpenChange={(o) => {
          setSettleOpen(o);
          if (!o) setSettlePreselect(null);
        }}
        preselect={settlePreselect}
      />
    </div>
  );
}
