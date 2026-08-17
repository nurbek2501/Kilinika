import { prisma } from '../config/prisma';

/**
 * Small helper around the Setting key-value table. Holds clinic-wide config:
 * monthlyBudget, doctorCommissionRate, clinicName/Phone/Address, workHours,
 * smsEnabled, debtReminderDays, ...
 */

export async function getSetting(key: string): Promise<string | null> {
  const s = await prisma.setting.findUnique({ where: { key } });
  return s?.value ?? null;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const all = await prisma.setting.findMany();
  return Object.fromEntries(all.map((s) => [s.key, s.value]));
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function setSettings(entries: Record<string, string>): Promise<void> {
  await Promise.all(Object.entries(entries).map(([key, value]) => setSetting(key, value)));
}

export async function getNumberSetting(key: string, fallback: number): Promise<number> {
  const v = await getSetting(key);
  // Treat a blank/whitespace value as "missing" — `Number('')` is 0 (finite),
  // which would otherwise silently zero out commission rate / budgets.
  const t = v?.trim();
  const n = t ? Number(t) : NaN;
  return Number.isFinite(n) ? n : fallback;
}
