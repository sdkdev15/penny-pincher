
"use client";

import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Trash2, PlusCircle, AlertTriangle, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@/lib/types";
import { useCurrency } from "@/hooks/useCurrency"; 
import { formatCurrency } from "@/lib/utils"; 
import { BASE_CURRENCY_CODE } from "@/lib/constants"; // Added

const categorySchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters long."),
  budget: z.coerce.number().positive({ message: "Budget must be a positive number." }).optional().or(z.literal('')), // Budget is entered in BASE_CURRENCY_CODE
});
type CategoryFormData = z.infer<typeof categorySchema>;

export function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategories();
  const { hasTransactionsForCategory } = useTransactions();
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { currency: displayCurrencyCode, convertAmount } = useCurrency(); 

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "", budget: "" }, // Budget is entered in base currency
  });

  const onSubmit: SubmitHandler<CategoryFormData> = (data) => {
    try {
      const budgetValue = data.budget === '' ? undefined : Number(data.budget); // Stored as base currency
      if (editingCategory) {
        updateCategory(editingCategory.id, data.name, budgetValue);
        toast({ title: "Success", description: "Category updated." });
      } else {
        addCategory(data.name, budgetValue);
        toast({ title: "Success", description: "Category added." });
      }
      form.reset({ name: "", budget: "" });
      setEditingCategory(null);
      setIsFormOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not save category.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    form.setValue("name", category.name);
    form.setValue("budget", category.budget ?? ""); // Budget is in base currency
    setIsFormOpen(true);
  };

const handleDelete = (category: Category) => {
  try {
    if (category.isDefault) {
      toast({
        title: "Action Denied",
        description: "Default categories cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    if (hasTransactionsForCategory(category.id)) {
      toast({
        title: "Action Denied",
        description:
          "Cannot delete category with associated transactions. Please reassign them first or delete those transactions.",
        variant: "destructive",
      });
      return;
    }
    deleteCategory(category.id); // Pass only the category ID
    toast({ title: "Success", description: `Category "${category.name}" deleted.` });
  } catch (error) {
    toast({
      title: "Error",
      description: error instanceof Error ? error.message : "Could not delete category.",
      variant: "destructive",
    });
  }
};

  const openNewCategoryForm = () => {
    form.reset({ name: "", budget: "" });
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-8">
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogTrigger asChild>
          <Button onClick={openNewCategoryForm} className="w-full md:w-auto">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Category
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory ? `Update the details for "${editingCategory.name}".` : `Create a new category. Budgets are in ${BASE_CURRENCY_CODE}.`}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Groceries" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="budget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Budget (Optional, in {BASE_CURRENCY_CODE})</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" placeholder="e.g., 200.000" {...field} step="0.01" className="pl-8" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">Cancel</Button>
                </DialogClose>
                <Button type="submit">
                  {editingCategory ? "Save Changes" : "Add Category"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Your Categories</CardTitle>
          <CardDescription>Manage your transaction categories here. Budgets are monthly (shown in selected display currency).</CardDescription>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No categories found. Add one to get started!</p>
          ) : (
            <ScrollArea className="h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Budget ({displayCurrencyCode})</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => {
                    const budgetInDisplayCurrency = category.budget ? convertAmount(category.budget, displayCurrencyCode) : undefined;
                    return (
                      <TableRow key={category.id}>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell>
                          {budgetInDisplayCurrency ? formatCurrency(budgetInDisplayCurrency, displayCurrencyCode) : <span className="text-muted-foreground">-</span>}
                        </TableCell>
                        <TableCell>
                          {category.isDefault ? (
                            <span className="text-xs text-muted-foreground py-1 px-2 rounded-full bg-muted">Default</span>
                          ) : (
                            <span className="text-xs text-muted-foreground py-1 px-2 rounded-full bg-secondary">Custom</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(category)} className="text-blue-600 hover:text-blue-700">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          {!category.isDefault && (
                             <Dialog>
                              <DialogTrigger asChild>
                                 <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle className="flex items-center">
                                    <AlertTriangle className="h-5 w-5 mr-2 text-destructive" /> Are you sure?
                                  </DialogTitle>
                                  <DialogDescription>
                                    This action cannot be undone. Deleting category "{category.name}" will remove it permanently.
                                    {hasTransactionsForCategory(category.id) && <p className="text-destructive mt-2 font-semibold">This category has associated transactions. Deleting it may cause issues unless transactions are reassigned or deleted.</p>}
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                  <DialogClose asChild>
                                    <Button variant="destructive" onClick={() => handleDelete(category)}>Delete</Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
