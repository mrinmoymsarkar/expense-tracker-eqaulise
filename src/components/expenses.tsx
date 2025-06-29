
"use client";

import React, { useState, useTransition, useRef } from "react";
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
import { categories, getCategory } from "@/lib/data";
import { getSplitSuggestion, processReceipt } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { cn } from "@/lib/utils";

const ExpenseForm = ({ setOpen, addExpense, groups }: { setOpen: (open: boolean) => void, addExpense: (expense: any) => void, groups: any[] }) => {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [group, setGroup] = useState("");
  const [notes, setNotes] = useState("");
  const [numPeople, setNumPeople] = useState(2);
  const [suggestion, setSuggestion] = useState<{ method?: string; reasoning?: string } | null>(null);
  const [isSuggesting, startSuggestionTransition] = useTransition();
  const [isScanning, setIsScanning] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSuggestion = () => {
    if (!description || numPeople < 2) {
      toast({
        variant: "destructive",
        title: "Invalid Input",
        description: "Please provide a description and at least 2 people.",
      });
      return;
    }

    startSuggestionTransition(async () => {
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

  const handleReceiptUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
        toast({
            variant: "destructive",
            title: "Invalid File Type",
            description: "Please upload an image file.",
        });
        return;
    }

    setIsScanning(true);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
        const receiptDataUri = reader.result as string;
        const result = await processReceipt({ receiptDataUri });

        if (result.error || !result.data) {
            toast({
                variant: "destructive",
                title: "Receipt Scan Failed",
                description: result.error || "Could not extract details from the receipt.",
            });
        } else {
            const { description, amount, category } = result.data;
            setDescription(description);
            setAmount(amount.toString());
            
            const isValidCategory = categories.some(c => c.value === category);
            if (isValidCategory) {
              setCategory(category);
            }

            toast({
                title: "Receipt Scanned!",
                description: "Expense details have been filled in.",
            });
        }
        setIsScanning(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };
    reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file.",
        });
        setIsScanning(false);
    };
};
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !category) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill out the description, amount, and category.",
      });
      return;
    }

    const selectedGroup = groups.find(g => g.id === group);

    addExpense({
      description,
      amount: parseFloat(amount),
      category,
      group: selectedGroup ? selectedGroup.name : "",
      date: new Date().toISOString().split('T')[0],
      notes,
    });
    setOpen(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle>Add New Expense</DialogTitle>
        <DialogDescription>
          Enter the details of your expense below. You can also scan a receipt to autofill.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-center sm:gap-x-4">
          <Label htmlFor="receipt" className="sm:text-right">
            Receipt
          </Label>
          <Input
            id="receipt"
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleReceiptUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="sm:col-span-3 justify-start font-normal text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            type="button"
          >
            {isScanning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {isScanning ? 'Scanning...' : 'Upload & Scan Receipt'}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-center sm:gap-x-4">
          <Label htmlFor="description" className="sm:text-right">
            Description
          </Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="sm:col-span-3" placeholder="e.g., Dinner at BBQ Nation" />
        </div>
        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-center sm:gap-x-4">
          <Label htmlFor="amount" className="sm:text-right">
            Amount
          </Label>
          <Input id="amount" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="sm:col-span-3" placeholder="e.g., 3000" />
        </div>
        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-center sm:gap-x-4">
          <Label htmlFor="category" className="sm:text-right">
            Category
          </Label>
          <Select onValueChange={setCategory} value={category}>
            <SelectTrigger className="sm:col-span-3">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => {
                const CategoryIcon = cat.icon;
                return (
                  <SelectItem key={cat.value} value={cat.value}>
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4" />
                      <span>{cat.label}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
         <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-center sm:gap-x-4">
          <Label htmlFor="group" className="sm:text-right">
            Group
          </Label>
          <Select onValueChange={setGroup} value={group}>
            <SelectTrigger className="sm:col-span-3">
              <SelectValue placeholder="Select a group (optional)" />
            </SelectTrigger>
            <SelectContent>
              {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id}>
                    {g.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-start sm:gap-x-4">
          <Label htmlFor="notes" className="pt-2 sm:text-right">
            Notes
          </Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="sm:col-span-3" placeholder="Add any extra details..." />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Split Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid grid-cols-1 gap-y-2 sm:grid-cols-4 sm:items-center sm:gap-x-4">
                <Label htmlFor="people" className="sm:text-right">
                People
                </Label>
                <Input id="people" type="number" value={numPeople} onChange={(e) => setNumPeople(Number(e.target.value))} className="sm:col-span-3" />
            </div>
            
            <Button onClick={handleSuggestion} disabled={isSuggesting} className="w-full" type="button">
              {isSuggesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Suggest Split Method
            </Button>
            
            {suggestion && (
              <div className="mt-4 rounded-lg border bg-secondary/50 p-4">
                <h4 className="font-semibold text-sm">AI Suggestion: <span className="text-primary">{suggestion.method}</span></h4>
                <p className="text-sm text-muted-foreground mt-1">{suggestion.reasoning}</p>
              </div>
            )}
            
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Button variant="outline" type="button"><IndianRupee className="mr-2 h-4 w-4"/>Equal</Button>
                <Button variant="outline" type="button"><Users className="mr-2 h-4 w-4"/>Amounts</Button>
                <Button variant="outline" type="button"><Percent className="mr-2 h-4 w-4"/>Percentage</Button>
            </div>
          </CardContent>
        </Card>

      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setOpen(false)} type="button">Cancel</Button>
        <Button type="submit">Add Expense</Button>
      </DialogFooter>
    </form>
  );
};

export default function Expenses({ expenses, groups, addExpense }: { expenses: any[], groups: any[], addExpense: (expense: any) => void }) {
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
          <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl max-h-[90vh] overflow-y-auto">
            <ExpenseForm setOpen={setOpen} addExpense={addExpense} groups={groups} />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table */}
          <div className="hidden md:block">
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
                {expenses.map((expense) => {
                  const category = getCategory(expense.category);
                  const CategoryIcon = category.icon;
                  return (
                    <TableRow key={expense.id}>
                      <TableCell className="font-medium">
                        {expense.description}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("w-fit items-center gap-2 border-transparent", category.color)}>
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
          </div>

          {/* Mobile Card List */}
          <div className="grid gap-4 md:hidden">
            {expenses.map((expense) => {
              const category = getCategory(expense.category);
              const CategoryIcon = category.icon;
              return (
                <div key={expense.id} className="rounded-lg border p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <span className="font-medium pr-2 break-words">{expense.description}</span>
                    <span className="font-mono font-semibold text-lg whitespace-nowrap">
                      ₹{expense.amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-muted-foreground">
                    <Badge className={cn("w-fit items-center gap-1.5 py-1 px-2 border-transparent", category.color)}>
                      <CategoryIcon className="h-3.5 w-3.5" />
                      <span className="text-xs">{expense.category}</span>
                    </Badge>
                    <span>{expense.date}</span>
                  </div>
                  {expense.group && (
                    <div className="text-xs text-muted-foreground">
                      Group: <span className="font-medium">{expense.group}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
