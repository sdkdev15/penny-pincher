"use client";

import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { SummaryCard } from "@/components/dashboard/SummaryCard";
import { RecentTransactionsTable } from "@/components/dashboard/RecentTransactionsTable";
import { useTransactions } from "@/hooks/useTransactions";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner"; 

export default function DashboardPage() {
  const { currentBalance, totalIncome, totalExpenses, recentTransactions, transactions, isLoading } = useTransactions();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated || isLoading) {
    // Show a loading screen while hydration or data fetching is in progress
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" /> 
      </div>
    );
  }

  if (transactions.length === 0) {
    // Show the welcome screen if there are no transactions
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Image
          src="/images/penny-pincher-dashboard.png"
          alt="Welcome to PennyPincher"
          width={300}
          height={250}
          className="mb-8 rounded-lg shadow-lg"
          data-ai-hint="piggy bank illustration"
          priority
        />
        <h1 className="text-4xl font-bold text-primary mb-4">Welcome to PennyPincher!</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          Start managing your finances by adding your first transaction. It's quick and easy!
        </p>
        <Button asChild size="lg">
          <Link href="/transactions">Add Your First Transaction</Link>
        </Button>
      </div>
    );
  }

  // Show the dashboard with data
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Current Balance"
          value={currentBalance}
          icon={PiggyBank}
          colorClass="text-primary"
        />
        <SummaryCard
          title="Total Income"
          value={totalIncome}
          icon={TrendingUp}
          colorClass="text-green-600"
        />
        <SummaryCard
          title="Total Expenses"
          value={totalExpenses}
          icon={TrendingDown}
          colorClass="text-red-600"
        />
        <SummaryCard
          title="Total Transactions"
          value={transactions.length}
          icon={DollarSign}
          formatAsCurrency={false} // Ensure this doesn't use currency formatting
          colorClass="text-amber-600"
        />
      </div>
      <RecentTransactionsTable transactions={recentTransactions} />
    </div>
  );
}