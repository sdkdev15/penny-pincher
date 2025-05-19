
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";
import { useCurrency } from "@/hooks/useCurrency"; 
import { formatCurrency, formatNumber } from "@/lib/utils"; 

interface SummaryCardProps {
  title: string;
  value: number; // This value is assumed to be in BASE_CURRENCY (USD)
  icon: LucideIcon;
  colorClass?: string;
  formatAsCurrency?: boolean; 
}

export function SummaryCard({ 
  title, 
  value, // raw value in base currency
  icon: Icon, 
  colorClass = "text-primary",
  formatAsCurrency = true 
}: SummaryCardProps) {
  const { currency: displayCurrencyCode, convertAmount } = useCurrency();

  const valueToDisplay = formatAsCurrency 
    ? convertAmount(value, displayCurrencyCode) 
    : value;
  
  const formattedValue = formatAsCurrency 
    ? formatCurrency(valueToDisplay, displayCurrencyCode)
    : formatNumber(valueToDisplay); // valueToDisplay is already correct (either converted or original)

  return (
    <Card className="shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-5 w-5 ${colorClass}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClass}`}>{formattedValue}</div>
      </CardContent>
    </Card>
  );
}
