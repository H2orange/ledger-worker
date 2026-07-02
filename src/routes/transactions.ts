import { createRoute } from '../lib/context';
import { eq, and, like, desc } from 'drizzle-orm';
import { transactions, categories } from '../db/schema';

export const transactionsRoutes = createRoute();

// GET /api/transactions?month=2024-07&category_id=xxx
transactionsRoutes.get('/', async (c) => {
  const db = c.var.db;
  const month = c.req.query('month');
  const categoryId = c.req.query('category_id');

  let query = db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      description: transactions.description,
      imageKey: transactions.imageKey,
      transactionDate: transactions.transactionDate,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(
      and(
        month ? like(transactions.transactionDate, `${month}%`) : undefined,
        categoryId ? eq(transactions.categoryId, categoryId) : undefined,
      )
    );

  const result = await query.orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));
  return c.json(result);
});

// POST /api/transactions
transactionsRoutes.post('/', async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const { type, amount, categoryId, description, imageKey, transactionDate } = body;

  if (!type || !amount || !categoryId || !transactionDate) {
    return c.json({ error: 'type, amount, categoryId, and transactionDate are required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(transactions).values({
    id,
    type,
    amount: Number(amount),
    categoryId,
    description: description || '',
    imageKey: imageKey || null,
    transactionDate,
    createdAt: now,
    updatedAt: now,
  });

  const result = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      description: transactions.description,
      imageKey: transactions.imageKey,
      transactionDate: transactions.transactionDate,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.id, id));

  return c.json(result[0], 201);
});

// PUT /api/transactions/:id
transactionsRoutes.put('/:id', async (c) => {
  const db = c.var.db;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { type, amount, categoryId, description, imageKey, transactionDate } = body;

  const existing = await db.select().from(transactions).where(eq(transactions.id, id));
  if (existing.length === 0) {
    return c.json({ error: 'Transaction not found' }, 404);
  }

  const updateData: any = { updatedAt: new Date().toISOString() };
  if (type !== undefined) updateData.type = type;
  if (amount !== undefined) updateData.amount = Number(amount);
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (description !== undefined) updateData.description = description;
  if (imageKey !== undefined) updateData.imageKey = imageKey;
  if (transactionDate !== undefined) updateData.transactionDate = transactionDate;

  await db.update(transactions).set(updateData).where(eq(transactions.id, id));

  const result = await db
    .select({
      id: transactions.id,
      type: transactions.type,
      amount: transactions.amount,
      categoryId: transactions.categoryId,
      description: transactions.description,
      imageKey: transactions.imageKey,
      transactionDate: transactions.transactionDate,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      categoryName: categories.name,
      categoryIcon: categories.icon,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(eq(transactions.id, id));

  return c.json(result[0]);
});

// DELETE /api/transactions/:id
transactionsRoutes.delete('/:id', async (c) => {
  const db = c.var.db;
  const id = c.req.param('id');

  const existing = await db.select().from(transactions).where(eq(transactions.id, id));
  if (existing.length === 0) {
    return c.json({ error: 'Transaction not found' }, 404);
  }

  await db.delete(transactions).where(eq(transactions.id, id));
  return c.json({ success: true });
});