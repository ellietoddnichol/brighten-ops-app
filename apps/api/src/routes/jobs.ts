import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@brighten/database';

export const jobsRouter = new Hono();

const createJobSchema = z.object({
  jobNumber: z.string().min(1),
  customerName: z.string().min(1),
  siteAddress: z.string().min(1),
  city: z.string().min(1),
  state: z.string().length(2),
  zip: z.string().min(5),
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED']).default('SCHEDULED'),
  systemSizeKw: z.number().positive().max(1000),
  panelCount: z.number().int().positive(),
  inverterType: z.enum(['string', 'micro', 'hybrid']),
  roofType: z.enum(['composition', 'tile', 'metal', 'flat']),
  hasBattery: z.boolean().default(false),
  hasEvCharger: z.boolean().default(false),
  hasMonitoring: z.boolean().default(false),
  scheduledDate: z.string().datetime().optional().nullable(),
  completedDate: z.string().datetime().optional().nullable(),
  budgetedHours: z.number().positive().optional().nullable(),
  notes: z.string().optional().nullable(),
});

const updateJobSchema = createJobSchema.partial();

// GET /api/jobs
jobsRouter.get('/', async (c) => {
  const status = c.req.query('status');
  const jobs = await prisma.job.findMany({
    where: status ? { status } : undefined,
    orderBy: { createdAt: 'desc' },
    include: { assignments: { include: { employee: true } } },
  });
  return c.json({ data: jobs });
});

// GET /api/jobs/:id
jobsRouter.get('/:id', async (c) => {
  const job = await prisma.job.findUnique({
    where: { id: c.req.param('id') },
    include: {
      assignments: { include: { employee: true } },
      labourEntries: { include: { employee: true, rate: true } },
      calculatorRuns: true,
    },
  });
  if (!job) return c.json({ error: { message: 'Job not found' } }, 404);
  return c.json({ data: job });
});

// POST /api/jobs
jobsRouter.post('/', zValidator('json', createJobSchema), async (c) => {
  const body = c.req.valid('json');
  const existing = await prisma.job.findUnique({ where: { jobNumber: body.jobNumber } });
  if (existing) {
    return c.json({ error: { message: 'Job number already exists', code: 'DUPLICATE_JOB_NUMBER' } }, 409);
  }
  const job = await prisma.job.create({
    data: {
      ...body,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : null,
      completedDate: body.completedDate ? new Date(body.completedDate) : null,
    },
  });
  return c.json({ data: job }, 201);
});

// PATCH /api/jobs/:id
jobsRouter.patch('/:id', zValidator('json', updateJobSchema), async (c) => {
  const body = c.req.valid('json');
  const existing = await prisma.job.findUnique({ where: { id: c.req.param('id') } });
  if (!existing) return c.json({ error: { message: 'Job not found' } }, 404);

  const job = await prisma.job.update({
    where: { id: c.req.param('id') },
    data: {
      ...body,
      scheduledDate: body.scheduledDate ? new Date(body.scheduledDate) : undefined,
      completedDate: body.completedDate ? new Date(body.completedDate) : undefined,
    },
  });
  return c.json({ data: job });
});

// DELETE /api/jobs/:id
jobsRouter.delete('/:id', async (c) => {
  const existing = await prisma.job.findUnique({ where: { id: c.req.param('id') } });
  if (!existing) return c.json({ error: { message: 'Job not found' } }, 404);
  await prisma.job.delete({ where: { id: c.req.param('id') } });
  return c.json({ data: { deleted: true } });
});
