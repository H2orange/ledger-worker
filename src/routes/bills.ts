import { createRoute } from '../lib/context';
import { eq, like } from 'drizzle-orm';
import { transactions, categories } from '../db/schema';

export const billsRoutes = createRoute();

// GET /api/bills/:month (e.g., 2024-07)
billsRoutes.get('/:month', async (c) => {
  const db = c.var.db;
  const month = c.req.param('month');

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return c.json({ error: 'Invalid month format. Use YYYY-MM' }, 400);
  }

  // Get all transactions for the month
  const txns = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      description: transactions.description,
      imageKey: transactions.imageKey,
      transactionDate: transactions.transactionDate,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(like(transactions.transactionDate, `${month}%`));

  // Calculate summaries
  const totalIncome = txns
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = txns
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const incomeByCategory: Record<string, { name: string; icon: string; amount: number }> = {};
  const expenseByCategory: Record<string, { name: string; icon: string; amount: number }> = {};

  for (const t of txns) {
    const catName = t.categoryName || '未分类';
    const catIcon = t.categoryIcon || '📦';

    if (t.type === 'income') {
      if (!incomeByCategory[t.categoryId]) {
        incomeByCategory[t.categoryId] = { name: catName, icon: catIcon, amount: 0 };
      }
      incomeByCategory[t.categoryId].amount += t.amount;
    } else {
      if (!expenseByCategory[t.categoryId]) {
        expenseByCategory[t.categoryId] = { name: catName, icon: catIcon, amount: 0 };
      }
      expenseByCategory[t.categoryId].amount += t.amount;
    }
  }

  return c.json({
    month,
    summary: {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    },
    transactions: txns,
    incomeByCategory: Object.values(incomeByCategory).sort((a, b) => b.amount - a.amount),
    expenseByCategory: Object.values(expenseByCategory).sort((a, b) => b.amount - a.amount),
  });
});