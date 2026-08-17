import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPatientRecord } from '../services/patients';
import { payDebt, remindDebt, DebtActionError } from '../services/debtActions';
import { getAllSettings, getNumberSetting } from '../services/settings';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN', 'DIRECTOR'));

const patientSchema = z.object({
  fullName: z.string().min(1),
  birthDate: z.coerce.date(),
  gender: z.enum(['MALE', 'FEMALE']),
  phone: z.string().min(1),
  address: z.string().optional(),
  occupation: z.string().optional(),
  diagnosis: z.string().min(1),
  dailyAnalysis: z.string().optional(),
  treatmentHistory: z.string().optional(),
  treatmentPlan: z.string().optional(),
  paymentType: z.enum(['CASH', 'CLICK', 'DEBT']),
  consentImage: z.string().optional(),
  doctorId: z.string().uuid(),
  amount: z.number().min(0).default(0),
});

router.post('/patients', validate(patientSchema), async (req: AuthRequest, res: Response) => {
  try {
    const record = await createPatientRecord(req.body);
    sendSuccess(res, record, 'Patient registered', 201);
  } catch (err) {
    sendError(res, 'Failed to register patient', 500);
  }
});

router.get('/patients', async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query;
    const page = Math.max(1, parseInt(String(q.page ?? ''), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(q.limit ?? ''), 10) || 20));
    const search = typeof q.search === 'string' ? q.search : undefined;
    const doctorId = typeof q.doctorId === 'string' ? q.doctorId : undefined;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    if (doctorId) where.doctorId = doctorId;

    const [records, total] = await Promise.all([
      prisma.patientRecord.findMany({
        where,
        include: { doctor: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.patientRecord.count({ where }),
    ]);

    sendSuccess(res, { records, total, page, totalPages: Math.ceil(total / limit) });
  } catch {
    sendError(res, 'Failed to load patients', 500);
  }
});

router.get('/patients/:id', async (req: AuthRequest, res: Response) => {
  try {
    const record = await prisma.patientRecord.findUnique({
      where: { id: req.params.id as string },
      include: {
        doctor: { select: { id: true, name: true } },
        debts: true,
      },
    });
    if (!record) {
      sendError(res, 'Patient not found', 404);
      return;
    }
    sendSuccess(res, record);
  } catch {
    sendError(res, 'Failed to load patient', 500);
  }
});

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

// Reception dashboard — financial overview + quarterly forecast
router.get('/dashboard', async (_req: AuthRequest, res: Response) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);

    const [equity, debtSum, debtCount, todayIncome, monthlyIncome, quarterIncome, totalPatients, todayPatients] =
      await Promise.all([
        prisma.owner.aggregate({ where: { isActive: true }, _sum: { capitalBalance: true } }),
        prisma.debt.aggregate({ where: { isPaid: false }, _sum: { amount: true } }),
        prisma.debt.count({ where: { isPaid: false } }),
        prisma.transaction.aggregate({ where: { type: 'INCOME', createdAt: { gte: startOfDay } }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { type: 'INCOME', createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { type: 'INCOME', createdAt: { gte: startOfQuarter } }, _sum: { amount: true } }),
        prisma.patientRecord.count(),
        prisma.patientRecord.count({ where: { createdAt: { gte: startOfDay } } }),
      ]);

    const quarterlyTarget = await getNumberSetting('quarterlyTarget', 0);
    const realized = Number(quarterIncome._sum.amount || 0);
    const outstandingDebt = Number(debtSum._sum.amount || 0);

    sendSuccess(res, {
      totalEquity: Number(equity._sum.capitalBalance || 0),
      activeDebt: { amount: outstandingDebt, count: debtCount },
      todayVolume: Number(todayIncome._sum.amount || 0),
      monthlyIncome: Number(monthlyIncome._sum.amount || 0),
      patients: { total: totalPatients, today: todayPatients },
      forecast: {
        quarterlyTarget,
        realized,
        realizedPct: quarterlyTarget > 0 ? Math.round((realized / quarterlyTarget) * 100) : 0,
        projectedDebtRecovery: outstandingDebt,
      },
    });
  } catch {
    sendError(res, 'Failed to load dashboard', 500);
  }
});

// Appointment schedule (reception view of all active queues)
router.get('/appointments', async (_req: AuthRequest, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
      include: { doctor: { select: { id: true, name: true } } },
    });
    sendSuccess(res, appointments);
  } catch {
    sendError(res, 'Failed to load appointments', 500);
  }
});

const adminStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

router.patch('/appointments/:id/status', validate(adminStatusSchema), async (req: AuthRequest, res: Response) => {
  try {
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status },
    });
    sendSuccess(res, appointment, 'Appointment updated');
  } catch {
    sendError(res, 'Failed to update appointment', 500);
  }
});

// Clinic settings (read-only for admin/reception)
router.get('/settings', async (_req: AuthRequest, res: Response) => {
  try {
    sendSuccess(res, await getAllSettings());
  } catch {
    sendError(res, 'Failed to load settings', 500);
  }
});

// Owners / shareholders (read-only for admin/reception)
router.get('/owners', async (_req: AuthRequest, res: Response) => {
  try {
    const raw = await prisma.owner.findMany({
      where: { isActive: true },
      orderBy: { ownershipPct: 'desc' },
    });
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

router.get('/doctors', async (_req: AuthRequest, res: Response) => {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
    });
    sendSuccess(res, doctors);
  } catch {
    sendError(res, 'Failed to load doctors', 500);
  }
});

export default router;
