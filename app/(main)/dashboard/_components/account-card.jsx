"use client"
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import React from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { updateDefaultAccount } from "@/actions/accounts";
import useFetch  from "@/hooks/use-fetch";
import { toast } from "sonner";
import { useState,useEffect } from "react";



const AccountCard = ({ account }) => {
  const { name, type, balance, id, isDefault } = account;
  const {
    loading: updateDefaultLoading,
    fn: updateDefaultFn,
    data: updatedAccount,
    error,
  } = useFetch(updateDefaultAccount);

  const handleDefaultChange = async (event) => {
    event.preventDefault();
    if(isDefault){
        toast.warning('You need at least one default account');
    }
    await updateDefaultFn(id);
  };
  useEffect(() => {
    if (updatedAccount?.success) {
      toast.success("Default account updated successfully");
    }
  }, [updatedAccount]);


  useEffect(()=>{
    if(error){
        toast.error(error.message || "Failed to update default account");
    }
  },[error]);

  
  return (
    <Card className="h-full flex flex-col justify-between shadow-lg hover:shadow-xl transition-all relative"> {/* Ensure card takes full height and uses better shadow */}
      <Link href={`/account/${id}`} className="block"> {/* Apply Link to the main content area */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"> {/* Adjusted padding */}
          <CardTitle className="text-lg font-semibold capitalize tracking-tight"> {/* Larger, bolder title */}
            {name}
          </CardTitle>
          {/* Moved Switch out of Link for better click handling, but kept for context */}
        </CardHeader>
        <CardContent className="pt-2 pb-6"> {/* Adjusted padding */}
          <div className="text-3xl font-extrabold text-primary mb-1"> {/* Increased size and used primary color */}
            ${parseFloat(balance).toFixed(2)}
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {type.charAt(0) + type.slice(1).toLowerCase()} Account
          </p>
        </CardContent>
      </Link>
      
      {/* Footer (outside the main link, better for click interaction) */}
      <CardFooter className="flex justify-between text-sm pt-4 border-t border-gray-100 dark:border-gray-800">
          
          {/* Income Display */}
          <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
            <ArrowUpRight className="mr-1 h-4 w-4"/>
            Income
          </div>
          
          {/* Expense Display */}
          <div className="flex items-center text-red-600 dark:text-red-400 font-medium">
            <ArrowDownRight className="mr-1 h-4 w-4" />
            Expense
          </div>
          
      </CardFooter>

      {/* Default Switch (needs to be separate from the Link element) */}
      <div className="absolute top-4 right-4 z-10">
        <Switch 
            checked={isDefault} 
            onClick={handleDefaultChange}
            disabled={updateDefaultLoading || isDefault} // Disable if already default
            className={isDefault ? "data-[state=checked]:bg-green-500" : ""} // Highlight default state
        />
      </div>

    </Card>
  );
};

export default AccountCard;