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
      transactionDate: transactions.transactionDate,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(like(transactions.transactionDate, `${month}%`));

  const totalExpense = txns.reduce((sum, t) => sum + t.amount, 0);

  // Group by category
  const expenseByCategory: Record<string, { name: string; icon: string; amount: number }> = {};

  for (const t of txns) {
    const catName = t.categoryName || '未分类';
    const catIcon = t.categoryIcon || '📦';

    if (!expenseByCategory[t.categoryId]) {
      expenseByCategory[t.categoryId] = { name: catName, icon: catIcon, amount: 0 };
    }
    expenseByCategory[t.categoryId].amount += t.amount;
  }

  return c.json({
    month,
    summary: {
      totalExpense,
      transactionCount: txns.length,
    },
    transactions: txns,
    expenseByCategory: Object.values(expenseByCategory).sort((a, b) => b.amount - a.amount),
  });
});