import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { validate } from '../middleware/validate';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();

// Shared so the refresh cookie is set and cleared with identical attributes —
// a mismatch can leave the cookie uncleared on logout (esp. secure/sameSite in prod).
const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
};
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

const loginSchema = z.object({
  phone: z.string().min(1, 'Login is required'),
  password: z.string().min(1, 'Password is required'),
});

router.post('/login', validate(loginSchema), async (req, res) => {
  try {
    const { phone, password } = req.body;
    // `phone` field carries either a phone number or a username.
    const user = await prisma.user.findFirst({
      where: { OR: [{ phone }, { username: phone }] },
    });

    if (!user || !user.isActive) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const isValid = await comparePassword(password, user.password);
    if (!isValid) {
      sendError(res, 'Invalid credentials', 401);
      return;
    }

    const payload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions, maxAge: REFRESH_MAX_AGE });

    sendSuccess(res, {
      accessToken,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
    }, 'Login successful');
  } catch (err) {
    sendError(res, 'Login failed', 500);
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      sendError(res, 'Refresh token required', 401);
      return;
    }

    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });

    if (!user || !user.isActive) {
      sendError(res, 'User not found', 401);
      return;
    }

    const newPayload = { userId: user.id, role: user.role };
    const accessToken = generateAccessToken(newPayload);
    const refreshToken = generateRefreshToken(newPayload);

    res.cookie('refreshToken', refreshToken, { ...refreshCookieOptions, maxAge: REFRESH_MAX_AGE });

    sendSuccess(res, { accessToken }, 'Token refreshed');
  } catch {
    sendError(res, 'Invalid refresh token', 401);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', refreshCookieOptions);
  sendSuccess(res, null, 'Logged out');
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, phone: true, role: true, isActive: true },
    });
    if (!user) {
      sendError(res, 'User not found', 404);
      return;
    }
    sendSuccess(res, user);
  } catch {
    sendError(res, 'Failed to get user', 500);
  }
});

export default router;
