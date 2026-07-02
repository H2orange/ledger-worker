import { createRoute } from '../lib/context';

export const uploadRoutes = createRoute();

// POST /api/upload
uploadRoutes.post('/', async (c) => {
  const formData = await c.req.formData();
  const file = formData.get('file');

  if (!file || typeof file === 'string') {
    return c.json({ error: 'No file provided' }, 400);
  }

  const fileObj = file as unknown as { type: string; size: number; name: string; stream: () => ReadableStream };

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(fileObj.type)) {
    return c.json({ error: 'Invalid file type. Only JPEG, PNG, GIF, WebP are allowed' }, 400);
  }

  // Validate file size (max 5MB)
  const maxSize = 5 * 1024 * 1024;
  if (fileObj.size > maxSize) {
    return c.json({ error: 'File too large. Maximum size is 5MB' }, 400);
  }

  const key = `images/${crypto.randomUUID()}-${fileObj.name}`;
  await (c.env as { IMAGES: R2Bucket }).IMAGES.put(key, fileObj.stream(), {
    httpMetadata: {
      contentType: fileObj.type,
    },
  });

  return c.json({
    key,
    name: fileObj.name,
    size: fileObj.size,
    type: fileObj.type,
  });
});