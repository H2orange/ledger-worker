import { createRoute } from '../lib/context';
import { eq } from 'drizzle-orm';
import { categories } from '../db/schema';

export const categoriesRoutes = createRoute();

// GET /api/categories
categoriesRoutes.get('/', async (c) => {
  const db = c.var.db;
  const result = await db.select().from(categories).orderBy(categories.sortOrder);
  return c.json(result);
});

// POST /api/categories
categoriesRoutes.post('/', async (c) => {
  const db = c.var.db;
  const body = await c.req.json();
  const { name, type, icon } = body;

  if (!name || !type) {
    return c.json({ error: 'name and type are required' }, 400);
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  await db.insert(categories).values({
    id,
    name,
    type,
    icon: icon || '📦',
    sortOrder: 0,
    createdAt: now,
  });

  const result = await db.select().from(categories).where(eq(categories.id, id));
  return c.json(result[0], 201);
});

// PUT /api/categories/:id
categoriesRoutes.put('/:id', async (c) => {
  const db = c.var.db;
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, type, icon, sortOrder } = body;

  const existing = await db.select().from(categories).where(eq(categories.id, id));
  if (existing.length === 0) {
    return c.json({ error: 'Category not found' }, 404);
  }

  const updateData: any = {};
  if (name !== undefined) updateData.name = name;
  if (type !== undefined) updateData.type = type;
  if (icon !== undefined) updateData.icon = icon;
  if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

  await db.update(categories).set(updateData).where(eq(categories.id, id));

  const result = await db.select().from(categories).where(eq(categories.id, id));
  return c.json(result[0]);
});

// DELETE /api/categories/:id
categoriesRoutes.delete('/:id', async (c) => {
  const db = c.var.db;
  const id = c.req.param('id');

  const existing = await db.select().from(categories).where(eq(categories.id, id));
  if (existing.length === 0) {
    return c.json({ error: 'Category not found' }, 404);
  }

  await db.delete(categories).where(eq(categories.id, id));
  return c.json({ success: true });
});