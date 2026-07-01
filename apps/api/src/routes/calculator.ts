import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@brighten/database';
import { calculateInstallEstimate } from '@brighten/shared';

export const calculatorRouter = new Hono();

const estimateSchema = z.object({
  systemSizeKw: z.number().positive().max(1000),
  panelCount: z.number().int().positive(),
  roofType: z.enum(['composition', 'tile', 'metal', 'flat']),
  hasBattery: z.boolean().default(false),
  hasEvCharger: z.boolean().default(false),
  hasMonitoring: z.boolean().default(false),
  jobId: z.string().optional().nullable(),
});

// POST /api/calculator/estimate
calculatorRouter.post('/estimate', zValidator('json', estimateSchema), async (c) => {
  const body = c.req.valid('json');

  // Validate jobId if provided
  if (body.jobId) {
    const job = await prisma.job.findUnique({ where: { id: body.jobId } });
    if (!job) return c.json({ error: { message: 'Job not found' } }, 404);
  }

  // Find active FIELD_TECH rate
  const now = new Date();
  const fieldTechRate = await prisma.rate.findFirst({
    where: {
      role: 'FIELD_TECH',
      effectiveFrom: { lte: now },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: now } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!fieldTechRate) {
    return c.json(
      { error: { message: 'No active FIELD_TECH rate found', code: 'NO_ACTIVE_RATE' } },
      422,
    );
  }

  const estimate = calculateInstallEstimate({
    systemSizeKw: body.systemSizeKw,
    panelCount: body.panelCount,
    roofType: body.roofType,
    hasBattery: body.hasBattery,
    hasEvCharger: body.hasEvCharger,
    hasMonitoring: body.hasMonitoring,
    fieldTechRatePerHour: fieldTechRate.ratePerHour,
  });

  const run = await prisma.calculatorRun.create({
    data: {
      jobId: body.jobId ?? null,
      systemSizeKw: body.systemSizeKw,
      panelCount: body.panelCount,
      roofType: body.roofType,
      hasBattery: body.hasBattery,
      hasEvCharger: body.hasEvCharger,
      hasMonitoring: body.hasMonitoring,
      ...estimate,
    },
  });

  return c.json({ data: run }, 201);
});

// GET /api/calculator/runs
calculatorRouter.get('/runs', async (c) => {
  const jobId = c.req.query('jobId');
  const runs = await prisma.calculatorRun.findMany({
    where: jobId ? { jobId } : undefined,
    orderBy: { createdAt: 'desc' },
  });
  return c.json({ data: runs });
});
