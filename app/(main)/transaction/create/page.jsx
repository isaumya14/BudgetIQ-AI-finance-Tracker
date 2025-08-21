import { getUserAccounts } from '@/actions/dashboard';
import { defaultCategories } from '@/data/categories';
import React from 'react';
import AddTransactionForm from '../_components/transaction-form';
import { getTransaction } from '@/actions/transaction';

// --- SOLUTION ---
// This line tells Next.js to always render this page dynamically.
export const dynamic = 'force-dynamic';

const AddTransactionPage = async ({ searchParams }) => {
    // The error occurs on this line, but the fix is the export above.
    const editId = searchParams?.edit;
    
    const accounts = await getUserAccounts();
    let initialData = null;

    if (editId) {
      const transaction = await getTransaction(editId);
      initialData = transaction;
    }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight gradient-title flex justify-center">
          {editId ? "Edit Transaction" : "Add New Transaction"}
        </h1>
        <p className="text-muted-foreground mt-1 flex justify-center">
            Fill in the details below to record a new transaction.
        </p>
      </div>
      <AddTransactionForm
        accounts={accounts}
        categories={defaultCategories}
        editMode={!!editId}
        initialData={initialData}
      />
    </div>
  );
};

export default AddTransactionPage;

// The rest of your file (Inngest functions, etc.) remains unchanged.
// ...