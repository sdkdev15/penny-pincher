"use client";

import Link from 'next/link';
import { format } from 'date-fns';
import type { Transaction } from '@/lib/types';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrency } from '@/hooks/useCurrency'; 
import { formatCurrency, cn } from '@/lib/utils'; 

interface RecentTransactionsTableProps {
  transactions: Transaction[]; 
}

export function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  const { getCategoryNameById } = useCategories();
  const { currency: displayCurrencyCode, convertAmount } = useCurrency(); 

  if (transactions.length === 0) {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>No recent transactions to display.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">Start by adding a new transaction!</p>
          <div className="text-center mt-4">
            <Button asChild>
              <Link href="/transactions">Add Transaction</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayedTransactions = transactions.slice(0, 5);

  return (
    <Card className="shadow-md">
      <CardHeader className="px-4 sm:px-7">
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto -mx-4 sm:mx-0 rounded-lg">
          <div className="inline-block min-w-full px-4 sm:px-0">
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm py-2 px-2 sm:py-3 sm:px-4">Date</TableHead>
                    <TableHead className="text-xs sm:text-sm py-2 px-2 sm:py-3 sm:px-4">Category</TableHead>
                    <TableHead className="hidden md:table-cell text-xs sm:text-sm py-2 px-2 sm:py-3 sm:px-4">Type</TableHead>
                    <TableHead className="text-right text-xs sm:text-sm py-2 px-2 sm:py-3 sm:px-4">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTransactions.map((transaction) => {
                    const amountInDisplayCurrency = convertAmount(transaction.amount, displayCurrencyCode);
                    const formattedAmount = formatCurrency(amountInDisplayCurrency, displayCurrencyCode);
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-4">
                          <div className="text-xs sm:text-sm font-medium">{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                        </TableCell>
                        <TableCell className="py-2 px-2 sm:py-3 sm:px-4">
                          <span className="text-xs sm:text-sm">{getCategoryNameById(transaction.categoryId)}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell py-2 px-2 sm:py-3 sm:px-4">
                          <Badge 
                            variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                            className={cn(
                              transaction.type === 'income' 
                                ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15' 
                                : 'bg-destructive/10 text-destructive border-destructive/30 hover:bg-destructive/15', 
                              'capitalize text-xs'
                            )}
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-right font-medium text-xs sm:text-sm py-2 px-2 sm:py-3 sm:px-4 ${transaction.type === 'income' ? 'text-primary' : 'text-destructive'}`}>
                          {transaction.type === 'income' ? '+' : '-'}{formattedAmount.replace(/^[^\d.,]+/, '')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
        <div className="text-center mt-6">
          <Button asChild variant="outline">
            <Link href="/transactions">View All Transactions</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}