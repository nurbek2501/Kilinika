import dotenv from 'dotenv';
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/dental',

  JWT_SECRET: process.env.JWT_SECRET || 'dev-jwt-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '15m',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Dev-only fallbacks. Real credentials come from env vars (backend/.env locally,
  // Render env in production) — never hardcode real logins/passwords in source.
  DIRECTOR_NAME: process.env.DIRECTOR_NAME || 'Director',
  DIRECTOR_PHONE: process.env.DIRECTOR_PHONE || 'director',
  DIRECTOR_PASSWORD: process.env.DIRECTOR_PASSWORD || 'change-me',

  DOCTOR1_NAME: process.env.DOCTOR1_NAME || 'Doctor',
  DOCTOR1_PHONE: process.env.DOCTOR1_PHONE || 'doctor',
  DOCTOR1_PASSWORD: process.env.DOCTOR1_PASSWORD || 'change-me',

  ADMIN_NAME: process.env.ADMIN_NAME || 'Administrator',
  ADMIN_PHONE: process.env.ADMIN_PHONE || 'admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  ESKIZ_EMAIL: process.env.ESKIZ_EMAIL || '',
  ESKIZ_PASSWORD: process.env.ESKIZ_PASSWORD || '',

  TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN || '',

  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
};

// In production the dev fallbacks (public JWT secrets / seeded passwords) would be a
// critical hole — anyone could forge an admin token. Fail fast at boot if they're unset.
if (env.NODE_ENV === 'production') {
  const required: Record<string, string | undefined> = {
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    DIRECTOR_PASSWORD: process.env.DIRECTOR_PASSWORD,
    DOCTOR1_PASSWORD: process.env.DOCTOR1_PASSWORD,
    DATABASE_URL: process.env.DATABASE_URL,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
  }
}
