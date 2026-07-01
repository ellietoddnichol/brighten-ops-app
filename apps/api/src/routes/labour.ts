import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@brighten/database';
import { computeLabourEntryCost, computeJobLabourSummary } from '@brighten/shared';

export const labourRouter = new Hono();

const clockInSchema = z.object({
  employeeId: z.string().min(1),
  jobId: z.string().min(1),
  clockIn: z.string().datetime(),
  notes: z.string().optional(),
});

const clockOutSchema = z.object({
  clockOut: z.string().datetime(),
});

// GET /api/labour
labourRouter.get('/', async (c) => {
  const jobId = c.req.query('jobId');
  const employeeId = c.req.query('employeeId');
  const entries = await prisma.labourEntry.findMany({
    where: {
      ...(jobId ? { jobId } : {}),
      ...(employeeId ? { employeeId } : {}),
    },
    include: { employee: true, job: true, rate: true },
    orderBy: { clockIn: 'desc' },
  });
  return c.json({ data: entries });
});

// POST /api/labour/clock-in
labourRouter.post('/clock-in', zValidator('json', clockInSchema), async (c) => {
  const body = c.req.valid('json');
  const clockInDate = new Date(body.clockIn);

  // Validate: no future clock-ins
  if (clockInDate > new Date()) {
    return c.json({ error: { message: 'clockIn cannot be in the future' } }, 422);
  }

  // Validate: employee exists and is active
  const employee = await prisma.employee.findUnique({ where: { id: body.employeeId } });
  if (!employee) return c.json({ error: { message: 'Employee not found' } }, 404);
  if (!employee.active) return c.json({ error: { message: 'Employee is inactive' } }, 422);

  // Validate: job exists
  const job = await prisma.job.findUnique({ where: { id: body.jobId } });
  if (!job) return c.json({ error: { message: 'Job not found' } }, 404);

  // Validate: employee assigned to job
  const assignment = await prisma.jobAssignment.findFirst({
    where: { jobId: body.jobId, employeeId: body.employeeId },
  });
  if (!assignment) {
    return c.json({ error: { message: 'Employee is not assigned to this job' } }, 422);
  }

  // Validate: no open shift already
  const openShift = await prisma.labourEntry.findFirst({
    where: { employeeId: body.employeeId, clockOut: null },
  });
  if (openShift) {
    return c.json({ error: { message: 'Employee already has an open shift', code: 'OPEN_SHIFT' } }, 409);
  }

  // Find active rate for the employee's role on clockIn date
  const rate = await prisma.rate.findFirst({
    where: {
      role: employee.role,
      effectiveFrom: { lte: clockInDate },
      OR: [{ effectiveTo: null }, { effectiveTo: { gte: clockInDate } }],
    },
    orderBy: { effectiveFrom: 'desc' },
  });

  if (!rate) {
    return c.json({ error: { message: `No active rate found for role ${employee.role}` } }, 422);
  }

  const entry = await prisma.labourEntry.create({
    data: {
      jobId: body.jobId,
      employeeId: body.employeeId,
      clockIn: clockInDate,
      rateId: rate.id,
      notes: body.notes ?? null,
    },
    include: { employee: true, job: true, rate: true },
  });

  return c.json({ data: entry }, 201);
});

// PATCH /api/labour/:id/clock-out
labourRouter.patch('/:id/clock-out', zValidator('json', clockOutSchema), async (c) => {
  const { id } = c.req.param();
  const body = c.req.valid('json');
  const clockOutDate = new Date(body.clockOut);

  const entry = await prisma.labourEntry.findUnique({
    where: { id },
    include: { rate: true },
  });
  if (!entry) return c.json({ error: { message: 'Labour entry not found' } }, 404);
  if (entry.clockOut) return c.json({ error: { message: 'Entry already clocked out' } }, 409);

  if (clockOutDate < entry.clockIn) {
    return c.json({ error: { message: 'clockOut must be after clockIn' } }, 422);
  }

  const hoursWorked = (clockOutDate.getTime() - entry.clockIn.getTime()) / (1000 * 60 * 60);

  const costResult = computeLabourEntryCost({
    hoursWorked,
    ratePerHour: entry.rate.ratePerHour,
    overtimeMultiplier: entry.rate.overtimeMultiplier,
  });

  const updated = await prisma.labourEntry.update({
    where: { id },
    data: { clockOut: clockOutDate, hoursWorked: Math.round(hoursWorked * 100) / 100 },
    include: { employee: true, job: true, rate: true },
  });

  return c.json({ data: { ...updated, ...costResult } });
});

// GET /api/labour/summary/job/:jobId
labourRouter.get('/summary/job/:jobId', async (c) => {
  const { jobId } = c.req.param();
  const job = await prisma.job.findUnique({ where: { id: jobId } });
  if (!job) return c.json({ error: { message: 'Job not found' } }, 404);

  const entries = await prisma.labourEntry.findMany({
    where: { jobId, clockOut: { not: null } },
    include: { rate: true },
  });

  // Find active FIELD_TECH rate for budgeted cost reference
  const fieldTechRate = await prisma.rate.findFirst({
    where: { role: 'FIELD_TECH', effectiveTo: null },
    orderBy: { effectiveFrom: 'desc' },
  });

  const summary = computeJobLabourSummary({
    entries: entries.map((e) => ({
      hoursWorked: e.hoursWorked ?? 0,
      ratePerHour: e.rate.ratePerHour,
      overtimeMultiplier: e.rate.overtimeMultiplier,
    })),
    budgetedHours: job.budgetedHours ?? 0,
    budgetedRatePerHour: fieldTechRate?.ratePerHour ?? 0,
  });

  return c.json({ data: { jobId, jobNumber: job.jobNumber, ...summary } });
});
