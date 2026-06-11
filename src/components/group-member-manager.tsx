"use client";

import React from "react";
import { Check, Copy, Users } from "lucide-react";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useAuth } from "@/components/providers/auth-provider";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Group } from "@/lib/types";

interface GroupMemberManagerProps {
  group: Group;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

function MemberManagerBody({ group }: { group: Group }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [codeCopied, setCodeCopied] = React.useState(false);
  const [msgCopied, setMsgCopied] = React.useState(false);

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

  const copyMessage = async () => {
    const msg = `Join my Equalize group "${group.name}" with code ${group.inviteCode}`;
    try {
      await navigator.clipboard.writeText(msg);
      setMsgCopied(true);
      toast({ title: "Invite message copied" });
      setTimeout(() => setMsgCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "Could not copy" });
    }
  };

  return (
    <div className="space-y-6 py-2">
      {/* Invite code section */}
      <div>
        <p className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Invite Code
        </p>
        <div className="mt-2 rounded-md border border-dashed border-border bg-muted/40 py-4 text-center">
          <span className="font-code text-2xl tracking-[0.3em] text-foreground select-all">
            {group.inviteCode}
          </span>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={copyCode}
          >
            {codeCopied ? (
              <Check className="mr-2 h-3.5 w-3.5" />
            ) : (
              <Copy className="mr-2 h-3.5 w-3.5" />
            )}
            Copy code
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={copyMessage}
          >
            {msgCopied ? (
              <Check className="mr-2 h-3.5 w-3.5" />
            ) : (
              <Users className="mr-2 h-3.5 w-3.5" />
            )}
            Copy invite message
          </Button>
        </div>
      </div>

      {/* Members list */}
      <div>
        <p className="font-code text-[0.6rem] uppercase tracking-[0.2em] text-muted-foreground">
          Members — {Object.keys(group.members).length}
        </p>
        <div className="mt-2 divide-y divide-dashed divide-border">
          {Object.entries(group.members).map(([uid, member]) => {
            const isMe = uid === user?.uid;
            const isOwner = uid === group.createdBy;
            return (
              <div
                key={uid}
                className="flex min-h-[56px] items-center gap-3 py-2"
              >
                <Avatar className="h-9 w-9 shrink-0">
                  {member.photoURL && (
                    <AvatarImage
                      src={member.photoURL}
                      alt={member.displayName}
                      data-ai-hint="person avatar"
                    />
                  )}
                  <AvatarFallback className="text-xs font-medium uppercase">
                    {member.displayName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {member.displayName}
                      {isMe && (
                        <span className="text-muted-foreground"> (you)</span>
                      )}
                    </span>
                    {isOwner && (
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-code text-[0.55rem] uppercase tracking-[0.15em] px-1 py-0",
                          "border-accent text-accent"
                        )}
                      >
                        owner
                      </Badge>
                    )}
                  </div>
                  <p className="truncate font-code text-xs text-muted-foreground">
                    {member.email}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function GroupMemberManager({
  group,
  open,
  onOpenChange,
}: GroupMemberManagerProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="h-[70svh] rounded-t-lg overflow-y-auto"
        >
          <SheetHeader className="mb-2">
            <SheetTitle className="font-headline text-xl">Members</SheetTitle>
            <SheetDescription className="sr-only">
              Manage members and invite code for {group.name}
            </SheetDescription>
          </SheetHeader>
          <MemberManagerBody group={group} />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl">Members</DialogTitle>
          <DialogDescription className="sr-only">
            Manage members and invite code for {group.name}
          </DialogDescription>
        </DialogHeader>
        <MemberManagerBody group={group} />
      </DialogContent>
    </Dialog>
  );
}
