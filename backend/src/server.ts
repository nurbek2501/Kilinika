import './config/timezone';
import app from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { prisma } from './config/prisma';
import { startCronJobs } from './services/cron';
import { startTelegramBot } from './services/telegramBot';

async function main() {
  try {
    await prisma.$connect();
    logger.info('Connected to database');

    startCronJobs();

    app.listen(env.PORT, () => {
      logger.info(`KDC API server running on port ${env.PORT}`);
      // Embedded Telegram bot — no-ops when TELEGRAM_BOT_TOKEN is unset, and is
      // isolated so any bot failure can never take the API down.
      startTelegramBot();
    });
  } catch (err) {
    logger.error(err, 'Failed to start server');
    process.exit(1);
  }
}

main();
