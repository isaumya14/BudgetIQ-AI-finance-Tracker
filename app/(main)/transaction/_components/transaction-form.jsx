// In your AddTransactionForm.jsx file
"use client";
import { createTransaction, updateTransaction } from "@/actions/transaction";
import { transactionSchema } from "@/app/lib/schema";
import useFetch from "@/hooks/use-fetch";
import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  CalendarIcon,
  CreditCard,
  Tag,
  FileText,
  Repeat,
  Plus,
  ArrowUpLeft,
  ArrowDownLeft,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import ReceiptScanner from "./receipt-scanner";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils"; // --- FIX: Added missing import for cn

const AddTransactionForm = ({
  accounts,
  categories,
  editMode = false,
  initialData = null,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const {
    register,
    setValue,
    handleSubmit,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    resolver: zodResolver(transactionSchema),
    // --- FIX: Restored the complete defaultValues logic
    defaultValues:
      editMode && initialData
        ? {
            type: initialData.type,
            amount: initialData.amount.toString(),
            description: initialData.description,
            accountId: initialData.accountId,
            category: initialData.category,
            date: new Date(initialData.date),
            isRecurring: initialData.isRecurring,
            ...(initialData.recurringInterval && {
              recurringInterval: initialData.recurringInterval,
            }),
          }
        : {
            type: "EXPENSE",
            amount: "",
            description: "",
            accountId: accounts.find((ac) => ac.isDefault)?.id,
            date: new Date(),
            isRecurring: false,
          },
  });

  const {
    loading: transactionLoading,
    fn: transactionFn,
    data: transactionResult,
  } = useFetch(editMode ? updateTransaction : createTransaction);

  const type = watch("type");
  const isRecurring = watch("isRecurring");
  const date = watch("date");
  const accountId = watch("accountId");
  const category = watch("category");

  // --- FIX: Restored the complete onSubmit logic
  const onSubmit = async (data) => {
    const formData = {
      ...data,
      amount: parseFloat(data.amount),
    };
    if (editMode) {
      transactionFn(editId, formData);
    } else {
      transactionFn(formData);
    }
  };

  // --- FIX: Restored the complete useEffect logic
  useEffect(() => {
    if (transactionResult?.success && !transactionLoading) {
      toast.success(
        editMode
          ? "Transaction Updated Successfully"
          : "Transaction Created Successfully"
      );
      reset();
      router.push(`/account/${transactionResult.data.accountId}`);
    }
  }, [transactionResult, transactionLoading, editMode, reset, router]);

  const filteredCategories = categories.filter((c) => c.type === type);

  // --- FIX: Restored the complete handleScanComplete logic
  const handleScanComplete = (scannedData) => {
    if (scannedData) {
      setValue("amount", scannedData.amount.toString());
      setValue("date", new Date(scannedData.date));
      if (scannedData.description) {
        setValue("description", scannedData.description);
      }
      if (scannedData.category) {
        setValue("category", scannedData.category);
      }
      toast.success("Receipt scanned successfully");
    }
  };

  const inputStyle = "h-12 border-slate-200 bg-slate-50 rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors duration-200";

  return (
    <Card className="overflow-hidden shadow-lg">
      <CardContent className="p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {!editMode && <ReceiptScanner onScanComplete={handleScanComplete} />}
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase">Transaction Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setValue("type", "EXPENSE")} className={cn("flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all duration-200", type === "EXPENSE" ? "bg-red-50/50 border-red-500 ring-2 ring-red-500" : "border-slate-200 bg-slate-50 hover:border-slate-300")}>
                <ArrowDownLeft className={cn("h-5 w-5", type === 'EXPENSE' ? 'text-red-600' : 'text-slate-500')} />
                <span className={cn("font-semibold", type === 'EXPENSE' ? 'text-red-700' : 'text-slate-700')}>Expense</span>
              </button>
              <button type="button" onClick={() => setValue("type", "INCOME")} className={cn("flex items-center justify-center gap-3 p-4 rounded-lg border-2 transition-all duration-200", type === "INCOME" ? "bg-green-50/50 border-green-500 ring-2 ring-green-500" : "border-slate-200 bg-slate-50 hover:border-slate-300")}>
                <ArrowUpLeft className={cn("h-5 w-5", type === 'INCOME' ? 'text-green-600' : 'text-slate-500')} />
                <span className={cn("font-semibold", type === 'INCOME' ? 'text-green-700' : 'text-slate-700')}>Income</span>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-600 uppercase">Amount</label>
            <div className="relative"><span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-500 text-xl">$</span><Input type="number" step="0.01" placeholder="0.00" {...register("amount")} className={cn(inputStyle, "pl-8 pr-4 h-16 text-3xl font-bold")}/></div>
            {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase">Account</label>
              <Select onValueChange={(v) => setValue("accountId", v)} value={accountId}><SelectTrigger className={inputStyle}><SelectValue placeholder="Choose account" /></SelectTrigger>
                {/* --- FIX: Restored Account dropdown content --- */}
                <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">
                  {accounts.map((account) => (<SelectItem key={account.id} value={account.id} className="p-3 hover:bg-blue-50 rounded-lg mx-1"><div className="flex items-center justify-between w-full"><span className="font-medium text-gray-800">{account.name}</span><span className="text-sm font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md ml-3">${parseFloat(account.balance).toFixed(2)}</span></div></SelectItem>))}
                  <div className="border-t border-gray-100 mt-2 pt-2"><CreateAccountDrawer><Button type="button" variant="ghost" className="w-full justify-center text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-10 rounded-lg mx-1 font-medium"><Plus className="h-4 w-4 mr-2" />Create New Account</Button></CreateAccountDrawer></div>
                </SelectContent>
              </Select>
              {errors.accountId && (<p className="text-sm text-red-600 mt-2">{errors.accountId.message}</p>)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase">Category</label>
              <Select onValueChange={(v) => setValue("category", v)} value={category}><SelectTrigger className={inputStyle}><SelectValue placeholder="Choose category" /></SelectTrigger>
                {/* --- FIX: Restored Category dropdown content --- */}
                <SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl">{filteredCategories.map((category) => (<SelectItem key={category.id} value={category.id} className="p-3 hover:bg-orange-50 rounded-lg mx-1"><span className="font-medium text-gray-800">{category.name}</span></SelectItem>))}</SelectContent>
              </Select>
              {errors.category && (<p className="text-sm text-red-600 mt-2">{errors.category.message}</p>)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase">Date</label>
              <Popover><PopoverTrigger asChild><Button variant="outline" className={cn("w-full justify-start text-left font-normal", inputStyle)}><CalendarIcon className="mr-2 h-4 w-4" />{date ? format(date, "PPP") : <span>Pick a date</span>}</Button></PopoverTrigger>
                {/* --- FIX: Restored Calendar component --- */}
                <PopoverContent className="w-auto p-0 rounded-xl border-2 border-gray-100 shadow-xl" align="start"><Calendar mode="single" selected={date} onSelect={(date) => setValue("date", date)} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus className="rounded-xl"/></PopoverContent>
              </Popover>
              {errors.date && (<p className="text-sm text-red-600 mt-2">{errors.date.message}</p>)}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600 uppercase">Description <span className="text-xs font-normal normal-case text-muted-foreground">(optional)</span></label>
              <Input placeholder="e.g. Coffee with friends" {...register("description")} className={inputStyle}/>
              {errors.description && (<p className="text-sm text-red-600 mt-2">{errors.description.message}</p>)}
            </div>
          </div>

          {/* --- FIX: Restored complete Recurring Transaction section --- */}
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-6">
            <div className="flex items-center justify-between"><div className="flex items-center gap-4"><div className="p-3 rounded-xl bg-blue-100"><Repeat className="h-5 w-5 text-blue-600" /></div><div><div className="font-semibold text-slate-800">Recurring Transaction</div><div className="text-sm text-slate-500">Automatically repeat this transaction</div></div></div><Switch checked={isRecurring} onCheckedChange={(checked) => setValue("isRecurring", checked)} className="data-[state=checked]:bg-primary"/></div>
            {isRecurring && (<div className="mt-6 pt-6 border-t border-slate-200"><div className="space-y-2"><label className="text-sm font-semibold text-gray-600 uppercase">Frequency</label><Select onValueChange={(value) => setValue("recurringInterval", value)} defaultValue={getValues("recurringInterval")}><SelectTrigger className={cn(inputStyle, 'bg-white')}><SelectValue placeholder="How often should this repeat?" /></SelectTrigger><SelectContent className="rounded-xl border-2 border-gray-100 shadow-xl"><SelectItem value="DAILY" className="p-3 hover:bg-blue-50 rounded-lg mx-1">Daily</SelectItem><SelectItem value="WEEKLY" className="p-3 hover:bg-blue-50 rounded-lg mx-1">Weekly</SelectItem><SelectItem value="MONTHLY" className="p-3 hover:bg-blue-50 rounded-lg mx-1">Monthly</SelectItem><SelectItem value="YEARLY" className="p-3 hover:bg-blue-50 rounded-lg mx-1">Yearly</SelectItem></SelectContent></Select>{errors.recurringInterval && (<p className="text-sm text-red-600 mt-2">{errors.recurringInterval.message}</p>)}</div></div>)}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-slate-100">
            <Button type="button" variant="outline" className="flex-1 h-12 rounded-lg font-semibold" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" className="flex-1 h-12 rounded-lg font-semibold" disabled={transactionLoading}>{transactionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : editMode ? "Update Transaction" : "Create Transaction"}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddTransactionForm;