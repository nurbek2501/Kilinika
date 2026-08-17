import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { hashPassword } from '../utils/password';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { Prisma } from '@prisma/client';
import { getAllSettings, setSettings, getNumberSetting } from '../services/settings';
import { payDebt, remindDebt, DebtActionError } from '../services/debtActions';

const router = Router();

router.use(authenticate);
router.use(authorize('DIRECTOR'));

// Dashboard stats
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    const [
      totalIncome,
      totalExpenses,
      todayIncome,
      monthlyIncome,
      yearlyIncome,
      todayExpenses,
      monthlyExpenses,
      yearlyExpenses,
      totalPatients,
      todayPatients,
      monthlyPatients,
      totalDebt,
      doctorStats,
    ] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: { in: ['EXPENSE', 'UTILITY'] } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: 'INCOME', createdAt: { gte: startOfDay } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: 'INCOME', createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: 'INCOME', createdAt: { gte: startOfYear } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: { in: ['EXPENSE', 'UTILITY'] }, createdAt: { gte: startOfDay } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: { in: ['EXPENSE', 'UTILITY'] }, createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: { in: ['EXPENSE', 'UTILITY'] }, createdAt: { gte: startOfYear } }, _sum: { amount: true } }),
      prisma.patientRecord.count(),
      prisma.patientRecord.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.patientRecord.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.debt.aggregate({ where: { isPaid: false }, _sum: { amount: true } }),
      prisma.user.findMany({
        where: { role: 'DOCTOR', isActive: true },
        select: {
          id: true, name: true, specialty: true, username: true,
          patientRecords: { select: { amount: true } },
        },
      }),
    ]);

    // Monthly utility payments grouped by category (electricity, water/gas, ...)
    const utilityGroups = await prisma.transaction.groupBy({
      by: ['category'],
      where: { type: 'UTILITY', createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    });
    const utilities: Record<string, number> = {};
    let utilitiesTotal = 0;
    for (const g of utilityGroups) {
      const amt = Number(g._sum.amount || 0);
      utilities[g.category ?? 'OTHER'] = amt;
      utilitiesTotal += amt;
    }

    // Owners / shareholders equity
    const ownersAgg = await prisma.owner.aggregate({
      where: { isActive: true },
      _sum: { capitalBalance: true, ownershipPct: true },
      _count: true,
    });

    const commissionRate = await getNumberSetting('doctorCommissionRate', 0.35);
    const monthlyBudget = await getNumberSetting('monthlyBudget', 0);
    const monthlyExpensesVal = Number(monthlyExpenses._sum.amount || 0);

    // Per-doctor revenue/salary is on a BILLED basis (all patientRecord.amount,
    // incl. debt) — commission is earned when the service is rendered.
    const doctors = doctorStats.map(d => {
      const totalRevenue = d.patientRecords.reduce((sum, r) => sum + Number(r.amount), 0);
      return {
        id: d.id,
        name: d.name,
        specialty: d.specialty,
        username: d.username,
        patientCount: d.patientRecords.length,
        totalRevenue,
        salary: Math.round(totalRevenue * commissionRate),
      };
    });

    sendSuccess(res, {
      revenue: {
        total: Number(totalIncome._sum.amount || 0),
        today: Number(todayIncome._sum.amount || 0),
        monthly: Number(monthlyIncome._sum.amount || 0),
        yearly: Number(yearlyIncome._sum.amount || 0),
      },
      expenses: {
        total: Number(totalExpenses._sum.amount || 0),
        today: Number(todayExpenses._sum.amount || 0),
        monthly: monthlyExpensesVal,
        yearly: Number(yearlyExpenses._sum.amount || 0),
      },
      profit: {
        total: Number(totalIncome._sum.amount || 0) - Number(totalExpenses._sum.amount || 0),
        monthly: Number(monthlyIncome._sum.amount || 0) - monthlyExpensesVal,
        yearly: Number(yearlyIncome._sum.amount || 0) - Number(yearlyExpenses._sum.amount || 0),
      },
      budget: {
        monthly: monthlyBudget,
        used: monthlyExpensesVal,
        percentUsed: monthlyBudget > 0 ? Math.round((monthlyExpensesVal / monthlyBudget) * 100) : 0,
      },
      utilities: { total: utilitiesTotal, byCategory: utilities },
      equity: {
        total: Number(ownersAgg._sum.capitalBalance || 0),
        ownersCount: ownersAgg._count,
        totalOwnershipPct: Number(ownersAgg._sum.ownershipPct || 0),
      },
      patients: { total: totalPatients, today: todayPatients, monthly: monthlyPatients },
      totalDebt: Number(totalDebt._sum.amount || 0),
      commissionRate,
      doctors,
    });
  } catch (err) {
    sendError(res, 'Failed to load dashboard', 500);
  }
});

// User management
const createUserSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(1),
  username: z.string().min(1).optional(),
  specialty: z.string().optional(),
  password: z.string().min(6),
  role: z.enum(['ADMIN', 'DOCTOR']),
});

router.post('/users', validate(createUserSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, username, specialty, password, role } = req.body;
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        name,
        phone,
        username: username || null,
        specialty: role === 'DOCTOR' ? specialty || null : null,
        password: hashed,
        role,
      },
      select: { id: true, name: true, phone: true, username: true, specialty: true, role: true, isActive: true },
    });
    sendSuccess(res, user, 'User created', 201);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      sendError(res, 'Phone number or username already exists', 409);
      return;
    }
    sendError(res, 'Failed to create user', 500);
  }
});

router.get('/users', async (_req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'DOCTOR'] } },
      select: { id: true, name: true, phone: true, username: true, specialty: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    sendSuccess(res, users);
  } catch {
    sendError(res, 'Failed to load users', 500);
  }
});

const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  specialty: z.string().optional(),
  password: z.string().min(6).optional(),
  role: z.enum(['ADMIN', 'DOCTOR']).optional(),
});

router.put('/users/:id', validate(updateUserSchema), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const data: any = { ...req.body };
    if (data.password) {
      data.password = await hashPassword(data.password);
    }
    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, phone: true, username: true, specialty: true, role: true, isActive: true },
    });
    sendSuccess(res, user, 'User updated');
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      sendError(res, 'Phone number or username already exists', 409);
      return;
    }
    sendError(res, 'Failed to update user', 500);
  }
});

router.delete('/users/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.user.update({ where: { id }, data: { isActive: false } });
    sendSuccess(res, null, 'User deactivated');
  } catch {
    sendError(res, 'Failed to deactivate user', 500);
  }
});

// Debtors
router.get('/debtors', async (_req: AuthRequest, res: Response) => {
  try {
    const debtors = await prisma.debt.findMany({
      where: { isPaid: false },
      orderBy: { deadline: 'asc' },
      include: { patientRecord: { select: { visitDate: true } } },
    });
    // Serialize Decimal `amount` as a real number so the client can sum it
    // (a raw Prisma Decimal serializes to a string → string concatenation).
    sendSuccess(res, debtors.map((d) => ({ ...d, amount: Number(d.amount) })));
  } catch {
    sendError(res, 'Failed to load debtors', 500);
  }
});

// Prepaid patients
router.get('/prepaid', async (_req: AuthRequest, res: Response) => {
  try {
    const prepaid = await prisma.prepaidBalance.findMany({
      where: { balance: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, prepaid);
  } catch {
    sendError(res, 'Failed to load prepaid patients', 500);
  }
});

// Services
router.get('/services', async (_req: AuthRequest, res: Response) => {
  try {
    const services = await prisma.servicePrice.findMany({ orderBy: { nameUz: 'asc' } });
    sendSuccess(res, services);
  } catch {
    sendError(res, 'Failed to load services', 500);
  }
});

const updateServiceSchema = z.object({
  nameUz: z.string().optional(),
  nameRu: z.string().optional(),
  nameEn: z.string().optional(),
  price: z.number().positive().optional(),
  isActive: z.boolean().optional(),
});

router.put('/services/:id', validate(updateServiceSchema), async (req: AuthRequest, res: Response) => {
  try {
    const service = await prisma.servicePrice.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    sendSuccess(res, service, 'Service updated');
  } catch {
    sendError(res, 'Failed to update service', 500);
  }
});

const createServiceSchema = z.object({
  nameUz: z.string().min(1),
  nameRu: z.string().min(1),
  nameEn: z.string().min(1),
  price: z.number().positive(),
});

router.post('/services', validate(createServiceSchema), async (req: AuthRequest, res: Response) => {
  try {
    const service = await prisma.servicePrice.create({ data: req.body });
    sendSuccess(res, service, 'Service created', 201);
  } catch {
    sendError(res, 'Failed to create service', 500);
  }
});

// Expenses / Utility payments
const expenseSchema = z.object({
  type: z.enum(['EXPENSE', 'UTILITY']),
  amount: z.number().positive(),
  category: z.enum(['ELECTRICITY', 'WATER_GAS', 'INTERNET', 'RENT', 'OTHER']).optional(),
  description: z.string().optional(),
});

router.post('/expenses', validate(expenseSchema), async (req: AuthRequest, res: Response) => {
  try {
    const tx = await prisma.transaction.create({
      data: {
        type: req.body.type,
        amount: req.body.amount,
        category: req.body.type === 'UTILITY' ? (req.body.category ?? 'OTHER') : null,
        description: req.body.description,
        userId: req.user!.userId,
      },
    });
    sendSuccess(res, tx, 'Expense recorded', 201);
  } catch {
    sendError(res, 'Failed to record expense', 500);
  }
});

// Recent expenses list (for the expenses page history)
router.get('/expenses', async (_req: AuthRequest, res: Response) => {
  try {
    const expenses = await prisma.transaction.findMany({
      where: { type: { in: ['EXPENSE', 'UTILITY'] } },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    sendSuccess(res, expenses);
  } catch {
    sendError(res, 'Failed to load expenses', 500);
  }
});

// ─── Owners / Shareholders ("Mulkdorlar") ───────────────────────────────
const ownerSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  phone: z.string().optional(),
  ownershipPct: z.number().min(0).max(100).default(0),
  capitalBalance: z.number().default(0),
});

router.get('/owners', async (_req: AuthRequest, res: Response) => {
  try {
    const raw = await prisma.owner.findMany({
      where: { isActive: true },
      orderBy: { ownershipPct: 'desc' },
    });
    // Serialize Decimals to real numbers (they'd otherwise be JSON strings).
    const owners = raw.map((o) => ({
      ...o,
      ownershipPct: Number(o.ownershipPct),
      capitalBalance: Number(o.capitalBalance),
    }));
    const totalEquity = owners.reduce((s, o) => s + o.capitalBalance, 0);
    const totalPct = Math.round(owners.reduce((s, o) => s + o.ownershipPct, 0) * 100) / 100;
    sendSuccess(res, { owners, totalEquity, totalPct });
  } catch {
    sendError(res, 'Failed to load owners', 500);
  }
});

router.post('/owners', validate(ownerSchema), async (req: AuthRequest, res: Response) => {
  try {
    // Ownership shares can't total more than 100% across all active owners.
    const agg = await prisma.owner.aggregate({ where: { isActive: true }, _sum: { ownershipPct: true } });
    const currentTotal = Number(agg._sum.ownershipPct || 0);
    if (currentTotal + Number(req.body.ownershipPct || 0) > 100.0001) {
      sendError(res, `Jami ulush 100% dan oshib ketadi. Hozir taqsimlangan: ${Math.round(currentTotal * 100) / 100}%`, 400);
      return;
    }
    const owner = await prisma.owner.create({ data: req.body });
    sendSuccess(res, owner, 'Owner created', 201);
  } catch {
    sendError(res, 'Failed to create owner', 500);
  }
});

router.put('/owners/:id', validate(ownerSchema.partial()), async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    // Re-check the 100% cap against the OTHER owners (exclude the one being edited).
    if (req.body.ownershipPct != null) {
      const agg = await prisma.owner.aggregate({
        where: { isActive: true, id: { not: id } },
        _sum: { ownershipPct: true },
      });
      const othersTotal = Number(agg._sum.ownershipPct || 0);
      if (othersTotal + Number(req.body.ownershipPct) > 100.0001) {
        sendError(res, `Jami ulush 100% dan oshib ketadi. Boshqa egalar: ${Math.round(othersTotal * 100) / 100}%`, 400);
        return;
      }
    }
    const owner = await prisma.owner.update({ where: { id }, data: req.body });
    sendSuccess(res, owner, 'Owner updated');
  } catch {
    sendError(res, 'Failed to update owner', 500);
  }
});

router.delete('/owners/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.owner.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    sendSuccess(res, null, 'Owner removed');
  } catch {
    sendError(res, 'Failed to remove owner', 500);
  }
});

// ─── Debtor actions (pay / remind) ──────────────────────────────────────
router.patch('/debtors/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const debt = await payDebt(req.params.id as string, req.user!.userId);
    sendSuccess(res, debt, 'Debt marked as paid');
  } catch (err) {
    if (err instanceof DebtActionError) return sendError(res, err.message, err.status);
    sendError(res, 'Failed to mark debt as paid', 500);
  }
});

router.post('/debtors/:id/remind', async (req: AuthRequest, res: Response) => {
  try {
    const result = await remindDebt(req.params.id as string);
    sendSuccess(res, result, result.sent ? 'Reminder sent' : 'Reminder logged (SMS not configured)');
  } catch (err) {
    if (err instanceof DebtActionError) return sendError(res, err.message, err.status);
    sendError(res, 'Failed to send reminder', 500);
  }
});

// ─── Settings ───────────────────────────────────────────────────────────
router.get('/settings', async (_req: AuthRequest, res: Response) => {
  try {
    sendSuccess(res, await getAllSettings());
  } catch {
    sendError(res, 'Failed to load settings', 500);
  }
});

const settingsSchema = z.record(z.string(), z.string());

router.put('/settings', validate(settingsSchema), async (req: AuthRequest, res: Response) => {
  try {
    await setSettings(req.body);
    sendSuccess(res, await getAllSettings(), 'Settings saved');
  } catch {
    sendError(res, 'Failed to save settings', 500);
  }
});

// ─── Financial report (structured summary for CSV export) ───────────────
router.get('/report', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [income, expenses, debt, owners, doctors] = await Promise.all([
      prisma.transaction.aggregate({ where: { type: 'INCOME', createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: { in: ['EXPENSE', 'UTILITY'] }, createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.debt.aggregate({ where: { isPaid: false }, _sum: { amount: true } }),
      prisma.owner.findMany({ where: { isActive: true }, orderBy: { ownershipPct: 'desc' } }),
      prisma.user.findMany({
        where: { role: 'DOCTOR', isActive: true },
        select: { name: true, specialty: true, patientRecords: { select: { amount: true } } },
      }),
    ]);
    const commissionRate = await getNumberSetting('doctorCommissionRate', 0.35);

    sendSuccess(res, {
      generatedAt: now.toISOString(),
      period: 'monthly',
      income: Number(income._sum.amount || 0),
      expenses: Number(expenses._sum.amount || 0),
      profit: Number(income._sum.amount || 0) - Number(expenses._sum.amount || 0),
      outstandingDebt: Number(debt._sum.amount || 0),
      owners: owners.map(o => ({ name: o.name, title: o.title, ownershipPct: Number(o.ownershipPct), capitalBalance: Number(o.capitalBalance) })),
      // Per-doctor revenue/salary on a BILLED basis (all patientRecord.amount).
      doctors: doctors.map(d => {
        const rev = d.patientRecords.reduce((s, r) => s + Number(r.amount), 0);
        return { name: d.name, specialty: d.specialty, revenue: rev, salary: Math.round(rev * commissionRate) };
      }),
    });
  } catch {
    sendError(res, 'Failed to build report', 500);
  }
});

export default router;
