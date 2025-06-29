
"use client";

import React, { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Sparkles,
  Upload,
  Loader2,
  Users,
  Percent,
  IndianRupee,
} from "lucide-react";
import { categories, expenseData, getCategoryIcon } from "@/lib/data";
import { getSplitSuggestion } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

const ExpenseForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const [description, setDescription] = useState("");
  const [numPeople, setNumPeople] = useState(2);
  const [suggestion, setSuggestion] = useState<{ method?: string; reasoning?: string } | null>(null);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleSuggestion = () => {
    if (!description || numPeople < 2) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please provide a description and at least 2 people.",
      });
      return;
    }

    startTransition(async () => {
      const result = await getSplitSuggestion({ description, numPeople });
      if (result.error) {
        toast({
          variant: "destructive",
          title: "AI Suggestion Failed",
          description: result.error,
        });
      } else {
        setSuggestion(result);
      }
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogDescription>
          Enter the details of your expense below.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="description" className="text-right">
            Description
          </Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="col-span-3" placeholder="e.g., Dinner at BBQ Nation" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="amount" className="text-right">
            Amount
          </Label>
          <Input id="amount" type="number" className="col-span-3" placeholder="e.g., 3000" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="category" className="text-right">
            Category
          </Label>
          <Select>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => {
                const CategoryIcon = getCategoryIcon(category.value);
                return (
                  <SelectItem key={category.value} value={category.value}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4" />
                      <span>{category.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="receipt" className="text-right">
            Receipt
          </Label>
          <Button variant="outline" className="col-span-3 justify-start font-normal text-muted-foreground">
            <Upload className="mr-2 h-4 w-4" />
            Upload an image
          </Button>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="notes" className="text-right">
            Notes
          </Label>
          <Textarea id="notes" className="col-span-3" placeholder="Add any extra details..." />
        </div>
        
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Split Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="people" className="text-right">
                People
                </Label>
                <Input id="people" type="number" value={numPeople} onChange={(e) => setNumPeople(Number(e.target.value))} className="col-span-3" />
            </div>
            
            <Button onClick={handleSuggestion} disabled={isPending} className="w-full">
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Suggest Split Method
            </Button>
            
            {suggestion && (
              <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
                <h4 className="font-semibold text-sm">AI Suggestion: <span className="text-primary">{suggestion.method}</span></h4>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.reasoning}</p>
              </div>
            )}
            
            <div className="mt-2 grid grid-cols-3 gap-2">
                <Button variant="outline"><IndianRupee className="mr-2 h-4 w-4"/>Equal</Button>
                <Button variant="outline"><Users className="mr-2 h-4 w-4"/>Amounts</Button>
                <Button variant="outline"><Percent className="mr-2 h-4 w-4"/>Percentage</Button>
            </div>
          </CardContent>
        </Card>

      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
        <Button type="submit">Add Expense</Button>
      </DialogFooter>
    </>
  );
};

export default function Expenses() {
  const [open, setOpen] = useState(false);

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
            <ExpenseForm setOpen={setOpen} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Group</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenseData.map((expense) => {
                const CategoryIcon = getCategoryIcon(expense.category);
                return (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {expense.description}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="flex w-fit items-center gap-2">
                        <CategoryIcon className="h-4 w-4" />
                        <span>{expense.category}</span>
                      </Badge>
                    </TableCell>
                    <TableCell>{expense.date}</TableCell>
                    <TableCell>{expense.group}</TableCell>
                    <TableCell className="text-right font-mono">
                      ₹{expense.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
