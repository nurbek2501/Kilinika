import TelegramBot from 'node-telegram-bot-api';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import { logger } from '../config/logger';

/**
 * Telegram booking bot, embedded in the backend process.
 *
 * It talks to Prisma directly (no self-HTTP) and is fully OPTIONAL: if
 * TELEGRAM_BOT_TOKEN is unset/placeholder the bot simply stays off and the API
 * keeps running normally. Every handler is wrapped so a Telegram-side failure
 * (blocked user, rate limit, network drop) can never crash the server.
 */

type Step = 'idle' | 'select_doctor' | 'enter_name' | 'enter_phone' | 'submitting';

interface UserState {
  step: Step;
  doctorId?: string;
  doctorName?: string;
  patientName?: string;
  // doctorId -> name, captured when the doctor list is shown, so callback_data
  // only needs the id and stays under Telegram's 64-byte callback_data limit.
  doctors?: Record<string, string>;
}

// Keyed by Telegram *user* id (not chat id) so booking flows never collide
// between members of the same group chat.
const userStates = new Map<number, UserState>();

function getState(userId: number): UserState {
  let state = userStates.get(userId);
  if (!state) {
    state = { step: 'idle' };
    userStates.set(userId, state);
  }
  return state;
}

const PLACEHOLDER_TOKENS = new Set(['', 'YOUR_BOT_TOKEN_HERE', 'your-telegram-bot-token']);

type SendOptions = Parameters<TelegramBot['sendMessage']>[2];

let bot: TelegramBot | null = null;

async function safeSend(chatId: number, text: string, options?: SendOptions): Promise<void> {
  if (!bot) return;
  try {
    await bot.sendMessage(chatId, text, options);
  } catch (err) {
    logger.warn(`Telegram sendMessage failed: ${(err as Error).message}`);
  }
}

/** Start the embedded Telegram bot. Safe to call unconditionally — it no-ops
 *  when no token is configured and never throws. */
export function startTelegramBot(): void {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (PLACEHOLDER_TOKENS.has(token)) {
    logger.info('Telegram bot disabled (TELEGRAM_BOT_TOKEN not set)');
    return;
  }

  try {
    bot = new TelegramBot(token, { polling: true });
  } catch (err) {
    logger.error(err, 'Failed to initialise Telegram bot — continuing without it');
    bot = null;
    return;
  }

  // Polling / API errors must stay contained; they should never surface as an
  // unhandled rejection that takes the API process down with them.
  bot.on('polling_error', (err) => logger.warn(`Telegram polling_error: ${err.message}`));
  bot.on('webhook_error', (err) => logger.warn(`Telegram webhook_error: ${err.message}`));
  bot.on('error', (err) => logger.warn(`Telegram bot error: ${(err as Error).message}`));

  registerHandlers(bot);
  logger.info('Telegram bot started (polling)');
}

/** Stop polling (used for clean shutdown / tests). */
export async function stopTelegramBot(): Promise<void> {
  if (!bot) return;
  try {
    await bot.stopPolling();
  } catch {
    /* already stopped */
  }
  bot = null;
}

function registerHandlers(b: TelegramBot): void {
  b.onText(/^\/start(?:@\w+)?$/, async (msg) => {
    try {
      const chatId = msg.chat.id;
      const userId = msg.from?.id ?? chatId;
      userStates.set(userId, { step: 'idle' });

      await safeSend(chatId,
        `🦷 *Kamoliddin Dental Clinic* ga xush kelibsiz!\n\n` +
        `Quyidagi buyruqlardan foydalaning:\n\n` +
        `📅 /navbat — Navbat olish\n` +
        `💰 /xizmatlar — Xizmatlar va narxlar\n` +
        `📞 /aloqa — Bog'lanish\n` +
        `❓ /yordam — Yordam`,
        { parse_mode: 'Markdown' },
      );
    } catch (err) {
      logger.warn(`/start handler failed: ${(err as Error).message}`);
    }
  });

  b.onText(/^\/navbat(?:@\w+)?$/, async (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from?.id ?? chatId;
    try {
      const doctors = await prisma.user.findMany({
        where: { role: 'DOCTOR', isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      });

      if (doctors.length === 0) {
        await safeSend(chatId, '❌ Hozircha shifokorlar mavjud emas.');
        return;
      }

      const keyboard = doctors.map((doc) => ([
        { text: `👨‍⚕️ ${doc.name}`, callback_data: `doc_${doc.id}` },
      ]));

      const doctorMap: Record<string, string> = {};
      doctors.forEach((d) => { doctorMap[d.id] = d.name; });
      userStates.set(userId, { step: 'select_doctor', doctors: doctorMap });

      await safeSend(chatId, '👨‍⚕️ *Shifokorni tanlang:*', {
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard },
      });
    } catch (err) {
      logger.warn(`/navbat handler failed: ${(err as Error).message}`);
      await safeSend(chatId, '❌ Xatolik yuz berdi. Keyinroq urinib ko\'ring.');
    }
  });

  b.on('callback_query', async (query) => {
    // Always answer first so the button's loading spinner clears; a stale query
    // rejects here and is safely ignored.
    try { await b.answerCallbackQuery(query.id); } catch { /* stale/expired query */ }

    if (!query.message || !query.data) return;
    const chatId = query.message.chat.id;
    const userId = query.from.id;

    if (query.data.startsWith('doc_')) {
      try {
        const doctorId = query.data.slice(4);
        const state = getState(userId);
        const doctorName = state.doctors?.[doctorId] ?? 'Shifokor';

        userStates.set(userId, { step: 'enter_name', doctorId, doctorName, doctors: state.doctors });

        await safeSend(chatId,
          `✅ Shifokor: *${doctorName}*\n\n📝 Iltimos, to'liq ismingizni kiriting:`,
          { parse_mode: 'Markdown' },
        );
      } catch (err) {
        logger.warn(`callback_query handler failed: ${(err as Error).message}`);
      }
    }
  });

  b.onText(/^\/xizmatlar(?:@\w+)?$/, async (msg) => {
    const chatId = msg.chat.id;
    try {
      const services = await prisma.servicePrice.findMany({
        where: { isActive: true },
        orderBy: { nameUz: 'asc' },
      });

      if (services.length === 0) {
        await safeSend(chatId, '📋 Hozircha xizmatlar ro\'yxati bo\'sh.');
        return;
      }

      let message = '💰 *Xizmatlar va narxlar:*\n\n';
      services.forEach((s, i) => {
        const price = new Intl.NumberFormat('uz-UZ').format(Number(s.price));
        message += `${i + 1}. ${s.nameUz} — *${price} so'm*\n`;
      });

      await safeSend(chatId, message, { parse_mode: 'Markdown' });
    } catch (err) {
      logger.warn(`/xizmatlar handler failed: ${(err as Error).message}`);
      await safeSend(chatId, '❌ Xizmatlarni yuklashda xatolik.');
    }
  });

  b.onText(/^\/aloqa(?:@\w+)?$/, async (msg) => {
    try {
      await safeSend(msg.chat.id,
        '📞 *Aloqa ma\'lumotlari:*\n\n' +
        '📍 Manzil: Toshkent shahri\n' +
        '📞 Telefon: +998 90 123 45 67\n' +
        '🕐 Ish vaqti: Dush-Shan 09:00 - 18:00\n\n' +
        '🌐 Veb-sayt: kamoliddin.dental.clinic.codingtech.uz',
        { parse_mode: 'Markdown' },
      );
    } catch (err) {
      logger.warn(`/aloqa handler failed: ${(err as Error).message}`);
    }
  });

  b.onText(/^\/yordam(?:@\w+)?$/, async (msg) => {
    try {
      await safeSend(msg.chat.id,
        '❓ *Yordam:*\n\n' +
        '📅 /navbat — Shifokorga navbat olish\n' +
        '💰 /xizmatlar — Xizmatlar va narxlarni ko\'rish\n' +
        '📞 /aloqa — Klinika bilan bog\'lanish\n\n' +
        'Savollaringiz bo\'lsa, qo\'ng\'iroq qiling! 📞',
        { parse_mode: 'Markdown' },
      );
    } catch (err) {
      logger.warn(`/yordam handler failed: ${(err as Error).message}`);
    }
  });

  b.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    const chatId = msg.chat.id;
    const userId = msg.from?.id ?? chatId;
    const state = getState(userId);

    try {
      if (state.step === 'enter_name') {
        state.patientName = msg.text.trim();
        state.step = 'enter_phone';
        userStates.set(userId, state);

        await safeSend(chatId,
          `👤 Ismingiz: *${state.patientName}*\n\n📱 Endi telefon raqamingizni kiriting:\n(Masalan: +998901234567)`,
          { parse_mode: 'Markdown' },
        );
        return;
      }

      if (state.step === 'enter_phone') {
        // Normalize to canonical +998XXXXXXXXX and validate before submitting so
        // staff never receive garbage/uncontactable numbers.
        let phone = msg.text.trim().replace(/[\s\-()]/g, '');
        if (/^\d{9}$/.test(phone)) phone = `+998${phone}`;
        else if (/^998\d{9}$/.test(phone)) phone = `+${phone}`;

        if (!/^\+998\d{9}$/.test(phone)) {
          await safeSend(chatId,
            '❌ Telefon raqami noto\'g\'ri.\nIltimos, +998901234567 ko\'rinishida kiriting:');
          return;
        }

        // Flip the state OUT of enter_phone BEFORE awaiting so a fast double-send
        // can't fire two appointment creates (duplicate booking).
        const { patientName, doctorId, doctorName } = state;
        userStates.set(userId, { step: 'submitting' });

        if (!patientName || !doctorId) {
          userStates.set(userId, { step: 'idle' });
          await safeSend(chatId, '❌ Sessiya eskirdi. Iltimos qaytadan boshlang: /navbat');
          return;
        }

        try {
          // Ensure the target is a real, active doctor — mirrors the /public
          // route so a stale id can never pollute a non-doctor's queue.
          const doctor = await prisma.user.findFirst({
            where: { id: doctorId, role: 'DOCTOR', isActive: true },
            select: { id: true },
          });

          if (!doctor) {
            await safeSend(chatId, '❌ Tanlangan shifokor topilmadi. Qaytadan urinib ko\'ring: /navbat');
            return;
          }

          await prisma.appointment.create({
            data: {
              patientName,
              patientPhone: phone,
              doctorId,
              source: 'TELEGRAM',
              status: 'PENDING',
            },
          });

          await safeSend(chatId,
            `✅ *Navbatingiz tasdiqlandi!*\n\n` +
            `👤 Ism: ${patientName}\n` +
            `📱 Telefon: ${phone}\n` +
            `👨‍⚕️ Shifokor: ${doctorName ?? ''}\n\n` +
            `Klinikaga kelganingizda ro'yxatdan o'tasiz. Rahmat! 🦷`,
            { parse_mode: 'Markdown' },
          );
        } catch (err) {
          logger.warn(`appointment create failed: ${(err as Error).message}`);
          await safeSend(chatId, '❌ Navbat olishda xatolik yuz berdi. Qaytadan urinib ko\'ring: /navbat');
        } finally {
          userStates.set(userId, { step: 'idle' });
        }
        return;
      }
    } catch (err) {
      logger.warn(`message handler failed: ${(err as Error).message}`);
    }
  });
}
