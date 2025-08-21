// import { inngest } from "@/lib/inngest/client";
// import { db } from "../../lib/prisma";

// import { sendEmail } from "@/actions/send-email";
// import EmailTemplate from "@/emails/template";

// export const checkBudgetAlert = inngest.createFunction(
//   { id: "Check Budget Alerts" },
//   { cron: "0 */6 * * *" },
//   async ({ step }) => {
//     const budgets = await step.run("fetch-budget", async () => {
//       return await db.budget.findMany({
//         include: {
//           user: {
//             include: {
//               accounts: {
//                 where: {
//                   isDefault: true,
//                 },
//               },
//             },
//           },
//         },
//       });
//     });
//     console.log("Fetched budgets count:", budgets.length);
//     console.log("Fetched budgets full data:", JSON.stringify(budgets, null, 2));

//     for (const budget of budgets) {
//       console.log("BUDget:", budget.id, budget.user.email);
//       const defaultAccount = budget.user.accounts[0];
//       if (!defaultAccount) {
//         continue;
//       }
//       await step.run(`check-budget-${budget.id}`, async () => {
//         const startDate = new Date();
//         startDate.setDate(1); //start of current month

//         const expenses = await db.transaction.aggregate({
//           where: {
//             userId: budget.userId,
//             accountId: defaultAccount.id,
//             type: "EXPENSE",
//             date: {
//               gte: startDate,
//             },
//           },
//           _sum: {
//             amount: true,
//           },
//         });

//         const totalExpenses = expenses._sum.amount?.toNumber() || 0;
//         const budgetAmount = budget.amount;
//         const percentageUsed =
//           budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

//         if (
//           percentageUsed >= 80 &&
//           (!budget.lastAlertSent ||
//             isNewMonth(new Date(budget.lastAlertSent), new Date()))
//         ) {
//           console.log("Sending budget alert to:", budget.user.email);
//           //send email
//           await sendEmail({
//             // to: budget.user.email,
//             // subject: `Budget Alert for: ${defaultAccount.name}`,
//             // react: EmailTemplate({
//             //   userName: budget.user.name,
//             //   type: "budget-alert",
//             //   data: {
//             //     percentageUsed,
//             //     budgetAmount: Number(budgetAmount).toFixed(1),
//             //     totalExpenses: Number(totalExpenses).toFixed(1),
//             //     accountName: defaultAccount.name,
//             to: "test@example.com",
//             subject: "Test Email",
//             react: EmailTemplate({
//               userName: "Test User",
//               type: "budget-alert",
//               data: {
//                 percentageUsed: 85,
//                 budgetAmount: "1000.0",
//                 totalExpenses: "850.0",
//                 accountName: "Test Account",
//               },
//             }),
//           });

//           //update lastAlertSent
//           await db.budget.update({
//             where: { id: budget.id },
//             data: { lastAlertSent: new Date() },
//           });
//         }
//       });
//     }
//   }
// );

// function isNewMonth(lastAlertDate, currentDate) {
//   return (
//     lastAlertDate.getMonth() !== currentDate.getMonth() ||
//     lastAlertDate.getFullYear() !== currentDate.getFullYear()
//   );
// }
import { inngest } from "@/lib/inngest/client";
import { db } from "../../lib/prisma";
import { sendEmail } from "@/actions/send-email";
import EmailTemplate from "@/emails/template";
import { GoogleGenerativeAI } from "@google/generative-ai";


export const checkBudgetAlert = inngest.createFunction(
  { id: "Check Budget Alerts" },
  { cron: "0 */6 * * *" },
  async ({ step }) => {
    const budgets = await step.run("fetch-budget", async () => {
      return await db.budget.findMany({
        include: {
          user: {
            include: {
              accounts: {
                where: {
                  isDefault: true,
                },
              },
            },
          },
        },
      });
    });

    console.log("Fetched budgets count:", budgets.length);
    console.log("Fetched budgets full data:", JSON.stringify(budgets, null, 2));

    for (const budget of budgets) {
      console.log(
        "Processing budget:",
        budget.id,
        "for user:",
        budget.user.email
      );

      const defaultAccount = budget.user.accounts[0];
      if (!defaultAccount) {
        console.log(`No default account found for user ${budget.user.email}`);
        continue;
      }

      console.log("Default account:", defaultAccount.id, defaultAccount.name);

      await step.run(`check-budget-${budget.id}`, async () => {
        // Fix: Use UTC methods to ensure consistent date handling
        const startDate = new Date();
        startDate.setUTCDate(1);
        startDate.setUTCHours(0, 0, 0, 0);

        console.log(
          "Start date for expense calculation:",
          startDate.toISOString()
        );

        const expenses = await db.transaction.aggregate({
          where: {
            userId: budget.userId,
            accountId: defaultAccount.id,
            type: "EXPENSE",
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        });

        const totalExpenses = expenses._sum.amount?.toNumber() || 0;
        const budgetAmount = budget.amount;
        const percentageUsed =
          budgetAmount > 0 ? (totalExpenses / budgetAmount) * 100 : 0;

        console.log("Budget calculation for user", budget.user.email, ":");
        console.log("- Budget amount:", budgetAmount);
        console.log("- Total expenses:", totalExpenses);
        console.log("- Percentage used:", percentageUsed.toFixed(2) + "%");
        console.log("- Last alert sent:", budget.lastAlertSent);

        // Check if alert should be sent
        const shouldSendAlert =
          percentageUsed >= 80 &&
          (!budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date()));

        console.log("Should send alert:", shouldSendAlert);
        console.log("Percentage >= 80:", percentageUsed >= 80);
        console.log(
          "Is new month or no previous alert:",
          !budget.lastAlertSent ||
            isNewMonth(new Date(budget.lastAlertSent), new Date())
        );

        if (shouldSendAlert) {
          console.log("Sending budget alert to:", budget.user.email);

          try {
            // Add error handling around email sending
            const testEmail =
              budget.user.email === "istorageofsaumya@gmail.com"
                ? "itssaumya14@gmail.com"
                : budget.user.email;

            const emailResult = await sendEmail({
              to: testEmail,
              subject: `Budget Alert for: ${defaultAccount.name}`,
              react: EmailTemplate({
                userName: budget.user.name,
                type: "budget-alert",
                data: {
                  percentageUsed: Number(percentageUsed.toFixed(1)),
                  budgetAmount: Number(budgetAmount).toFixed(1),
                  totalExpenses: Number(totalExpenses).toFixed(1),
                  accountName: defaultAccount.name,
                },
              }),
            });

            console.log("Email send result:", emailResult);

            // Only update if email was sent successfully
            if (emailResult.success) {
              await db.budget.update({
                where: { id: budget.id },
                data: { lastAlertSent: new Date() },
              });
              console.log("Updated lastAlertSent for budget:", budget.id);
            } else {
              console.error("Email failed to send, not updating lastAlertSent");
            }
          } catch (error) {
            console.error("Error sending email or updating database:", error);
            // Don't throw here to continue processing other budgets
          }
        } else {
          console.log("Alert not sent - conditions not met");
        }
      });
    }

    console.log("Budget alert check completed");
  }
);

function isNewMonth(lastAlertDate, currentDate) {
  const isNew =
    lastAlertDate.getMonth() !== currentDate.getMonth() ||
    lastAlertDate.getFullYear() !== currentDate.getFullYear();

  console.log("isNewMonth check:");
  console.log("- Last alert:", lastAlertDate.toISOString());
  console.log("- Current date:", currentDate.toISOString());
  console.log("- Is new month:", isNew);

  return isNew;
}

export const triggerRecurringTransaction = inngest.createFunction(
  {
    id: "trigger-recurring-transaction",
    name: "Trigger Recurring Transactions",
  },
  {
    cron: "0 0 * * *", // Runs daily at midnight
  },
  async ({ step }) => {
    //1. Fetch all due recurring transactions
    const recurringTransactions = await step.run(
      "fetch-recurring-transactions",
      async () => {
        return await db.transaction.findMany({
          where: {
            isRecurring: true,
            status: "COMPLETED",
            OR: [
              {
                lastProcessed: null, //never processed
              },
              { nextRecurringDate: { lte: new Date() } }, //due date passed
            ],
          },
        });
      }
    );

    //2.  Create events for each transactions
    if (recurringTransactions.length > 0) {
      const events = recurringTransactions.map((transaction) => ({
        name: "transaction.recurring.process",
        data: {
          transactionId: transaction.id,
          userId: transaction.userId,
        },
      }));

      //3.Send events to be processed
      await inngest.send(events);
    }
    return { triggered: recurringTransactions.length };
  }
);

export const processRecurringTransaction = inngest.createFunction(
  {
    id: "process-recurring-transaction",
    throttle: {
      limit: 10,
      period: "1m",
      key: "event.data.userId",
    },
  },
  { event: "transaction.recurring.process" },
  async ({ event, step }) => {
    //validate event data
    if (!event?.data?.transactionId || !event?.data?.userId) {
      console.error("Invalid event data:", event);
      return { error: "Missing required event data" };
    }
    await step.run("process-transaction", async () => {
      const transaction = await db.transaction.findUnique({
        where: {
          id: event.data.transactionId,
          userId: event.data.userId,
        },
        include: {
          account: true,
        },
      });
      if (!transaction || !isTransactionDue(transaction)) {
        console.log(
          "No due transaction found for processing:",
          event.data.transactionId
        );
        return;
      }
      await db.$transaction(async (tx) => {
        //create new transaction
        await tx.transaction.create({
          data: {
            type: transaction.type,
            amount: transaction.amount,
            description: `${transaction.description} (Recurring)`,
            date: new Date(),
            category: transaction.category,
            userId: transaction.userId,
            accountId: transaction.accountId,
            isRecurring: false,
          },
        });
        //update account balance
        const balanceChange =
          transaction.type === "EXPENSE"
            ? -transaction.amount.toNumber()
            : transaction.amount.toNumber();

        await tx.account.update({
          where: { id: transaction.accountId },
          data: { balance: { increment: balanceChange } },
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            lastProcessed: new Date(),
            nextRecurringDate: calculateNextRecurringDate(
              new Date(),
              transaction.recurringInterval
            ),
          },
        });
      });
    });
  }
);

function calculateNextRecurringDate(startDate, interval) {
  const date = new Date(startDate);

  switch (interval) {
    case "DAILY":
      date.setDate(date.getDate() + 1);
      break;
    case "WEEKLY":
      date.setDate(date.getDate() + 7);
      break;
    case "MONTHLY":
      date.setMonth(date.getMonth() + 1);
      break;
    case "YEARLY":
      date.setFullYear(date.getFullYear() + 1);
      break;
  }

  return date;
}
function isTransactionDue(transaction) {
  if (!transaction.lastProcessed) return true;
  const today = new Date();
  const nextDue = new Date(transaction.nextRecurringDate);

  return nextDue <= today;
}

export const generateMonthlyReports=inngest.createFunction({
  id:"generate-monthly-reports",
  name:"Generate Mnthly Reports",
},
{ cron:"0 0 1 * *"},
async({step})=>{
  const users= await step.run("fetch-users",async() => {
    return await db.user.findMany({
      include: {accounts: true}
    })
  });

  for(const user of users){
    await step.run(`generate-report-${user.id}`,async ()=>{
      const lastMonth=new Date();
      lastMonth.setMonth(lastMonth.getMonth()-1);

      const stats= await getMonthlyStats(user.id,lastMonth);
      const monthName=lastMonth.toLocaleString("default",{
        month:"long"
      });
      const insights= await generateFinancialInsights(stats, monthName);
      await sendEmail({
        to: user.email,
        subject: `Your Monthly Finanacial Report - ${monthName}`,
        react: EmailTemplate({
          userName: user.name,
          type: "monthly-report",
          data: {
            stats,
            month:monthName,
            insights
          },
        }),
      });
    })
  }
 return {processed:users.length}
}
);

export async function generateFinancialInsights(stats,month){
  const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model=genAI.getGenerativeModel({model:"gemini-2.5-flash"})
  const prompt = `
  Analyze this financial data and provide 3 concise, actionable insights.
  Focus on spending patterns and practical advice.
  Keep it friendly and conversational.

  Financial Data for ${month}:
  - Total Income: $${stats.totalIncome}
  - Total Expenses: $${stats.totalExpenses}
  - Net Income: $${stats.totalIncome - stats.totalExpenses}
  - Expense Categories: ${Object.entries(stats.byCategory)
    .map(([category, amount]) => `${category}: $${amount}`)
    .join(", ")}

  Format the response as a JSON array of strings, like this:
  ["insight 1", "insight 2", "insight 3"]
`;
try {
  const result = await model.generateContent(prompt);
  const response = result.response;
  const text = response.text();
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();

  return JSON.parse(cleanedText);
} catch (error) {
  console.error("Error generating insights:", error);
  return [
    "Your highest expense category this month might need attention.",
    "Consider setting up a budget for better financial management.",
    "Track your recurring expenses to identify potential savings.",
  ];
}


}

async function getMonthlyStats(userId, month) {
  const startDate = new Date(month.getFullYear(), month.getMonth(), 1);
  const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
  });

  return transactions.reduce(
    (stats, t) => {
      const amount = t.amount.toNumber();
      if (t.type === "EXPENSE") {
        stats.totalExpenses += amount;
        stats.byCategory[t.category] =
          (stats.byCategory[t.category] || 0) + amount;
      } else {
        stats.totalIncome += amount;
      }
      return stats;
    },
    {
      totalExpenses: 0,
      totalIncome: 0,
      byCategory: {},
      transactionCount: transactions.length,
    }
  );
}

