import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import crypto from 'crypto';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import { sendWelcomeEmail, sendMagicLinkEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

// Register
router.post('/register', async (req, res) => {
  try {
    console.log('Registration request received:', {
      body: req.body,
      headers: req.headers
    });

    const schema = z.object({
      username: z.string().min(3).max(50),
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(2).max(100),
      gender: z.string().optional(),
      birthdate: z.string().optional(),
      referredBy: z.string().optional(),
    });

    const data = schema.parse(req.body);
    console.log('Parsed registration data:', data);

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        gender: data.gender,
        birthdate: data.birthdate ? new Date(data.birthdate) : undefined,
        wallet: { create: {} },
      },
    });

    // Handle referral if provided
    if (data.referredBy) {
      const referrer = await prisma.user.findFirst({
        where: { username: data.referredBy },
      });
      
      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            level: 1,
            bonus: parseFloat(process.env.REFERRAL_BONUS_L1 || '70'),
          },
        });
      }
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    console.log('User created successfully:', user.id);
    res.status(201).json({ 
      message: 'Registration successful. Your account is under review.',
      userId: user.id,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return res.status(400).json({ 
        error: 'Validation failed',
        details: validationErrors
      });
    }
    
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { wallet: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });
    
    const refreshToken = generateRefreshToken({ 
      userId: user.id, 
      email: user.email, 
      role: user.role 
    });

    res.cookie('accessToken', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000, // 15 minutes
    });
    
    res.cookie('refreshToken', refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ 
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        level: user.level,
        balance: user.wallet?.balance || 0,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Request Magic Link
router.post('/magic-link/request', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
    });

    const { email } = schema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal if user exists
      return res.json({ message: 'If the email exists, a magic link has been sent.' });
    }

    if (!user.isApproved) {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ error: 'Account suspended' });
    }

    // Generate magic link token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await prisma.magicLinkToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // Send magic link email
    try {
      await sendMagicLinkEmail(user.email, token, user.fullName);
    } catch (emailError) {
      console.error('Failed to send magic link:', emailError);
      return res.status(500).json({ error: 'Failed to send magic link' });
    }

    res.json({ message: 'Magic link sent to your email' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Verify Magic Link
router.post('/magic-link/verify', async (req, res) => {
  try {
    const schema = z.object({
      token: z.string(),
    });

    const { token } = schema.parse(req.body);

    const magicLink = await prisma.magicLinkToken.findUnique({
      where: { token },
      include: { user: { include: { wallet: true } } },
    });

    if (!magicLink || magicLink.used || magicLink.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired magic link' });
    }

    // Mark as used
    await prisma.magicLinkToken.update({
      where: { token },
      data: { used: true },
    });

    // Update last login
    await prisma.user.update({
      where: { id: magicLink.userId },
      data: { lastLoginAt: new Date() },
    });

    const accessToken = generateAccessToken({ 
      userId: magicLink.user.id, 
      email: magicLink.user.email, 
      role: magicLink.user.role 
    });
    
    const refreshToken = generateRefreshToken({ 
      userId: magicLink.user.id, 
      email: magicLink.user.email, 
      role: magicLink.user.role 
    });

    res.cookie('accessToken', accessToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 15 * 60 * 1000,
    });
    
    res.cookie('refreshToken', refreshToken, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({ 
      message: 'Login successful',
      user: {
        id: magicLink.user.id,
        username: magicLink.user.username,
        email: magicLink.user.email,
        fullName: magicLink.user.fullName,
        role: magicLink.user.role,
        level: magicLink.user.level,
        balance: magicLink.user.wallet?.balance || 0,
      },
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', authenticate, async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        level: true,
        isApproved: true,
        createdAt: true,
        wallet: {
          select: {
            balance: true,
            pendingBalance: true,
            totalEarned: true,
            totalWithdrawn: true,
          },
        },
      },
    });
    
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Change Password
router.post('/change-password', authenticate, async (req: any, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    });

    const { currentPassword, newPassword } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
    });

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out successfully' });
});

export default router;

