import cron from 'node-cron';
import { prisma } from '../config/prisma';
import { logger } from '../config/logger';

/**
 * Scheduled background jobs.
 *
 * Daily queue reset: every day at 00:30 (Asia/Tashkent) any appointment still
 * sitting in the active queue (PENDING / IN_PROGRESS) is cancelled, so each day
 * starts with a clean "Navbat" list — mirrors the Stitch spec:
 * "Barcha navbatlar har kuni soat 00:30 da avtomatik tarzda tozalanadi."
 */
export function startCronJobs(): void {
  cron.schedule(
    '30 0 * * *',
    async () => {
      try {
        const { count } = await prisma.appointment.updateMany({
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } },
          data: { status: 'CANCELLED' },
        });
        logger.info(`Daily queue reset: ${count} appointment(s) cleared`);
      } catch (err) {
        logger.error(err, 'Daily queue reset failed');
      }
    },
    { timezone: 'Asia/Tashkent' },
  );

  logger.info('Cron jobs scheduled (daily queue reset at 00:30)');
}
