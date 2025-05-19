import { TransactionForm } from "@/components/transactions/TransactionForm";
import { TransactionListClient } from "@/components/transactions/TransactionListClient";

export default function TransactionsPage() {
  return (
    <div className="space-y-8">
      <TransactionForm />
      <TransactionListClient />
    </div>
  );
}
