import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDb } from './db';
import { categoriesRoutes } from './routes/categories';
import { transactionsRoutes } from './routes/transactions';
import { uploadRoutes } from './routes/upload';
import { billsRoutes } from './routes/bills';
import { authRoutes } from './routes/auth';
import type { AppContext } from './lib/context';

const app = new Hono<AppContext>();

app.use('*', cors());

// API Key 验证中间件（跳过 auth 路由和 health check）
app.use('*', async (c, next) => {
  const path = c.req.path;
  // 跳过不需要验证的路径
  if (path === '/api/health' || path.startsWith('/api/auth')) {
    return next();
  }

  const apiKey = c.env.API_KEY;
  if (!apiKey) {
    // 未设置 API_KEY 时放行（开发环境）
    return next();
  }

  const reqKey = c.req.header('X-API-Key');
  if (reqKey !== apiKey) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  await next();
});

// Initialize DB middleware
app.use('*', async (c, next) => {
  const db = createDb(c.env.DB);
  c.set('db', db);
  await next();
});

// Mount routes
app.route('/api/auth', authRoutes);
app.route('/api/categories', categoriesRoutes);
app.route('/api/transactions', transactionsRoutes);
app.route('/api/upload', uploadRoutes);
app.route('/api/bills', billsRoutes);

// Health check
app.get('/api/health', (c) => c.json({ status: 'ok' }));

export default app;