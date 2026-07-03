import { createRoute } from '../lib/context';

export const authRoutes = createRoute();

// POST /api/auth/verify — 验证密码，不走 API Key middleware
authRoutes.post('/verify', async (c) => {
  const { password } = await c.req.json();

  if (!password || typeof password !== 'string') {
    return c.json({ error: 'password is required' }, 400);
  }

  const apiKey = c.env.API_KEY;
  if (!apiKey) {
    // 后端未设置 API_KEY 时放行（开发环境友好）
    return c.json({ valid: true });
  }

  if (password === apiKey) {
    return c.json({ valid: true });
  }

  return c.json({ valid: false }, 401);
});
