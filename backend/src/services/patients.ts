import { prisma } from '../config/prisma';
import { getNumberSetting, getSetting } from './settings';
import { sendSms } from './sms';
import { logger } from '../config/logger';

export interface PatientInput {
  fullName: string;
  birthDate: Date;
  gender: 'MALE' | 'FEMALE';
  phone: string;
  address?: string;
  occupation?: string;
  diagnosis: string;
  dailyAnalysis?: string;
  treatmentHistory?: string;
  treatmentPlan?: string;
  paymentType: 'CASH' | 'CLICK' | 'DEBT';
  consentImage?: string;
  doctorId: string;
  amount: number;
}

function money(n: number): string {
  return new Intl.NumberFormat('uz-UZ').format(n);
}

/**
 * Shared patient-registration logic used by both the admin (reception) and the
 * doctor panels. Creates the medical record and, based on the payment type,
 * the matching INCOME transaction or DEBT — then fires an optional SMS receipt.
 */
export async function createPatientRecord(data: PatientInput) {
  const record = await prisma.patientRecord.create({ data });

  if (Number(data.amount) > 0 && data.paymentType !== 'DEBT') {
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        amount: data.amount,
        patientRecordId: record.id,
        userId: data.doctorId,
        description: `Payment for ${data.fullName}`,
      },
    });
  }

  if (data.paymentType === 'DEBT' && Number(data.amount) > 0) {
    const reminderDays = await getNumberSetting('debtReminderDays', 30);
    await prisma.debt.create({
      data: {
        patientRecordId: record.id,
        patientName: data.fullName,
        patientPhone: data.phone,
        doctorId: data.doctorId,
        amount: data.amount,
        deadline: new Date(Date.now() + reminderDays * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Fire-and-forget SMS receipt (never blocks/breaks registration).
  void sendRegistrationSms(data).catch((err) =>
    logger.error(err, 'Registration SMS failed'),
  );

  return record;
}

async function sendRegistrationSms(data: PatientInput) {
  const clinic = (await getSetting('clinicName')) || 'KDC Dental Clinic';
  const amountLine =
    Number(data.amount) > 0
      ? ` To'lov: ${money(Number(data.amount))} so'm (${paymentLabel(data.paymentType)}).`
      : '';
  const message = `Hurmatli ${data.fullName}, ${clinic}da ro'yxatdan o'tdingiz. Xizmat: ${data.diagnosis}.${amountLine} Rahmat!`;
  await sendSms(data.phone, message);
}

function paymentLabel(type: PatientInput['paymentType']): string {
  switch (type) {
    case 'CASH':
      return 'Naqd';
    case 'CLICK':
      return 'Click';
    case 'DEBT':
      return 'Qarz';
  }
}
