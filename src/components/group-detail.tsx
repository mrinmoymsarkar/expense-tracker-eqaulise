
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, IndianRupee, Scale } from "lucide-react";
import Image from 'next/image';
import { Separator } from "./ui/separator";

const settlementData = [
    {
        from: { name: "Ravi K.", avatarUrl: "https://placehold.co/40x40.png" },
        to: { name: "You", avatarUrl: "https://placehold.co/40x40.png" },
        amount: 850,
    },
    {
        from: { name: "Anjali V.", avatarUrl: "https://placehold.co/40x40.png" },
        to: { name: "You", avatarUrl: "https://placehold.co/40x40.png" },
        amount: 1200,
    },
    {
        from: { name: "You", avatarUrl: "https://placehold.co/40x40.png" },
        to: { name: "Priya G.", avatarUrl: "https://placehold.co/40x40.png" },
        amount: 500,
    }
]

export default function GroupDetail({ group, onBack }: { group: any, onBack: () => void }) {
  const youAreOwed = 2050;
  const youOwe = 500;
  const totalBalance = youAreOwed - youOwe;

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Back</span>
        </Button>
        <div className="flex items-center gap-4 min-w-0">
            <Image
                src={group.imageUrl}
                alt={group.name}
                width={64}
                height={64}
                className="rounded-lg object-cover aspect-square shrink-0"
                data-ai-hint={group.imageHint}
            />
            <div className="min-w-0">
                <h1 className="text-2xl font-bold font-headline truncate">{group.name}</h1>
                <div className="flex items-center text-sm text-muted-foreground">
                    <IndianRupee className="h-4 w-4 mr-1 shrink-0" />
                    <span className="truncate">{group.totalExpenses.toLocaleString()} in total expenses</span>
                </div>
            </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Your total balance</CardDescription>
                <CardTitle className={`text-2xl font-headline ${totalBalance >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                    {totalBalance >= 0 ? `₹${totalBalance.toLocaleString()}` : `-₹${Math.abs(totalBalance).toLocaleString()}`}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-xs text-muted-foreground truncate">
                    You are owed ₹{youAreOwed.toLocaleString()}, and you owe ₹{youOwe.toLocaleString()}
                </div>
            </CardContent>
        </Card>
        <Card>
            <CardHeader className="pb-2">
                <CardDescription>Members</CardDescription>
                 <CardTitle className="text-2xl font-headline">{group.members.length}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex -space-x-2 overflow-hidden">
                    {group.members.map((member: any, index: number) => (
                      <Avatar key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                        <AvatarImage src={member.avatarUrl} data-ai-hint="person avatar" />
                        <AvatarFallback>{member.initials}</AvatarFallback>
                      </Avatar>
                    ))}
                  </div>
            </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Group Balances</CardTitle>
          <CardDescription>
            A summary of who owes whom in the group. Use "Settle Up" to simplify debts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {settlementData.map((s, index) => (
                <div key={index}>
                    <div className="flex items-center justify-between gap-2">
                         <div className="flex items-center gap-2 min-w-0">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={s.from.avatarUrl} data-ai-hint="person avatar" />
                                <AvatarFallback>{s.from.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-sm truncate">{s.from.name}</span>
                        </div>
                        <div className="flex flex-col items-center text-center text-muted-foreground px-2">
                            <span className="text-xs">owes</span>
                             <span className="font-mono text-sm text-foreground font-semibold whitespace-nowrap">₹{s.amount.toLocaleString()}</span>
                        </div>
                         <div className="flex items-center gap-2 justify-end min-w-0">
                            <span className="font-medium text-sm text-right truncate">{s.to.name}</span>
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage src={s.to.avatarUrl} data-ai-hint="person avatar" />
                                <AvatarFallback>{s.to.name.substring(0, 2)}</AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                     {index < settlementData.length - 1 && <Separator className="mt-4"/>}
                </div>
            ))}
          </div>
          <Button className="w-full mt-6">
            <Scale className="mr-2 h-4 w-4" />
            Settle Up
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
