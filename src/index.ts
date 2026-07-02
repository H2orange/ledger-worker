import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db';
import { categoriesRoutes } from './routes/categories';
import { transactionsRoutes } from './routes/transactions';
import { uploadRoutes } from './routes/upload';
import { billsRoutes } from './routes/bills';
import type { AppContext } from './lib/context';

const app = new Hono<AppContext>();

app.use('*', cors());

// Initialize DB middleware
app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  await next();
});

// Mount routes
app.route('/api/categories', categoriesRoutes);
app.route('/api/transactions', transactionsRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/bills', billsRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

export default app;