
"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, IndianRupee } from "lucide-react";
import { groupData } from "@/lib/data";
import Image from 'next/image';

export default function Groups() {
  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-end">
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groupData.map((group) => (
          <Card key={group.id} className="flex flex-col">
            <CardHeader>
                <Image
                    src={group.imageUrl}
                    alt={group.name}
                    width={400}
                    height={200}
                    className="rounded-lg object-cover aspect-[16/9]"
                    data-ai-hint={group.imageHint}
                />
            </CardHeader>
            <CardContent className="flex-grow">
               <CardTitle className="font-headline">{group.name}</CardTitle>
               <div className="flex -space-x-2 overflow-hidden mt-4">
                {group.members.map((member, index) => (
                  <Avatar key={index} className="inline-block h-8 w-8 rounded-full ring-2 ring-background">
                    <AvatarImage src={member.avatarUrl} data-ai-hint="person avatar" />
                    <AvatarFallback>{member.initials}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between items-center">
              <div className="flex items-center text-sm text-muted-foreground">
                <IndianRupee className="h-4 w-4 mr-1" />
                <span>{group.totalExpenses.toLocaleString()} Total</span>
              </div>
               <Button variant="secondary" size="sm">View</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
