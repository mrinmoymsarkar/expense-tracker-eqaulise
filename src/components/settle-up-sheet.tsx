"use client";

import React from "react";
import { format } from "date-fns";
import { Loader2, Scale, Smartphone } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useAuth } from "@/components/providers/auth-provider";
import { useGroupBalances } from "@/hooks/use-group-balances";
import { useSettlements } from "@/hooks/use-settlements";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Group, SettlementTransaction, SettlementMethod } from "@/lib/types";

interface SettleUpSheetProps {
  group: Group;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preselect?: SettlementTransaction | null;
}

function SettleUpBody({
  group,
  preselect,
  onClose,
}: {
  group: Group;
  preselect?: SettlementTransaction | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const uid = user?.uid ?? "";
  const { settlementPlan, loading: balLoading } = useGroupBalances(group);
  const { settlements, recordSettlement } = useSettlements(group.id);
  const { toast } = useToast();

  const [selected, setSelected] = React.useState<SettlementTransaction | null>(
    preselect ?? null
  );
  const [amountStr, setAmountStr] = React.useState(
    preselect ? String(preselect.amount) : ""
  );
  const [note, setNote] = React.useState("");
  const [method, setMethod] = React.useState<SettlementMethod>("UPI");
  const [pending, setPending] = React.useState(false);

  // Sync preselect changes
  React.useEffect(() => {
    if (preselect) {
      setSelected(preselect);
      setAmountStr(String(preselect.amount));
    }
  }, [preselect]);

  // Only show plan rows involving the current user
  const myTransactions = settlementPlan.filter(
    (t) => t.fromUid === uid || t.toUid === uid
  );

  const handleSelect = (txn: SettlementTransaction) => {
    setSelected(txn);
    setAmountStr(String(txn.amount));
  };

  const handleRecord = async () => {
    if (!selected) return;
    const amount = parseFloat(amountStr);
    if (!amount || amount <= 0) {
      toast({ variant: "destructive", title: "Enter a valid amount" });
      return;
    }
    try {
      setPending(true);
      await recordSettlement({
        fromUid: selected.fromUid,
        toUid: selected.toUid,
        amount,
        method,
        note: note.trim(),
      });
      toast({ title: "Settlement recorded" });
      onClose();
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "Could not record settlement",
        description: err instanceof Error ? err.message : "Unknown error",
      });
    } finally {
      setPending(false);
    }
  };

  const getMemberName = (memberUid: string) =>
    memberUid === uid
      ? "You"
      : (group.members[memberUid]?.displayName ?? "Unknown");

  const parsedAmount = parseFloat(amountStr) || 0;

  // UPI deep-link when payer and counterparty has upiId
  const upiLink = React.useMemo(() => {
    if (!selected || selected.fromUid !== uid) return null;
    const toMember = group.members[selected.toUid];
    const upiId = toMember?.upiId;
    if (!upiId) return null;
    const name = toMember.displayName;
    const amount = parsedAmount > 0 ? parsedAmount : selected.amount;
    return `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(name)}&am=${amount}&cu=INR&tn=${encodeURIComponent("Equalize settlement")}`;
  }, [selected, uid, group.members, parsedAmount]);

  const toUpiMember =
    selected && selected.fromUid === uid
      ? group.members[selected.toUid]
      : null;

  return (
    <div className="space-y-5 pb-4">
      {/* Step 1: Who to settle with */}
      <div>
        <p className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Who are you settling with?
        </p>
        {balLoading ? (
          <div className="mt-2 space-y-2">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-14 animate-pulse rounded-md bg-muted"
              />
            ))}
          </div>
        ) : myTransactions.length === 0 ? (
          <p className="mt-3 font-code text-sm text-muted-foreground">
            You&apos;re all settled in this group.
          </p>
        ) : (
          <div className="mt-2 space-y-2">
            {myTransactions.map((txn, i) => {
              const isSelected =
                selected?.fromUid === txn.fromUid &&
                selected?.toUid === txn.toUid;
              const isPayer = txn.fromUid === uid;
              const otherUid = isPayer ? txn.toUid : txn.fromUid;
              const otherMember = group.members[otherUid];
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelect(txn)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
                    isSelected
                      ? "border-accent bg-accent/10"
                      : "border-border hover:bg-muted/50"
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    {otherMember?.photoURL && (
                      <AvatarImage
                        src={otherMember.photoURL}
                        alt={otherMember.displayName}
                        data-ai-hint="person avatar"
                      />
                    )}
                    <AvatarFallback className="text-xs uppercase">
                      {(otherMember?.displayName ?? "?").slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-grow">
                    <p className="text-sm font-medium">
                      {isPayer
                        ? `You pay ${getMemberName(txn.toUid)}`
                        : `${getMemberName(txn.fromUid)} pays you`}
                    </p>
                  </div>
                  <span className="tnum shrink-0 font-headline text-base font-semibold">
                    ₹{txn.amount.toLocaleString()}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2 & 3: Amount + Note */}
      {selected && (
        <div className="space-y-3">
          <div>
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Amount
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute inset-y-0 left-3 flex items-center font-headline text-2xl text-muted-foreground">
                ₹
              </span>
              <Input
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="tnum pl-8 font-headline text-3xl h-14"
              />
            </div>
          </div>

          <div>
            <Label className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
              Note (optional)
            </Label>
            <Input
              className="mt-1.5"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g., GPay 11 Jun"
            />
          </div>

          {/* UPI deep-link if payer and counterparty has upiId */}
          {selected.fromUid === uid && (
            <div>
              {upiLink ? (
                <div className="space-y-2">
                  <Button
                    asChild
                    className="w-full bg-accent text-accent-foreground hover:bg-accent/90 h-12"
                  >
                    <a href={upiLink}>
                      <Smartphone className="mr-2 h-4 w-4" />
                      Pay ₹{parsedAmount > 0 ? parsedAmount.toLocaleString() : selected.amount.toLocaleString()} via UPI
                    </a>
                  </Button>
                  <p className="font-code text-[0.6rem] uppercase tracking-[0.15em] text-muted-foreground text-center">
                    After paying, record it below
                  </p>
                </div>
              ) : (
                toUpiMember && (
                  <div className="rounded-md border border-dashed border-border p-3 text-center">
                    <p className="font-code text-[0.65rem] text-muted-foreground">
                      {toUpiMember.displayName} hasn&apos;t added a UPI ID yet — ask them to add it in Settings.
                    </p>
                  </div>
                )
              )}
            </div>
          )}

          {/* Method toggle + Record button */}
          <div className="space-y-2">
            <div className="flex gap-2">
              {(["UPI", "Cash"] as SettlementMethod[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  className={cn(
                    "flex-1 rounded-md border py-1.5 font-code text-xs uppercase tracking-[0.15em] transition-colors",
                    method === m
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {m}
                </button>
              ))}
            </div>

            <Button
              className="w-full h-12 bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={handleRecord}
              disabled={pending || parsedAmount <= 0}
            >
              {pending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Scale className="mr-2 h-4 w-4" />
              )}
              Record ₹{parsedAmount > 0 ? parsedAmount.toLocaleString() : "–"} — {method}
            </Button>
          </div>
        </div>
      )}

      {/* Settlement history */}
      {settlements.length > 0 && (
        <div>
          <p className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
            History
          </p>
          <div className="mt-2 divide-y divide-dashed divide-border">
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
                    <span className="font-code text-[0.6rem] text-muted-foreground">
                      {s.date
                        ? format(s.date.toDate(), "d MMM")
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function SettleUpSheet({
  group,
  open,
  onOpenChange,
  preselect,
}: SettleUpSheetProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[85svh] rounded-t-lg overflow-y-auto"
        >
          <SheetHeader className="mb-2">
            <SheetTitle className="font-headline text-xl">Settle Up</SheetTitle>
            <SheetDescription className="sr-only">
              Record a settlement for {group.name}
            </SheetDescription>
          </SheetHeader>
          <SettleUpBody
            group={group}
            preselect={preselect}
            onClose={() => onOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Settle Up</DialogTitle>
          <DialogDescription className="sr-only">
            Record a settlement for {group.name}
          </DialogDescription>
        </DialogHeader>
        <SettleUpBody
          group={group}
          preselect={preselect}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
