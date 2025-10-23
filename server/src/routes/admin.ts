import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { sendApprovalEmail, sendWithdrawalApprovedEmail } from '../services/email';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole('ADMIN', 'SUPER_ADMIN'));

// Get dashboard stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, pendingUsers, totalTasks, pendingProofs, pendingWithdrawals, totalEarnings] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isApproved: false } }),
      prisma.task.count(),
      prisma.proof.count({ where: { status: 'PENDING' } }),
      prisma.withdrawal.count({ where: { status: 'PENDING' } }),
      prisma.wallet.aggregate({ _sum: { totalEarned: true } }),
    ]);

    res.json({
      totalUsers,
      pendingUsers,
      totalTasks,
      pendingProofs,
      pendingWithdrawals,
      totalEarnings: totalEarnings._sum.totalEarned || 0,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List users
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { username: { contains: search } },
        { email: { contains: search } },
        { fullName: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { wallet: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Approve user
router.post('/users/:id/approve', async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isApproved) {
      return res.status(400).json({ error: 'User already approved' });
    }

    // Approve user
    await prisma.user.update({
      where: { id: user.id },
      data: { isApproved: true },
    });

    // Credit welcome bonus
    const welcomeBonus = parseFloat(process.env.WELCOME_BONUS_AMOUNT || '5');
    await prisma.wallet.update({
      where: { userId: user.id },
      data: {
        balance: { increment: welcomeBonus },
        totalEarned: { increment: welcomeBonus },
      },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: user.id,
        type: 'SIGNUP_BONUS',
        amount: welcomeBonus,
        description: 'Welcome bonus',
      },
    });

    // Log admin action
    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'APPROVE_USER',
        targetType: 'USER',
        targetId: user.id,
        description: `Approved user ${user.username}`,
      },
    });

    // Send approval email
    try {
      await sendApprovalEmail(user.email, user.fullName);
    } catch (e) {}

    res.json({ message: 'User approved successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Suspend/Unsuspend user
router.post('/users/:id/suspend', async (req: any, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isSuspended: !user.isSuspended },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: user.isSuspended ? 'UNSUSPEND_USER' : 'SUSPEND_USER',
        targetType: 'USER',
        targetId: user.id,
        description: `${user.isSuspended ? 'Unsuspended' : 'Suspended'} user ${user.username}`,
      },
    });

    res.json({ message: `User ${user.isSuspended ? 'unsuspended' : 'suspended'} successfully` });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Credit/Debit wallet
router.post('/users/:id/wallet', async (req: any, res) => {
  try {
    const schema = z.object({
      amount: z.number(),
      type: z.enum(['CREDIT', 'DEBIT']),
      description: z.string(),
    });

    const data = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { wallet: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (data.type === 'CREDIT') {
      await prisma.wallet.update({
        where: { userId: user.id },
        data: {
          balance: { increment: data.amount },
          totalEarned: { increment: data.amount },
        },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'ADMIN_CREDIT',
          amount: data.amount,
          description: data.description,
        },
      });
    } else {
      if (!user.wallet || parseFloat(user.wallet.balance.toString()) < data.amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      await prisma.wallet.update({
        where: { userId: user.id },
        data: { balance: { decrement: data.amount } },
      });

      await prisma.transaction.create({
        data: {
          userId: user.id,
          type: 'ADMIN_DEBIT',
          amount: -data.amount,
          description: data.description,
        },
      });
    }

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: `WALLET_${data.type}`,
        targetType: 'USER',
        targetId: user.id,
        description: `${data.type} $${data.amount} - ${data.description}`,
      },
    });

    res.json({ message: 'Wallet updated successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List tasks
router.get('/tasks', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count(),
    ]);

    res.json({ tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Create task
router.post('/tasks', async (req: any, res) => {
  try {
    const schema = z.object({
      title: z.string(),
      description: z.string(),
      type: z.enum(['MANUAL', 'ADGEM', 'ADSTERRA', 'CPALEAD']),
      reward: z.number(),
      instructions: z.string().optional(),
      url: z.string().optional(),
      proofRequired: z.boolean().default(true),
      maxParticipants: z.number().optional(),
    });

    const data = schema.parse(req.body);

    const task = await prisma.task.create({ data });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'CREATE_TASK',
        targetType: 'TASK',
        targetId: task.id,
        description: `Created task: ${task.title}`,
      },
    });

    res.json({ message: 'Task created', task });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Update task
router.put('/tasks/:id', async (req: any, res) => {
  try {
    const schema = z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      reward: z.number().optional(),
      instructions: z.string().optional(),
      url: z.string().optional(),
      status: z.enum(['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED']).optional(),
    });

    const data = schema.parse(req.body);

    const task = await prisma.task.update({
      where: { id: req.params.id },
      data,
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'UPDATE_TASK',
        targetType: 'TASK',
        targetId: task.id,
        description: `Updated task: ${task.title}`,
      },
    });

    res.json({ message: 'Task updated', task });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Delete task
router.delete('/tasks/:id', async (req: any, res) => {
  try {
    const task = await prisma.task.delete({
      where: { id: req.params.id },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'DELETE_TASK',
        targetType: 'TASK',
        targetId: task.id,
        description: `Deleted task: ${task.title}`,
      },
    });

    res.json({ message: 'Task deleted' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List proofs
router.get('/proofs', async (req, res) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [proofs, total] = await Promise.all([
      prisma.proof.findMany({
        where,
        include: {
          user: { select: { username: true, fullName: true } },
          task: { select: { title: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.proof.count({ where }),
    ]);

    res.json({ proofs, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Approve proof
router.post('/proofs/:id/approve', async (req: any, res) => {
  try {
    const proof = await prisma.proof.findUnique({
      where: { id: req.params.id },
      include: { userTask: true, task: true, user: true },
    });

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    if (proof.status !== 'PENDING') {
      return res.status(400).json({ error: 'Proof already reviewed' });
    }

    // Update proof
    await prisma.proof.update({
      where: { id: proof.id },
      data: {
        status: 'APPROVED',
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
    });

    // Update user task
    await prisma.userTask.update({
      where: { id: proof.userTaskId },
      data: {
        status: 'APPROVED',
        completedAt: new Date(),
      },
    });

    // Credit wallet
    await prisma.wallet.update({
      where: { userId: proof.userId },
      data: {
        balance: { increment: proof.userTask.reward },
        totalEarned: { increment: proof.userTask.reward },
      },
    });

    // Create transaction
    await prisma.transaction.create({
      data: {
        userId: proof.userId,
        type: 'TASK_REWARD',
        amount: proof.userTask.reward,
        description: `Reward for task: ${proof.task.title}`,
      },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'APPROVE_PROOF',
        targetType: 'PROOF',
        targetId: proof.id,
        description: `Approved proof for ${proof.user.username}`,
      },
    });

    res.json({ message: 'Proof approved' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reject proof
router.post('/proofs/:id/reject', async (req: any, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { reason } = schema.parse(req.body);

    const proof = await prisma.proof.findUnique({
      where: { id: req.params.id },
      include: { userTask: true, user: true },
    });

    if (!proof) {
      return res.status(404).json({ error: 'Proof not found' });
    }

    await prisma.proof.update({
      where: { id: proof.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        reviewedBy: req.user.userId,
        reviewedAt: new Date(),
      },
    });

    await prisma.userTask.update({
      where: { id: proof.userTaskId },
      data: { status: 'REJECTED' },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'REJECT_PROOF',
        targetType: 'PROOF',
        targetId: proof.id,
        description: `Rejected proof for ${proof.user.username}: ${reason}`,
      },
    });

    res.json({ message: 'Proof rejected' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// List withdrawals
router.get('/withdrawals', async (req, res) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        include: {
          user: { select: { username: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.withdrawal.count({ where }),
    ]);

    res.json({ withdrawals, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Approve withdrawal
router.post('/withdrawals/:id/approve', async (req: any, res) => {
  try {
    const schema = z.object({
      txHash: z.string().optional(),
    });

    const { txHash } = schema.parse(req.body);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ error: 'Withdrawal already processed' });
    }

    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'COMPLETED',
        txHash,
        processedBy: req.user.userId,
        processedAt: new Date(),
      },
    });

    // Update wallet
    await prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: { totalWithdrawn: { increment: withdrawal.amount } },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'APPROVE_WITHDRAWAL',
        targetType: 'WITHDRAWAL',
        targetId: withdrawal.id,
        description: `Approved withdrawal for ${withdrawal.user.username}: $${withdrawal.amount}`,
      },
    });

    // Send email
    try {
      await sendWithdrawalApprovedEmail(
        withdrawal.user.email,
        withdrawal.user.fullName,
        parseFloat(withdrawal.amount.toString()),
        parseFloat(withdrawal.usdtAmount.toString()),
        txHash
      );
    } catch (e) {}

    res.json({ message: 'Withdrawal approved' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Reject withdrawal
router.post('/withdrawals/:id/reject', async (req: any, res) => {
  try {
    const schema = z.object({
      reason: z.string(),
    });

    const { reason } = schema.parse(req.body);

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: req.params.id },
      include: { user: true },
    });

    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status: 'REJECTED',
        rejectionReason: reason,
        processedBy: req.user.userId,
        processedAt: new Date(),
      },
    });

    // Refund balance
    await prisma.wallet.update({
      where: { userId: withdrawal.userId },
      data: { balance: { increment: withdrawal.amount } },
    });

    await prisma.adminAction.create({
      data: {
        adminId: req.user.userId,
        action: 'REJECT_WITHDRAWAL',
        targetType: 'WITHDRAWAL',
        targetId: withdrawal.id,
        description: `Rejected withdrawal for ${withdrawal.user.username}: ${reason}`,
      },
    });

    res.json({ message: 'Withdrawal rejected and balance refunded' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
