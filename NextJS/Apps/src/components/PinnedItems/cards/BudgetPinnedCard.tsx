"use client";

import { User } from "lucide-react";
import { PinnedItem } from "@/types/pinnedItems";

interface BudgetPinnedCardProps {
  item: PinnedItem;
}

function calculatePercentage(actual: string, expected: string): number {
  const actualNum = parseFloat(actual.replace(/[$,]/g, ''));
  const expectedNum = parseFloat(expected.replace(/[$,]/g, ''));
  if (expectedNum === 0) return 0;
  return (actualNum / expectedNum) * 100;
}

export function BudgetPinnedCard({ item }: BudgetPinnedCardProps) {
  const { title, subtitle, stats } = item.item_data;

  // Extract expenses and income from stats
  const expenses = stats?.find(s => s.label === "Expenses");
  const income = stats?.find(s => s.label === "Income");

  const expensesPercent = expenses?.actual && expenses?.expected
    ? calculatePercentage(expenses.actual, expenses.expected)
    : 0;
  const incomePercent = income?.actual && income?.expected
    ? calculatePercentage(income.actual, income.expected)
    : 0;

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-foreground mb-4 hover:text-[#61BC47] transition-colors pr-8">
        {title}
      </h2>

      {subtitle && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3">
          <User className="w-4 h-4" />
          <span>{subtitle}</span>
        </div>
      )}

      <div className="pt-4 border-t border-border space-y-4">
        {expenses && (
          <div className="pb-3 border-b border-border/50">
            <div className="text-xs font-semibold text-foreground mb-2">Expenses</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${
                  expensesPercent < 90
                    ? "bg-[#61bc47]"
                    : expensesPercent < 100
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(expensesPercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">actual</span>
                <span className="text-sm font-bold text-foreground">
                  {expenses.actual}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-muted-foreground">expected</span>
                <span className="text-sm font-bold text-foreground">
                  {expenses.expected}
                </span>
              </div>
            </div>
          </div>
        )}

        {income && (
          <div>
            <div className="text-xs font-semibold text-foreground mb-2">Income</div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
              <div
                className={`h-full rounded-full transition-all ${
                  incomePercent < 90
                    ? "bg-[#61bc47]"
                    : incomePercent < 100
                      ? "bg-yellow-500"
                      : "bg-red-500"
                }`}
                style={{ width: `${Math.min(incomePercent, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground">actual</span>
                <span className="text-sm font-bold text-foreground">
                  {income.actual}
                </span>
              </div>
              <div className="flex flex-col text-right">
                <span className="text-xs text-muted-foreground">expected</span>
                <span className="text-sm font-bold text-foreground">
                  {income.expected}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
