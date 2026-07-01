import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@brighten/database';

export const ratesRouter = new Hono();

const createRateSchema = z.object({
  role: z.enum(['ADMIN', 'DISPATCHER', 'FIELD_TECH']),
  ratePerHour: z.number().positive(),
  overtimeMultiplier: z.number().positive().default(1.5),
  effectiveFrom: z.string().datetime(),
  effectiveTo: z.string().datetime().optional().nullable(),
});

// GET /api/rates
ratesRouter.get('/', async (c) => {
  const role = c.req.query('role');
  const rates = await prisma.rate.findMany({
    where: role ? { role } : undefined,
    orderBy: [{ role: 'asc' }, { effectiveFrom: 'desc' }],
  });
  return c.json({ data: rates });
});

// POST /api/rates
ratesRouter.post('/', zValidator('json', createRateSchema), async (c) => {
  const body = c.req.valid('json');
  const rate = await prisma.rate.create({
    data: {
      ...body,
      effectiveFrom: new Date(body.effectiveFrom),
      effectiveTo: body.effectiveTo ? new Date(body.effectiveTo) : null,
    },
  });
  return c.json({ data: rate }, 201);
});
