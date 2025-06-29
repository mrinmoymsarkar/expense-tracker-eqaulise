
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
import Image from 'next/image';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";

const CreateGroupForm = ({ setOpen, addGroup }: { setOpen: (open: boolean) => void, addGroup: (group: any) => void }) => {
  const [name, setName] = React.useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      toast({
        variant: "destructive",
        title: "Group name is required",
      });
      return;
    }
    const newGroup = {
      name,
      imageUrl: "https://placehold.co/400x200.png",
      imageHint: "group image",
    };
    addGroup(newGroup);
    setOpen(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Create New Group</DialogTitle>
        <DialogDescription>
          Start a new group to share expenses with friends.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Name
          </Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="col-span-3"
            placeholder="e.g., Goa Trip '25"
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" type="button" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit">Create Group</Button>
      </DialogFooter>
    </form>
  );
};

export default function Groups({ groups, addGroup, onSelectGroup }: { groups: any[], addGroup: (group: any) => void, onSelectGroup: (group: any) => void }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <CreateGroupForm setOpen={setOpen} addGroup={addGroup} />
          </DialogContent>
        </Dialog>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {groups.map((group) => (
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
               <Button variant="secondary" size="sm" onClick={() => onSelectGroup(group)}>View</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
