import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get referral code
router.get('/code', async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { username: true },
    });
    const link = `${process.env.FRONTEND_URL}/register?ref=${user?.username}`;
    res.json({ code: user?.username, link });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get referrals list
router.get('/list', async (req: any, res) => {
  try {
    const referrals = await prisma.referral.findMany({
      where: { referrerId: req.user.userId },
      include: {
        referred: {
          select: { id: true, username: true, fullName: true, createdAt: true, isApproved: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ referrals });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get referral stats
router.get('/stats', async (req: any, res) => {
  try {
    const [total, approved, totalBonus] = await Promise.all([
      prisma.referral.count({ where: { referrerId: req.user.userId } }),
      prisma.referral.count({ where: { referrerId: req.user.userId, referred: { isApproved: true } } }),
      prisma.referral.aggregate({
        where: { referrerId: req.user.userId, isPaid: true },
        _sum: { bonus: true },
      }),
    ]);
    res.json({ total, approved, totalBonus: totalBonus._sum.bonus || 0 });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
