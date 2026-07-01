import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { prisma } from '@brighten/database';

export const employeesRouter = new Hono();

const createEmployeeSchema = z.object({
  employeeNumber: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'DISPATCHER', 'FIELD_TECH']),
  certifications: z.array(z.string()).default([]),
  active: z.boolean().default(true),
});

const updateEmployeeSchema = createEmployeeSchema.partial();

// GET /api/employees
employeesRouter.get('/', async (c) => {
  const activeOnly = c.req.query('active');
  const employees = await prisma.employee.findMany({
    where: activeOnly === 'true' ? { active: true } : undefined,
    orderBy: { lastName: 'asc' },
  });
  return c.json({ data: employees });
});

// GET /api/employees/:id
employeesRouter.get('/:id', async (c) => {
  const employee = await prisma.employee.findUnique({
    where: { id: c.req.param('id') },
    include: {
      assignments: { include: { job: true } },
      labourEntries: { include: { job: true } },
    },
  });
  if (!employee) return c.json({ error: { message: 'Employee not found' } }, 404);
  return c.json({ data: employee });
});

// POST /api/employees
employeesRouter.post('/', zValidator('json', createEmployeeSchema), async (c) => {
  const body = c.req.valid('json');
  const existing = await prisma.employee.findFirst({
    where: { OR: [{ employeeNumber: body.employeeNumber }, { email: body.email }] },
  });
  if (existing) {
    return c.json(
      { error: { message: 'Employee number or email already exists', code: 'DUPLICATE_EMPLOYEE' } },
      409,
    );
  }
  const employee = await prisma.employee.create({
    data: { ...body, certifications: JSON.stringify(body.certifications) },
  });
  return c.json({ data: employee }, 201);
});

// PATCH /api/employees/:id
employeesRouter.patch('/:id', zValidator('json', updateEmployeeSchema), async (c) => {
  const body = c.req.valid('json');
  const existing = await prisma.employee.findUnique({ where: { id: c.req.param('id') } });
  if (!existing) return c.json({ error: { message: 'Employee not found' } }, 404);

  const employee = await prisma.employee.update({
    where: { id: c.req.param('id') },
    data: {
      ...body,
      certifications: body.certifications ? JSON.stringify(body.certifications) : undefined,
    },
  });
  return c.json({ data: employee });
});

// DELETE /api/employees/:id
employeesRouter.delete('/:id', async (c) => {
  const existing = await prisma.employee.findUnique({ where: { id: c.req.param('id') } });
  if (!existing) return c.json({ error: { message: 'Employee not found' } }, 404);
  await prisma.employee.delete({ where: { id: c.req.param('id') } });
  return c.json({ data: { deleted: true } });
});
