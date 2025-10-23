import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);

// List tasks
router.get('/', async (req: any, res) => {
  try {
    const type = req.query.type as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = { status: 'ACTIVE' };
    if (type) where.type = type;

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    res.json({ tasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get task by ID
router.get('/:id', async (req: any, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Start task
router.post('/:id/start', async (req: any, res) => {
  try {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
    });

    if (!task || task.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'Task not available' });
    }

    // Check if already started
    const existing = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          userId: req.user.userId,
          taskId: task.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Task already started' });
    }

    // Check max participants
    if (task.maxParticipants && task.currentParticipants >= task.maxParticipants) {
      return res.status(400).json({ error: 'Task is full' });
    }

    const userTask = await prisma.userTask.create({
      data: {
        userId: req.user.userId,
        taskId: task.id,
        reward: task.reward,
      },
    });

    // Increment participants
    await prisma.task.update({
      where: { id: task.id },
      data: { currentParticipants: { increment: 1 } },
    });

    res.json({ message: 'Task started', userTask });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Submit proof
router.post('/:id/submit', async (req: any, res) => {
  try {
    const schema = z.object({
      proofUrl: z.string().url().optional(),
      proofText: z.string().optional(),
    });

    const data = schema.parse(req.body);

    const userTask = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          userId: req.user.userId,
          taskId: req.params.id,
        },
      },
    });

    if (!userTask) {
      return res.status(400).json({ error: 'Task not started' });
    }

    if (userTask.status !== 'PENDING') {
      return res.status(400).json({ error: 'Proof already submitted' });
    }

    const proof = await prisma.proof.create({
      data: {
        userId: req.user.userId,
        taskId: req.params.id,
        userTaskId: userTask.id,
        proofUrl: data.proofUrl,
        proofText: data.proofText,
      },
    });

    res.json({ message: 'Proof submitted successfully', proof });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Get my tasks
router.get('/my/list', async (req: any, res) => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const where: any = { userId: req.user.userId };
    if (status) where.status = status;

    const [userTasks, total] = await Promise.all([
      prisma.userTask.findMany({
        where,
        include: { task: true },
        orderBy: { startedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userTask.count({ where }),
    ]);

    res.json({ tasks: userTasks, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
