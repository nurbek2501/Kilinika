import { prisma } from './config/prisma';
import { hashPassword } from './utils/password';
import { env } from './config/env';
import { logger } from './config/logger';

async function seed() {
  logger.info('Seeding database...');

  // Director
  await prisma.user.upsert({
    where: { phone: env.DIRECTOR_PHONE },
    update: {
      name: env.DIRECTOR_NAME,
      password: await hashPassword(env.DIRECTOR_PASSWORD),
      role: 'DIRECTOR',
    },
    create: {
      name: env.DIRECTOR_NAME,
      phone: env.DIRECTOR_PHONE,
      password: await hashPassword(env.DIRECTOR_PASSWORD),
      role: 'DIRECTOR',
    },
  });
  logger.info('Director account ensured');

  // Doctor
  await prisma.user.upsert({
    where: { phone: env.DOCTOR1_PHONE },
    update: {
      name: env.DOCTOR1_NAME,
      username: env.DOCTOR1_PHONE,
      specialty: 'Stomatolog-terapevt',
      password: await hashPassword(env.DOCTOR1_PASSWORD),
      role: 'DOCTOR',
    },
    create: {
      name: env.DOCTOR1_NAME,
      phone: env.DOCTOR1_PHONE,
      username: env.DOCTOR1_PHONE,
      specialty: 'Stomatolog-terapevt',
      password: await hashPassword(env.DOCTOR1_PASSWORD),
      role: 'DOCTOR',
    },
  });
  logger.info('Doctor account ensured');

  // Admin
  await prisma.user.upsert({
    where: { phone: env.ADMIN_PHONE },
    update: {
      name: env.ADMIN_NAME,
      username: env.ADMIN_PHONE,
      password: await hashPassword(env.ADMIN_PASSWORD),
      role: 'ADMIN',
    },
    create: {
      name: env.ADMIN_NAME,
      phone: env.ADMIN_PHONE,
      username: env.ADMIN_PHONE,
      password: await hashPassword(env.ADMIN_PASSWORD),
      role: 'ADMIN',
    },
  });
  logger.info('Admin account ensured');

  // Services
  const serviceCount = await prisma.servicePrice.count();
  if (serviceCount === 0) {
    await prisma.servicePrice.createMany({
      data: [
        { nameUz: "Tishni davolash", nameRu: "Лечение зуба", nameEn: "Tooth Treatment", price: 200000 },
        { nameUz: "Tish olish", nameRu: "Удаление зуба", nameEn: "Tooth Extraction", price: 150000 },
        { nameUz: "Tish plomba", nameRu: "Пломбирование", nameEn: "Dental Filling", price: 300000 },
        { nameUz: "Tish oqartirish", nameRu: "Отбеливание зубов", nameEn: "Teeth Whitening", price: 500000 },
        { nameUz: "Parodontit davolash", nameRu: "Лечение пародонтита", nameEn: "Periodontitis Treatment", price: 350000 },
        { nameUz: "Protezlash", nameRu: "Протезирование", nameEn: "Dental Prosthetics", price: 1500000 },
        { nameUz: "Implantatsiya", nameRu: "Имплантация", nameEn: "Dental Implant", price: 3000000 },
        { nameUz: "Ortodontiya (breketlar)", nameRu: "Ортодонтия (брекеты)", nameEn: "Orthodontics (Braces)", price: 5000000 },
        { nameUz: "Professional tozalash", nameRu: "Профессиональная чистка", nameEn: "Professional Cleaning", price: 250000 },
        { nameUz: "Konsultatsiya", nameRu: "Консультация", nameEn: "Consultation", price: 50000 },
      ],
    });
    logger.info('Default services created');
  }

  // Settings
  const defaultSettings: Record<string, string> = {
    clinicName: 'Kamoliddin Dental Clinic',
    clinicPhone: '+998 90 123 45 67',
    clinicAddress: 'Toshkent shahri',
    workHours: 'Dush-Shan: 09:00 - 18:00',
    monthlyBudget: '50000000',
    quarterlyTarget: '150000000',
    doctorCommissionRate: '0.35',
    smsEnabled: 'true',
    debtReminderDays: '30',
  };
  for (const [key, value] of Object.entries(defaultSettings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }
  logger.info('Default settings ensured');

  logger.info('Seeding complete');
}

seed()
  .catch((err) => {
    logger.error(err, 'Seed failed');
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());