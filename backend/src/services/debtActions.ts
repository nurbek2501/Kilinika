import { prisma } from '../config/prisma';
import { getSetting } from './settings';
import { sendSms, SmsResult } from './sms';

function money(n: number): string {
  return new Intl.NumberFormat('uz-UZ').format(n);
}

export class DebtActionError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

/**
 * Mark a debt as paid and record the matching INCOME transaction.
 * `restrictDoctorId` limits the action to a doctor's own debts.
 */
export async function payDebt(debtId: string, actorUserId: string, restrictDoctorId?: string) {
  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) throw new DebtActionError('Debt not found', 404);
  if (restrictDoctorId && debt.doctorId !== restrictDoctorId) {
    throw new DebtActionError('Forbidden', 403);
  }
  if (debt.isPaid) throw new DebtActionError('Debt already paid', 409);

  const [updated] = await prisma.$transaction([
    prisma.debt.update({
      where: { id: debtId },
      data: { isPaid: true, paidAt: new Date() },
    }),
    prisma.transaction.create({
      data: {
        type: 'INCOME',
        amount: debt.amount,
        patientRecordId: debt.patientRecordId,
        userId: debt.doctorId || actorUserId,
        description: `Debt payment — ${debt.patientName}`,
      },
    }),
  ]);

  return updated;
}

/** Send a debt reminder SMS and flag the debt as reminded. */
export async function remindDebt(debtId: string, restrictDoctorId?: string): Promise<SmsResult> {
  const debt = await prisma.debt.findUnique({ where: { id: debtId } });
  if (!debt) throw new DebtActionError('Debt not found', 404);
  if (restrictDoctorId && debt.doctorId !== restrictDoctorId) {
    throw new DebtActionError('Forbidden', 403);
  }
  if (debt.isPaid) throw new DebtActionError('Debt already paid', 409);

  const clinic = (await getSetting('clinicName')) || 'KDC Dental Clinic';
  const deadline = new Date(debt.deadline).toLocaleDateString('uz-UZ');
  const message = `Hurmatli ${debt.patientName}, ${clinic}dagi qarzingiz ${money(Number(debt.amount))} so'm. Iltimos, ${deadline} gacha to'lang.`;

  const result = await sendSms(debt.patientPhone, message);

  // Only flag the debt as reminded when an SMS was actually sent; still record
  // the attempt time so a failed/unconfigured send doesn't look like a reminder.
  await prisma.debt.update({
    where: { id: debtId },
    data: { reminderSent: result.sent, lastReminderAt: new Date() },
  });

  return result;
}
