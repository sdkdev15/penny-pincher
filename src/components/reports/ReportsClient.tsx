
"use client";

import { useMemo, useState } from "react";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";
import { Bar, BarChart, Pie, PieChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";
import { useTransactions } from "@/hooks/useTransactions";
import { useCategories } from "@/hooks/useCategories";
import type { ChartData, Transaction } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { cn, formatCurrency } from "@/lib/utils"; 
import Image from "next/image";
import { Spinner } from "@/components/ui/spinner"; 
import { useCurrency } from "@/hooks/useCurrency"; 

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(195, 36%, 60%)", 
  "hsl(0, 82%, 85%)",   
  "hsl(25, 80%, 70%)",  
  "hsl(120, 40%, 65%)", 
  "hsl(280, 50%, 70%)", 
];


export function ReportsClient() {
  const { transactions, isLoading } = useTransactions(); // transactions amounts are in base currency (USD)
  const { getCategoryNameById, categories } = useCategories();
  const { currency: displayCurrencyCode, convertAmount } = useCurrency(); 
  
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const end = new Date();
    const start = startOfMonth(end);
    return { from: start, to: end };
  });

  const [timePeriod, setTimePeriod] = useState<string>("this_month");


  const handleTimePeriodChange = (value: string) => {
    setTimePeriod(value);
    const today = new Date();
    let fromDate: Date, toDate: Date = today;

    switch (value) {
      case "this_month":
        fromDate = startOfMonth(today);
        toDate = endOfMonth(today);
        break;
      case "last_month":
        const lastMonthStart = startOfMonth(subMonths(today, 1));
        fromDate = lastMonthStart;
        toDate = endOfMonth(lastMonthStart);
        break;
      case "this_year":
        fromDate = startOfYear(today);
        toDate = endOfYear(today);
        break;
      case "last_year":
         const lastYearStart = startOfYear(subMonths(today, 12));
         fromDate = lastYearStart;
         toDate = endOfYear(lastYearStart);
        break;
      default: 
        if (dateRange?.from && dateRange?.to) {
          fromDate = dateRange.from;
          toDate = dateRange.to;
        } else {
           fromDate = startOfMonth(today);
           toDate = endOfMonth(today);
        }
        break;
    }
    setDateRange({ from: fromDate, to: toDate });
  };


  const filteredTransactions = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return transactions;
    const toDateAdjusted = new Date(dateRange.to);
    toDateAdjusted.setHours(23, 59, 59, 999);

    return transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= dateRange.from! && transactionDate <= toDateAdjusted;
    });
  }, [transactions, dateRange]);

  const expensesByCategory: ChartData[] = useMemo(() => {
    const expenseData: { [key: string]: number } = {}; // Stores amounts in base currency
    filteredTransactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const categoryName = getCategoryNameById(t.categoryId);
        expenseData[categoryName] = (expenseData[categoryName] || 0) + t.amount;
      });
    return Object.entries(expenseData).map(([name, valueInBase]) => ({ 
      name, 
      value: convertAmount(valueInBase, displayCurrencyCode) // Convert to display currency for chart
    }));
  }, [filteredTransactions, getCategoryNameById, displayCurrencyCode, convertAmount]);

  const incomeVsExpenses: ChartData[] = useMemo(() => {
    const incomeInBase = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expensesInBase = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return [
      { name: "Total Income", value: convertAmount(incomeInBase, displayCurrencyCode), fill: "hsl(var(--chart-4))" }, // Convert
      { name: "Total Expenses", value: convertAmount(expensesInBase, displayCurrencyCode), fill: "hsl(var(--chart-2))" }, // Convert
    ];
  }, [filteredTransactions, displayCurrencyCode, convertAmount]);

  const noDataForCharts = expensesByCategory.length === 0 && incomeVsExpenses.every(item => item.value === 0);

  // This formatter now receives a value that is already in the display currency
  const currencyTickFormatter = (valueInDisplayCurrency: number) => formatCurrency(valueInDisplayCurrency, displayCurrencyCode);
  if (isLoading) {
    // Show a loading screen while data is being fetched
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  if (transactions.length === 0 && typeof window !== 'undefined') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center p-6">
        <Image 
          src="/images/penny-pincher-reports.png" 
          alt="No data for reports" 
          width={300} 
          height={250} 
          className="mb-8 rounded-lg shadow-lg"
          data-ai-hint="empty chart illustration"
        />
        <h2 className="text-3xl font-semibold text-primary mb-4">No Data for Reports Yet</h2>
        <p className="text-lg text-muted-foreground max-w-md">
          Add some transactions to see your financial reports and charts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Report Filters</CardTitle>
          <CardDescription>Select a time period to view your financial data (shown in {displayCurrencyCode}).</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4 items-center">
          <Select value={timePeriod} onValueChange={handleTimePeriodChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="last_month">Last Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {timePeriod === 'custom' && (
             <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant={"outline"}
                  className={cn(
                    "w-full sm:w-auto justify-start text-left font-normal flex-1",
                    !dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd, y")} -{" "}
                        {format(dateRange.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
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
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          )}
        </CardContent>
      </Card>

      {noDataForCharts && timePeriod !== "custom" && (
         <Card className="shadow-md">
           <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>There are no transactions for the selected period: {
                timePeriod === "this_month" ? "This Month" :
                timePeriod === "last_month" ? "Last Month" :
                timePeriod === "this_year" ? "This Year" :
                timePeriod === "last_year" ? "Last Year" :
                "selected range"
            }.</CardDescription>
           </CardHeader>
           <CardContent className="h-[300px] flex items-center justify-center">
             <p className="text-muted-foreground">Try selecting a different period or adding transactions.</p>
           </CardContent>
         </Card>
      )}


      {!noDataForCharts && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
              <CardDescription>Breakdown of your expenses for the selected period (in {displayCurrencyCode}).</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
            {expensesByCategory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                    {expensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => currencyTickFormatter(value)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No expense data for this period.</div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Income vs. Expenses</CardTitle>
              <CardDescription>Comparison of total income and expenses for the selected period (in {displayCurrencyCode}).</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
            {incomeVsExpenses.some(d => d.value > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={incomeVsExpenses} layout="vertical" margin={{ left: 20, right: 20}}>
                  <XAxis type="number" tickFormatter={currencyTickFormatter} />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip formatter={(value: number) => currencyTickFormatter(value)} />
                  <Legend />
                  <Bar dataKey="value" barSize={35} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">No income or expense data for this period.</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
