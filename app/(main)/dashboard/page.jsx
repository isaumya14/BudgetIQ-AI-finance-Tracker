import { Card, CardContent } from "@/components/ui/card";
import CreateAccountDrawer from "@/components/create-account-drawer";
import { Plus } from "lucide-react";
import { getDashboardData, getUserAccounts } from "@/actions/dashboard";
import AccountCard from "./_components/account-card";
import { getCurrentBudget } from "@/actions/budget";
import BudgetProgress from "./_components/budget-progress";
import { Suspense } from "react-is/cjs/react-is.production";
import DashboardOverview from "./_components/transaction-overview";


export default async function DashboardPage() {
  const  accounts= await getUserAccounts();
  
  const defaultAccount = accounts.find(account => account.isDefault);

  let budgetData=null;
  if(defaultAccount){
    budgetData= await getCurrentBudget(defaultAccount.id);

  }
  const transactions=await getDashboardData();

  return (
    <div className="container max-w-8xl mx-auto py-8 sm:py-12 px-4"> {/* Added padding, max width, and centering */}
        <div className="space-y-10"> {/* Increased vertical spacing */}
            {/* BUDGET PROGRESS */}
            {defaultAccount && <BudgetProgress 
            initialBudget={budgetData?.budget}
            currentExpenses={budgetData?.currentExpenses || 0}
            />}

            {/* OVERVIEW */}
            <Suspense>
                <DashboardOverview
                accounts={accounts}
                transactions={transactions || []}
                />
            </Suspense>

            {/* ACCOUNTS GRID */}
            <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'> {/* Increased gap */}
                {/* ... existing account cards and create drawer ... */}
                
                {/* Improvement to 'Add New Account' Card */}
                <CreateAccountDrawer>
                    <Card className="h-full hover:shadow-lg transition-all cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 bg-transparent">
                        <CardContent className="flex flex-col items-center justify-center text-muted-foreground h-full py-10 md:py-16">
                            <Plus className='h-10 w-10 mb-2'/>
                            <p className='text-sm font-semibold'>Add New Account</p>
                        </CardContent>
                    </Card>
                </CreateAccountDrawer>

                {accounts.length > 0 && accounts?.map((account)=>{
                    return <AccountCard key={account.id} account={account}/>
                })}
            </div>
        </div>
    </div>
);
}

