
"use client";

import { useState, useMemo, useEffect } from "react";
import { format, parseISO } from "date-fns";
import type { Transaction, TransactionType, Category } from "@/lib/types";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions } from "@/hooks/useTransactions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, Edit, Filter, Calendar as CalendarIcon, Search, Download, FileText } from "lucide-react";
import { TransactionForm } from "./TransactionForm";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { cn, formatCurrency } from "@/lib/utils"; 
import { ScrollArea } from "../ui/scroll-area";
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { APP_NAME, BASE_CURRENCY_CODE } from "@/lib/constants";
import { useCurrency } from "@/hooks/useCurrency"; 

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable: { finalY: number }; // Add this line
  }
}

// Transaction amounts are in base currency
function convertToCSV(data: Transaction[], getCategoryNameById: (id: string) => string, displayCurrencyCode: string, convertAmountFunc: (amountInBase: number, targetCurrency: string) => number) {
  const headers = ["ID", "Date", "Category", "Type", `Amount (${displayCurrencyCode})`, "Notes", "Created At"];
  const rows = data.map(transaction => {
    const amountInDisplayCurrency = convertAmountFunc(transaction.amount, displayCurrencyCode);
    return [
      transaction.id,
      transaction.date,
      getCategoryNameById(transaction.categoryId),
      transaction.type,
      amountInDisplayCurrency.toFixed(2), // Amount in display currency
      transaction.notes || "",
      transaction.createdAt,
    ];
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

export function TransactionListClient() {
  const { transactions, deleteTransaction } = useTransactions();
  const { getCategoryNameById, categoryOptions, categories } = useCategories(); // Added categories
  const { toast } = useToast();
  const { currency: displayCurrencyCode, convertAmount } = useCurrency(); 

  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDateRange, setFilterDateRange] = useState<DateRange | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState<string>("");
  
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const typeMatch = filterType === "all" || transaction.type === filterType;
      const categoryMatch = filterCategory === "all" || transaction.categoryId === filterCategory;
      
      let dateMatch = true;
      if (filterDateRange?.from) {
        dateMatch = new Date(transaction.date) >= filterDateRange.from;
      }
      if (filterDateRange?.to && dateMatch) { 
        const toDate = new Date(filterDateRange.to);
        toDate.setHours(23, 59, 59, 999);
        dateMatch = new Date(transaction.date) <= toDate;
      }

      const searchLower = searchTerm.toLowerCase();
      const notesMatch = transaction.notes?.toLowerCase().includes(searchLower) ?? false;
      const categoryNameMatch = getCategoryNameById(transaction.categoryId).toLowerCase().includes(searchLower);
      const amountMatch = transaction.amount.toString().includes(searchTerm); 
      const searchOverallMatch = searchTerm === "" || notesMatch || categoryNameMatch || amountMatch;

      return typeMatch && categoryMatch && dateMatch && searchOverallMatch;
    });
  }, [transactions, filterType, filterCategory, filterDateRange, searchTerm, getCategoryNameById]);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this transaction?")) {
      deleteTransaction(id);
      toast({ title: "Success", description: "Transaction deleted." });
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };
  
  const closeFormDialog = () => {
    setIsFormOpen(false);
    setEditingTransaction(undefined);
  }
  
  useEffect(() => {
    if (filterDateRange?.from && !filterDateRange.to) {
      // Optional: Auto-set 'to' date to be same as 'from'
      // setFilterDateRange({ from: filterDateRange.from, to: filterDateRange.from });
    }
  }, [filterDateRange]);

  const handleExportCSV = () => {
    const csvData = convertToCSV(filteredTransactions, getCategoryNameById, displayCurrencyCode, convertAmount);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `pennypincher_transactions_${displayCurrencyCode}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({title: "Success", description: "Transactions exported to CSV."})
    } else {
        toast({title: "Error", description: "CSV export not supported in your browser.", variant: "destructive"})
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`${APP_NAME} Transaction Report`, 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Generated on: ${format(new Date(), "PPP p")}`, 14, 30);
    doc.text(`Currency: ${displayCurrencyCode}`, 14, 35)

    let filterText = "Filters Applied:\n";
    filterText += `  Period: ${filterDateRange?.from ? `${format(filterDateRange.from, "MMM dd, yyyy")} - ${filterDateRange.to ? format(filterDateRange.to, "MMM dd, yyyy") : 'Present'}` : 'All Time'}\n`;
    filterText += `  Type: ${filterType === 'all' ? 'All' : filterType.charAt(0).toUpperCase() + filterType.slice(1)}\n`;
    filterText += `  Category: ${filterCategory === 'all' ? 'All' : getCategoryNameById(filterCategory)}\n`;
    filterText += `  Search: ${searchTerm || 'None'}`;
    
    doc.setFontSize(10);
    doc.text(filterText, 14, 45); 

    const tableColumn = ["Date", "Category", "Type", `Amount (${displayCurrencyCode})`, "Notes"];
    const tableRows: (string | number)[][] = [];

    filteredTransactions.forEach(transaction => {
      const amountInDisplayCurrency = convertAmount(transaction.amount, displayCurrencyCode);
      const formattedAmount = formatCurrency(amountInDisplayCurrency, displayCurrencyCode);
      const transactionData = [
        format(parseISO(transaction.date), "MMM dd, yyyy"),
        getCategoryNameById(transaction.categoryId),
        transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1),
        `${transaction.type === 'income' ? '+' : '-'}${formattedAmount.replace(/^[^\d.,]+/, '')}`,
        transaction.notes || "-",
      ];
      tableRows.push(transactionData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 75, 
      theme: 'grid', 
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] }, // Theme color
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc as any).internal.getNumberOfPages();
        doc.setFontSize(8);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      }
    });

    let currentY = doc.lastAutoTable.finalY + 10;

    // Financial Summary
    doc.setFontSize(14);
    doc.text("Financial Summary", 14, currentY);
    currentY += 7;
    doc.setFontSize(10);

    const totalIncomeBase = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const totalExpensesBase = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    
    const totalIncomeDisplay = convertAmount(totalIncomeBase, displayCurrencyCode);
    const totalExpensesDisplay = convertAmount(totalExpensesBase, displayCurrencyCode);
    const netDisplay = totalIncomeDisplay - totalExpensesDisplay;

    const summaryData = [
        ["Total Income:", formatCurrency(totalIncomeDisplay, displayCurrencyCode)],
        ["Total Expenses:", formatCurrency(totalExpensesDisplay, displayCurrencyCode)],
        ["Net (Income - Expenses):", formatCurrency(netDisplay, displayCurrencyCode)],
    ];

    doc.autoTable({
        body: summaryData,
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 10 },
        columnStyles: { 0: { fontStyle: 'bold' } },
    });
    currentY = doc.lastAutoTable.finalY + 10;

    // Budget Overview
    doc.setFontSize(14);
    doc.text("Budget Overview (for selected period)", 14, currentY);
    currentY += 7;

    const expensesByCategoryBase: { [categoryId: string]: number } = {};
    filteredTransactions
        .filter(t => t.type === 'expense')
        .forEach(t => {
            expensesByCategoryBase[t.categoryId] = (expensesByCategoryBase[t.categoryId] || 0) + t.amount;
        });

    const budgetTableColumn = ["Category", `Spent (${displayCurrencyCode})`, `Budget (${displayCurrencyCode})`, "Status"];
    const budgetTableRows: string[][] = [];

    Object.keys(expensesByCategoryBase).forEach(categoryId => {
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) return;

        const spentBase = expensesByCategoryBase[categoryId];
        const spentDisplay = convertAmount(spentBase, displayCurrencyCode);
        
        let budgetDisplayStr = "N/A";
        let status = "No budget set";

        if (category.budget && category.budget > 0) {
            const budgetBase = category.budget;
            const budgetDisplay = convertAmount(budgetBase, displayCurrencyCode);
            budgetDisplayStr = formatCurrency(budgetDisplay, displayCurrencyCode);
            
            const differenceBase = spentBase - budgetBase;
            const differenceDisplay = convertAmount(differenceBase, displayCurrencyCode);

            if (differenceBase > 0) {
                status = `Over budget by ${formatCurrency(differenceDisplay, displayCurrencyCode)}`;
            } else {
                status = `Under budget by ${formatCurrency(Math.abs(differenceDisplay), displayCurrencyCode)}`;
            }
        }
        budgetTableRows.push([
            category.name,
            formatCurrency(spentDisplay, displayCurrencyCode),
            budgetDisplayStr,
            status,
        ]);
    });
    
    if (budgetTableRows.length > 0) {
        doc.autoTable({
            head: [budgetTableColumn],
            body: budgetTableRows,
            startY: currentY,
            theme: 'grid',
            styles: { fontSize: 9 },
            headStyles: { fillColor: [68, 132, 153] }, // Another theme color
            didDrawPage: (data) => {
                const pageCount = doc.getNumberOfPages ? doc.getNumberOfPages() : (doc as any).internal.getNumberOfPages();
                doc.setFontSize(8);
                doc.text(`Page ${data.pageNumber} of ${pageCount}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
            }
        });
    } else {
        doc.setFontSize(10);
        doc.text("No expenses with budgets found for this period.", 14, currentY);
    }
    
    doc.save(`pennypincher_transactions_${displayCurrencyCode}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast({title: "Success", description: "Transactions exported to PDF."});
  };


  return (
    <Card className="shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>View and manage all your income and expenses. Amounts are shown in {displayCurrencyCode}.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button onClick={handleExportCSV} variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
                <Button onClick={handleExportPDF} variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    Export PDF
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
          <div>
            <label htmlFor="searchTerm" className="block text-sm font-medium text-muted-foreground mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="searchTerm"
                placeholder={`Notes, category, amount (in ${BASE_CURRENCY_CODE})...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <div>
            <label htmlFor="filterType" className="block text-sm font-medium text-muted-foreground mb-1">Type</label>
            <Select value={filterType} onValueChange={(value) => setFilterType(value as TransactionType | "all")}>
              <SelectTrigger id="filterType"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="filterCategory" className="block text-sm font-medium text-muted-foreground mb-1">Category</label>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger id="filterCategory"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categoryOptions.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
           <div>
             <label htmlFor="filterDate" className="block text-sm font-medium text-muted-foreground mb-1">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="filterDate"
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !filterDateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filterDateRange?.from ? (
                    filterDateRange.to ? (
                      <>
                        {format(filterDateRange.from, "LLL dd, y")} -{" "}
                        {format(filterDateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(filterDateRange.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filterDateRange?.from}
                  selected={filterDateRange}
                  onSelect={setFilterDateRange}
                  numberOfMonths={2}
                />
                 <div className="p-2 border-t text-right">
                    <Button variant="ghost" size="sm" onClick={() => setFilterDateRange(undefined)}>Clear</Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <Filter className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg">No transactions match your filters.</p>
            <p className="text-sm">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <ScrollArea className="h-[500px] w-full">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="hidden md:table-cell">Notes</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Amount ({displayCurrencyCode})</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => {
                  const amountInDisplayCurrency = convertAmount(transaction.amount, displayCurrencyCode);
                  const formattedAmount = formatCurrency(amountInDisplayCurrency, displayCurrencyCode);
                  return (
                    <TableRow key={transaction.id}>
                      <TableCell>{format(parseISO(transaction.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{getCategoryNameById(transaction.categoryId)}</TableCell>
                      <TableCell className="hidden md:table-cell max-w-xs truncate">{transaction.notes || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                               className={cn(transaction.type === 'income' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30', 'capitalize')}>
                          {transaction.type}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formattedAmount.replace(/^[^\d.,]+/, '')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isFormOpen && editingTransaction?.id === transaction.id} onOpenChange={(open) => { if(!open) closeFormDialog(); else setIsFormOpen(open); }}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => handleEdit(transaction)}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDelete(transaction.id)} className="text-red-600 focus:text-red-600 focus:bg-red-100">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {editingTransaction?.id === transaction.id && (
                             <DialogContent className="sm:max-w-2xl">
                              <TransactionForm transactionToEdit={editingTransaction} onFormSubmit={closeFormDialog} />
                            </DialogContent>
                          )}
                        </Dialog>
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
  );
}
