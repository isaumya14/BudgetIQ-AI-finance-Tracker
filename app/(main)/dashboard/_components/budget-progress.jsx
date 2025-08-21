"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardDescription,
  CardHeader,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Pencil, X } from "lucide-react";
import useFetch from "@/hooks/use-fetch";
import { toast } from "sonner";
import { updateBudget } from "@/actions/budget";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const BudgetProgress = ({ initialBudget, currentExpenses }) => {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  
  // This state will be correctly updated by props after router.refresh()
  const [budgetAmount, setBudgetAmount] = useState(initialBudget?.amount || 0);

  const [newBudget, setNewBudget] = useState(
    initialBudget?.amount?.toString() || ""
  );

  const percentUsed = budgetAmount
    ? (currentExpenses / budgetAmount) * 100
    : 0;

  const {
    loading: isLoading,
    fn: updateBudgetFn,
    data: updatedBudget,
    error,
  } = useFetch(updateBudget);

  const handleUpdateBudget = async () => {
    const amount = parseFloat(newBudget);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid budget amount");
      return;
    }
    await updateBudgetFn(amount);
  };

  useEffect(() => {
    // --- THIS IS THE FIX ---
    // We check for the `success` property that your server action returns.
    if (updatedBudget?.success) {
      toast.success("Budget updated successfully");
      setIsEditing(false);

      // This will now reliably trigger the server data refetch.
      router.refresh();
    } 
    // Also handle the error case returned by the server action
    else if (updatedBudget?.error) {
      toast.error(updatedBudget.error);
    }
  }, [updatedBudget, router]); // Dependency array updated for clarity

  useEffect(() => {
    if (error) {
      toast.error(error.message || "Failed to update budget");
    }
  }, [error]);

  const handleCancel = () => {
    setNewBudget(budgetAmount.toString());
    setIsEditing(false);
  };

  // Your return block is unchanged
  return (
    <Card className="shadow-lg">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="flex-1">
          <CardTitle className="text-xl font-semibold mb-2">
            Monthly Budget
          </CardTitle>
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {budgetAmount ? (
                <span>
                  ${currentExpenses.toLocaleString("en-US")}
                  <span className="text-lg font-medium text-muted-foreground">
                    {" "}
                    of{" "}
                  </span>
                  ${budgetAmount.toLocaleString("en-US")}
                </span>
              ) : (
                "No Budget Set"
              )}
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  className="w-40 h-8"
                  placeholder="Enter Amount"
                  autoFocus
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleUpdateBudget}
                  disabled={isLoading}
                  className="hover:bg-green-100 dark:hover:bg-green-900"
                >
                  <Check className="h-4 w-4 text-green-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  disabled={isLoading}
                  className="hover:bg-red-100 dark:hover:bg-red-900"
                >
                  <X className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            (Default Account)
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {initialBudget && (
          <div className="space-y-2">
            <Progress
              value={percentUsed > 100 ? 100 : percentUsed}
              className="h-3"
              indicatorClassName={cn({
                "bg-green-500": percentUsed < 75,
                "bg-yellow-500": percentUsed >= 75 && percentUsed < 90,
                "bg-red-500": percentUsed >= 90,
              })}
            />
            <p className="text-sm font-medium text-muted-foreground text-right">
              <span
                className={cn({
                  "text-green-500": percentUsed < 75,
                  "text-yellow-500": percentUsed >= 75 && percentUsed < 90,
                  "text-red-500 font-bold": percentUsed >= 90,
                })}
              >
                {percentUsed.toFixed(1)}%
              </span>{" "}
              used
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetProgress;