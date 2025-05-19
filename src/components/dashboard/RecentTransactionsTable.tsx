
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
  transactions: Transaction[]; // Amounts in transactions are in base currency (USD)
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
      <CardHeader className="px-7">
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Your latest financial activities.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTransactions.map((transaction) => {
                const amountInDisplayCurrency = convertAmount(transaction.amount, displayCurrencyCode);
                const formattedAmount = formatCurrency(amountInDisplayCurrency, displayCurrencyCode);
                return (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <div className="font-medium">{format(new Date(transaction.date), 'MMM dd, yyyy')}</div>
                    </TableCell>
                    <TableCell>
                       {getCategoryNameById(transaction.categoryId)}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={transaction.type === 'income' ? 'default' : 'destructive'} 
                             className={cn(transaction.type === 'income' ? 'bg-green-500/20 text-green-700 border-green-500/30 hover:bg-green-500/30' : 'bg-red-500/20 text-red-700 border-red-500/30 hover:bg-red-500/30', 'capitalize')}>
                        {transaction.type}
                      </Badge>
                    </TableCell>
                    <TableCell className={`text-right font-medium ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formattedAmount.replace(/^[^\d.,]+/, '')}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </ScrollArea>
         <div className="text-center mt-6">
            <Button asChild variant="outline">
              <Link href="/transactions">View All Transactions</Link>
            </Button>
          </div>
      </CardContent>
    </Card>
  );
}
