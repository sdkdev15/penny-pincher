
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { format, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { CalendarIcon, PlusCircle, Edit3 } from "lucide-react";
import type { Transaction, TransactionType } from "@/lib/types";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BASE_CURRENCY_CODE } from "@/lib/constants"; // Added

const transactionFormSchema = z.object({
  amount: z.coerce.number().positive({ message: "Amount must be positive." }),
  type: z.enum(["income", "expense"], { required_error: "Transaction type is required." }),
  categoryId: z.string().min(1, { message: "Category is required." }),
  date: z.date({ required_error: "Date is required." }),
  notes: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionFormSchema>;

interface TransactionFormProps {
  transactionToEdit?: Transaction;
  onFormSubmit?: () => void; // Callback for when form is submitted successfully (e.g. to close a dialog)
}

export function TransactionForm({ transactionToEdit, onFormSubmit }: TransactionFormProps) {
  const { categoryOptions } = useCategories();
  const { addTransaction, updateTransaction } = useTransactions();
  const { toast } = useToast();

  const defaultValues = transactionToEdit
    ? {
        amount: transactionToEdit.amount, // Amount is stored in base currency
        type: transactionToEdit.type,
        categoryId: transactionToEdit.categoryId,
        date: parseISO(transactionToEdit.date), 
        notes: transactionToEdit.notes || "",
      }
    : {
        amount: "" as unknown as number, 
        type: "expense" as TransactionType,
        categoryId: "",
        date: new Date(),
        notes: "",
      };

  const form = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues,
  });

  const onSubmit = (data: TransactionFormValues) => {
    try {
      // Amount is entered and stored in BASE_CURRENCY_CODE (USD)
      const transactionData = {
        ...data,
        amount: Number(data.amount), // Ensure it's a number
        date: format(data.date, "yyyy-MM-dd"),
      };

      if (transactionToEdit) {
        updateTransaction(transactionToEdit.id, transactionData);
        toast({ title: "Success!", description: "Transaction updated successfully." });
      } else {
        addTransaction(transactionData);
        toast({ title: "Success!", description: "Transaction added successfully." });
        form.reset({ 
          amount: "" as unknown as number, 
          type: "expense" as TransactionType,
          categoryId: "",
          date: new Date(),
          notes: "",
        });
      }
      if (onFormSubmit) onFormSubmit();
    } catch (error) {
      const message = error instanceof Error ? error.message : "An unknown error occurred.";
      toast({ title: "Error", description: message, variant: "destructive" });
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {transactionToEdit ? <Edit3 className="h-6 w-6 text-primary" /> : <PlusCircle className="h-6 w-6 text-primary" />}
          {transactionToEdit ? "Edit Transaction" : "Add New Transaction"}
        </CardTitle>
        <CardDescription>
          {transactionToEdit ? "Update the details of your transaction." : `Enter transaction details. Amounts are in ${BASE_CURRENCY_CODE}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount ({BASE_CURRENCY_CODE})</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 50.000" {...field} step="0.01" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="income" />
                          </FormControl>
                          <FormLabel className="font-normal">Income</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="expense" />
                          </FormControl>
                          <FormLabel className="font-normal">Expense</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categoryOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                     <Button variant="link" type="button" className="p-0 h-auto text-sm" asChild>
                        <a href="/categories?action=add" target="_blank" rel="noopener noreferrer">Manage Categories</a>
                    </Button>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Dinner with friends" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full md:w-auto" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (transactionToEdit ? "Saving..." : "Adding...") : (transactionToEdit ? "Save Changes" : "Add Transaction")}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
