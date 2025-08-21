"use client";

import { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DATE_RANGES = {
  "7D": { label: "Last 7 Days", days: 7 },
  "1M": { label: "Last Month", days: 30 },
  "3M": { label: "Last 3 Months", days: 90 },
  "6M": { label: "Last 6 Months", days: 180 },
  ALL: { label: "All Time", days: null },
};

export function AccountChart({ transactions }) {
  const [dateRange, setDateRange] = useState("1M");
  const safeTransactions = Array.isArray(transactions) ? transactions : [];

  const filteredData = useMemo(() => {
    const range = DATE_RANGES[dateRange];
    const now = new Date();
    const startDate = range.days
      ? startOfDay(subDays(now, range.days))
      : startOfDay(new Date(0));

    // Filter transactions within date range
    const filtered = safeTransactions.filter(
      (t) => new Date(t.date) >= startDate && new Date(t.date) <= endOfDay(now)
    );

    // Group transactions by date
    const grouped = filtered.reduce((acc, transaction) => {
      const date = format(new Date(transaction.date), "MMM dd");
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0 };
      }
      if (transaction.type === "INCOME") {
        acc[date].income += transaction.amount;
      } else {
        acc[date].expense += transaction.amount;
      }
      return acc;
    }, {});

    // Convert to array and sort by date
    return Object.values(grouped).sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );
  }, [safeTransactions, dateRange]);

  // Calculate totals for the selected period
  const totals = useMemo(() => {
    return filteredData.reduce(
      (acc, day) => ({
        income: acc.income + day.income,
        expense: acc.expense + day.expense,
      }),
      { income: 0, expense: 0 }
    );
  }, [filteredData]);

  // Get dynamic heading based on selected range
  const getHeading = () => {
    const selectedRange = DATE_RANGES[dateRange];
    return `Transaction Overview - ${selectedRange.label}`;
  };

  return (
    <Card className="border-0 shadow-sm bg-white/50 backdrop-blur-sm">
      <CardHeader className="pb-6 border-b border-gray-100/80">
        <div className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-900 mb-1">
              {getHeading()}
            </CardTitle>
            <p className="text-sm text-gray-500 font-normal">
              Track your financial activity over time
            </p>
          </div>
          <Select defaultValue={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] border-gray-200/80 shadow-none hover:border-gray-300 transition-colors">
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DATE_RANGES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="pt-6">
        {/* Refined Stats Cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-emerald-50/70 border border-emerald-100/60 rounded-xl p-5 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-emerald-700/80 mb-2">Total Income</p>
            <p className="text-2xl font-semibold text-emerald-600">
              ${totals.income.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-rose-50/70 border border-rose-100/60 rounded-xl p-5 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-rose-700/80 mb-2">Total Expenses</p>
            <p className="text-2xl font-semibold text-rose-600">
              ${totals.expense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-50/70 border border-slate-100/60 rounded-xl p-5 text-center backdrop-blur-sm">
            <p className="text-sm font-medium text-slate-700/80 mb-2">Net Balance</p>
            <p
              className={`text-2xl font-semibold ${
                totals.income - totals.expense >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              ${Math.abs(totals.income - totals.expense).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <div className={`inline-flex items-center text-xs mt-1 px-2 py-1 rounded-full ${
              totals.income - totals.expense >= 0 
                ? "text-emerald-600 bg-emerald-100/50" 
                : "text-rose-600 bg-rose-100/50"
            }`}>
              <span className="mr-1">{totals.income - totals.expense >= 0 ? "↗" : "↘"}</span>
              {totals.income - totals.expense >= 0 ? "Surplus" : "Deficit"}
            </div>
          </div>
        </div>

        {/* Refined Chart Container */}
        <div className="bg-gradient-to-br from-gray-50/30 to-white rounded-2xl p-6 border border-gray-100/50 shadow-inner">
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={filteredData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="2 4" 
                  vertical={false} 
                  stroke="#e2e8f0"
                  opacity={0.6}
                />
                <XAxis
                  dataKey="date"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontWeight: '500' }}
                  dy={10}
                />
                <YAxis
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: '#64748b', fontWeight: '500' }}
                  tickFormatter={(value) => `$${(value / 1000)}k`}
                  width={50}
                />
                <Tooltip
                  formatter={(value, name) => [
                    `$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
                    name
                  ]}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                    fontSize: "12px",
                    fontWeight: "500",
                    backdropFilter: "blur(12px)"
                  }}
                  cursor={{ fill: 'rgba(148, 163, 184, 0.1)', radius: 4 }}
                />
                <Legend 
                  iconType="rect"
                  wrapperStyle={{ 
                    fontSize: '12px', 
                    paddingTop: '20px',
                    fontWeight: '500',
                    color: '#64748b'
                  }}
                />
                <Bar
                  dataKey="income"
                  name="Income"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-80 transition-all duration-300"
                />
                <Bar
                  dataKey="expense"
                  name="Expense"
                  fill="#f43f5e"
                  radius={[6, 6, 0, 0]}
                  className="hover:opacity-80 transition-all duration-300"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Empty State */}
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-base font-medium text-gray-500 mb-1">No transactions found</p>
            <p className="text-sm text-gray-400">Try selecting a different time period</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}