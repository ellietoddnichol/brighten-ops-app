import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { jobsRouter } from './routes/jobs.js';
import { employeesRouter } from './routes/employees.js';
import { ratesRouter } from './routes/rates.js';
import { labourRouter } from './routes/labour.js';
import { calculatorRouter } from './routes/calculator.js';

export const app = new Hono();

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use('*', logger());
app.use('/api/*', cors({ origin: process.env['NEXT_PUBLIC_API_URL'] ?? '*' }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get('/health', (c) => c.json({ status: 'ok' }));

// ─── Routes ───────────────────────────────────────────────────────────────────

app.route('/api/jobs', jobsRouter);
app.route('/api/employees', employeesRouter);
app.route('/api/rates', ratesRouter);
app.route('/api/labour', labourRouter);
app.route('/api/calculator', calculatorRouter);

// ─── 404 handler ──────────────────────────────────────────────────────────────

app.notFound((c) => c.json({ error: { message: 'Not found' } }, 404));

// ─── Error handler ────────────────────────────────────────────────────────────

app.onError((err, c) => {
  console.error(err);
  return c.json({ error: { message: 'Internal server error' } }, 500);
});
