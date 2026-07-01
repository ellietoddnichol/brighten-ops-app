import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = Number(process.env['API_PORT'] ?? 3001);
const host = process.env['API_HOST'] ?? 'localhost';

serve({ fetch: app.fetch, port, hostname: host }, (info) => {
  console.log(`🚀  Brighten API running at http://${info.address}:${info.port}`);
});
