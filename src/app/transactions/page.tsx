"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionListClient } from "@/components/transactions/TransactionListClient";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

export default function TransactionsPage() {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(0); 

  const handleRefresh = () => {
    setRefreshKey((prevKey) => prevKey + 1); 
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <Button
          onClick={() => router.push("/scanReceipts")}
          className="flex items-center gap-2"
          variant="outline"
        >
          <Camera className="h-4 w-4" />
          Scan Receipt
        </Button>
      </div>
      <TransactionForm onFormSubmit={handleRefresh} />
      <TransactionListClient refreshKey={refreshKey} />
    </div>
  );
}
