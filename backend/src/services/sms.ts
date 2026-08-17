import { env } from '../config/env';
import { logger } from '../config/logger';
import { getSetting } from './settings';

/**
 * Eskiz.uz SMS adapter.
 *
 * Fully optional: if ESKIZ_EMAIL / ESKIZ_PASSWORD are not configured (or the
 * `smsEnabled` setting is off) every call becomes a no-op that is only logged,
 * so the rest of the app keeps working without an SMS provider. Drop the
 * credentials into backend/.env to start sending real messages.
 */

const ESKIZ_BASE = 'https://notify.eskiz.uz/api';
const TOKEN_TTL = 20 * 24 * 60 * 60 * 1000; // refresh well before the ~30-day expiry

let cachedToken: string | null = null;
let tokenFetchedAt = 0;

/** Normalize any Uzbek phone input to Eskiz's expected `998XXXXXXXXX` form. */
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('998')) return digits;
  if (digits.startsWith('0')) return `998${digits.slice(1)}`;
  if (digits.length === 9) return `998${digits}`;
  return digits;
}

function isConfigured(): boolean {
  return Boolean(env.ESKIZ_EMAIL && env.ESKIZ_PASSWORD);
}

async function getToken(forceRefresh = false): Promise<string | null> {
  if (!isConfigured()) return null;
  if (!forceRefresh && cachedToken && Date.now() - tokenFetchedAt < TOKEN_TTL) {
    return cachedToken;
  }
  try {
    const body = new URLSearchParams({ email: env.ESKIZ_EMAIL, password: env.ESKIZ_PASSWORD });
    const res = await fetch(`${ESKIZ_BASE}/auth/login`, { method: 'POST', body });
    const json = (await res.json()) as { data?: { token?: string } };
    const token = json?.data?.token;
    if (token) {
      cachedToken = token;
      tokenFetchedAt = Date.now();
      return token;
    }
    logger.warn({ status: res.status }, 'Eskiz login returned no token');
    return null;
  } catch (err) {
    logger.error(err, 'Eskiz login failed');
    return null;
  }
}

export interface SmsResult {
  sent: boolean;
  reason?: string;
}

/** Send a single SMS. Never throws — returns {sent:false, reason} on any problem. */
export async function sendSms(phone: string, message: string): Promise<SmsResult> {
  if (!isConfigured()) {
    logger.info({ phone, message }, 'SMS skipped (Eskiz credentials not configured)');
    return { sent: false, reason: 'sms_not_configured' };
  }

  // Respect the runtime toggle in Settings (defaults to enabled).
  const enabled = (await getSetting('smsEnabled')) ?? 'true';
  if (enabled === 'false') {
    logger.info({ phone }, 'SMS skipped (smsEnabled=false)');
    return { sent: false, reason: 'sms_disabled' };
  }

  const send = async (token: string) => {
    const from = (await getSetting('smsFrom')) || '4546';
    const body = new URLSearchParams({
      mobile_phone: normalizePhone(phone),
      message,
      from,
    });
    return fetch(`${ESKIZ_BASE}/message/sms/send`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body,
    });
  };

  try {
    let token = await getToken();
    if (!token) return { sent: false, reason: 'auth_failed' };

    let res = await send(token);
    // Token may have expired mid-life — refresh once and retry.
    if (res.status === 401) {
      cachedToken = null;
      token = await getToken(true);
      if (!token) return { sent: false, reason: 'auth_failed' };
      res = await send(token);
    }

    const json = (await res.json().catch(() => ({}))) as { status?: string; id?: unknown; message?: string };
    if (res.ok && (json?.status === 'waiting' || json?.id || /waiting/i.test(json?.message ?? ''))) {
      return { sent: true };
    }
    logger.warn({ status: res.status, json }, 'Eskiz send returned non-success');
    return { sent: false, reason: 'send_failed' };
  } catch (err) {
    logger.error(err, 'Eskiz send failed');
    return { sent: false, reason: 'exception' };
  }
}
