import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { createError } from '../utils/errors';
import { sendEmail } from '../utils/email';
import { logActivity } from '../utils/activity';

const generateTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign(
    { userId, role },
    process.env.JWT_SECRET!,
    { expiresIn: '15m' }
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: '7d' }
  );
  return { accessToken, refreshToken };
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, role = 'STAFF' } = req.body;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw createError('Email already registered', 409);

  const hashed = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, password: hashed, role },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logActivity(user.id, 'REGISTER', 'USER', user.id);
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  res.status(201).json({
    success: true,
    data: { user, accessToken, refreshToken },
  });
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw createError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw createError('Invalid credentials', 401);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  await logActivity(user.id, 'LOGIN', 'USER', user.id, undefined, undefined,
    req.ip, req.get('user-agent'));

  const { accessToken, refreshToken } = generateTokens(user.id, user.role);

  res.json({
    success: true,
    data: {
      user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
      accessToken,
      refreshToken,
    },
  });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw createError('Refresh token required', 401);

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user || !user.isActive) throw createError('User not found', 401);

    const tokens = generateTokens(user.id, user.role);
    res.json({ success: true, data: tokens });
  } catch {
    throw createError('Invalid refresh token', 401);
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: token, resetExpiry: expiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    await sendEmail({
      to: email,
      subject: 'GodownMax - Password Reset',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
  }

  // Always return success to prevent email enumeration
  res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetExpiry: { gt: new Date() },
    },
  });
  if (!user) throw createError('Invalid or expired reset token', 400);

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, resetToken: null, resetExpiry: null },
  });

  res.json({ success: true, message: 'Password reset successfully' });
};

export const getMe = async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: (req as any).userId },
    select: { id: true, name: true, email: true, role: true, avatar: true, phone: true, lastLogin: true, createdAt: true },
  });
  if (!user) throw createError('User not found', 404);
  res.json({ success: true, data: user });
};

export const updateProfile = async (req: Request, res: Response) => {
  const { name, phone, avatar } = req.body;
  const userId = (req as any).userId;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { name, phone, avatar },
    select: { id: true, name: true, email: true, role: true, avatar: true, phone: true },
  });

  res.json({ success: true, data: user });
};

export const changePassword = async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw createError('User not found', 404);

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) throw createError('Current password is incorrect', 400);

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

  res.json({ success: true, message: 'Password changed successfully' });
};
