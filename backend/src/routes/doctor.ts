import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { authenticate, authorize, AuthRequest } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createPatientRecord } from '../services/patients';
import { payDebt, remindDebt, DebtActionError } from '../services/debtActions';
import { getNumberSetting } from '../services/settings';

const router = Router();

router.use(authenticate);
router.use(authorize('DOCTOR'));

router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const doctorId = req.user!.userId;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [todayPatients, monthlyPatients, todayRevenue, monthlyRevenue, appointments] = await Promise.all([
      prisma.patientRecord.count({ where: { doctorId, createdAt: { gte: startOfDay } } }),
      prisma.patientRecord.count({ where: { doctorId, createdAt: { gte: startOfMonth } } }),
      prisma.transaction.aggregate({
        where: { userId: doctorId, type: 'INCOME', createdAt: { gte: startOfDay } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId: doctorId, type: 'INCOME', createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),
      prisma.appointment.count({ where: { doctorId, status: { in: ['PENDING', 'IN_PROGRESS'] } } }),
    ]);

    const todayRev = Number(todayRevenue._sum.amount || 0);
    const monthlyRev = Number(monthlyRevenue._sum.amount || 0);
    const commissionRate = await getNumberSetting('doctorCommissionRate', 0.35);

    sendSuccess(res, {
      patients: { today: todayPatients, monthly: monthlyPatients },
      revenue: { today: todayRev, monthly: monthlyRev },
      commission: { today: Math.round(todayRev * commissionRate), monthly: Math.round(monthlyRev * commissionRate) },
      commissionRate,
      pendingAppointments: appointments,
    });
  } catch {
    sendError(res, 'Failed to load dashboard', 500);
  }
});

router.get('/appointments', async (req: AuthRequest, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: { doctorId: req.user!.userId, status: { in: ['PENDING', 'IN_PROGRESS'] } },
      orderBy: [{ scheduledAt: 'asc' }, { createdAt: 'asc' }],
    });
    sendSuccess(res, appointments);
  } catch {
    sendError(res, 'Failed to load appointments', 500);
  }
});

// Update appointment status (waiting → in progress → completed / cancelled)
const statusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
});

router.patch('/appointments/:id/status', validate(statusSchema), async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.appointment.findUnique({ where: { id: req.params.id as string } });
    if (!existing || existing.doctorId !== req.user!.userId) {
      sendError(res, 'Appointment not found', 404);
      return;
    }
    const appointment = await prisma.appointment.update({
      where: { id: req.params.id as string },
      data: { status: req.body.status },
    });
    sendSuccess(res, appointment, 'Appointment updated');
  } catch {
    sendError(res, 'Failed to update appointment', 500);
  }
});

router.get('/patients', async (req: AuthRequest, res: Response) => {
  try {
    const q = req.query;
    const page = Math.max(1, parseInt(String(q.page ?? ''), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(q.limit ?? ''), 10) || 20));
    const search = typeof q.search === 'string' ? q.search : undefined;
    const skip = (page - 1) * limit;
    const where: any = { doctorId: req.user!.userId };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [records, total] = await Promise.all([
      prisma.patientRecord.findMany({
        where,
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

router.get('/debtors', async (req: AuthRequest, res: Response) => {
  try {
    const debtors = await prisma.debt.findMany({
      where: { doctorId: req.user!.userId, isPaid: false },
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

router.get('/prepaid', async (req: AuthRequest, res: Response) => {
  try {
    const prepaid = await prisma.prepaidBalance.findMany({
      where: { doctorId: req.user!.userId, balance: { gt: 0 } },
      orderBy: { updatedAt: 'desc' },
    });
    sendSuccess(res, prepaid);
  } catch {
    sendError(res, 'Failed to load prepaid patients', 500);
  }
});

// Doctor registers a patient directly ("Yangi bemor qo'shish") — doctorId is forced to self
const doctorPatientSchema = z.object({
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
  amount: z.number().min(0).default(0),
});

router.post('/patients', validate(doctorPatientSchema), async (req: AuthRequest, res: Response) => {
  try {
    const record = await createPatientRecord({ ...req.body, doctorId: req.user!.userId });
    sendSuccess(res, record, 'Patient registered', 201);
  } catch {
    sendError(res, 'Failed to register patient', 500);
  }
});

// Owners / shareholders (read-only)
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

// Debtor actions — restricted to the doctor's own debts
router.patch('/debtors/:id/pay', async (req: AuthRequest, res: Response) => {
  try {
    const debt = await payDebt(req.params.id as string, req.user!.userId, req.user!.userId);
    sendSuccess(res, debt, 'Debt marked as paid');
  } catch (err) {
    if (err instanceof DebtActionError) return sendError(res, err.message, err.status);
    sendError(res, 'Failed to mark debt as paid', 500);
  }
});

router.post('/debtors/:id/remind', async (req: AuthRequest, res: Response) => {
  try {
    const result = await remindDebt(req.params.id as string, req.user!.userId);
    sendSuccess(res, result, result.sent ? 'Reminder sent' : 'Reminder logged (SMS not configured)');
  } catch (err) {
    if (err instanceof DebtActionError) return sendError(res, err.message, err.status);
    sendError(res, 'Failed to send reminder', 500);
  }
});

export default router;
