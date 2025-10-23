import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { sendWithdrawalRequestEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Request withdrawal
router.post('/request', async (req: any, res) => {
  try {
    const schema = z.object({
      amount: z.number().min(parseFloat(process.env.MIN_WITHDRAWAL_AMOUNT || '10')),
      walletAddress: z.string().min(10),
      network: z.enum(['TRC20', 'ERC20', 'BEP20']),
    });

    const data = schema.parse(req.body);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: req.user.userId },
    });

    if (!wallet || parseFloat(wallet.balance.toString()) < data.amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    const conversionRate = parseFloat(process.env.USDT_CONVERSION_RATE || '1.0');
    const usdtAmount = data.amount * conversionRate;

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: req.user.userId,
        amount: data.amount,
        usdtAmount,
        conversionRate,
        walletAddress: data.walletAddress,
        network: data.network,
      },
    });

    // Deduct from balance
    await prisma.wallet.update({
      where: { userId: req.user.userId },
      data: { balance: { decrement: data.amount } },
    });

    // Send email
    const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
    if (user) {
      try {
        await sendWithdrawalRequestEmail(user.email, user.fullName, data.amount, usdtAmount);
      } catch (e) {}
    }

    res.json({ message: 'Withdrawal requested', withdrawal });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get withdrawals
router.get('/list', async (req: any, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where: { userId: req.user.userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where: { userId: req.user.userId } }),
    ]);

    res.json({ withdrawals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
