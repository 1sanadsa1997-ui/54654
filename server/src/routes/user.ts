import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get wallet
router.get('/wallet', async (req: any, res) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId },
    });
    res.json(wallet || { balance: 0, pendingBalance: 0, totalEarned: 0, totalWithdrawn: 0 });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get transactions
router.get('/transactions', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId: req.user.userId } }),
    ]);
    res.json({ transactions, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get stats
router.get('/stats', async (req: any, res) => {
  try {
    const [wallet, tasksCompleted, referralsCount] = await Promise.all([
      prisma.wallet.findUnique({ where: { userId: req.user.userId } }),
      prisma.userTask.count({ where: { userId: req.user.userId, status: 'APPROVED' } }),
      prisma.referral.count({ where: { referrerId: req.user.userId } }),
    ]);
    res.json({ balance: wallet?.balance || 0, totalEarned: wallet?.totalEarned || 0, tasksCompleted, referralsCount });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get profile
router.get('/profile', async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { id: true, username: true, email: true, fullName: true, gender: true, birthdate: true, level: true, role: true, createdAt: true },
    });
    res.json(user);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update profile
router.put('/profile', async (req: any, res) => {
  try {
    const schema = z.object({ fullName: z.string().min(2).max(100).optional(), gender: z.string().optional(), birthdate: z.string().optional() });
    const data = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: { fullName: data.fullName, gender: data.gender, birthdate: data.birthdate ? new Date(data.birthdate) : undefined },
      select: { id: true, username: true, email: true, fullName: true, gender: true, birthdate: true },
    });
    res.json({ message: 'Profile updated', user });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
