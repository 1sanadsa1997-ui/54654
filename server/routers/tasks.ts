import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as db from '../db';
import { tasks, userTasks } from '../../drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { formatCurrency, LEVELS } from '../../shared/constants';

export const tasksRouter = router({
  // Get all available tasks
  list: protectedProcedure
    .input(
      z.object({
        type: z.enum(['manual', 'adgem', 'adsterra', 'cpalead', 'referral']).optional(),
      }).optional()
    )
    .query(async ({ input }) => {
      const allTasks = await db.getAllTasks();
      
      let filteredTasks = allTasks;
      if (input?.type) {
        filteredTasks = allTasks.filter((task) => task.type === input.type);
      }

      return filteredTasks.map((task) => ({
        ...task,
        rewardFormatted: formatCurrency(task.reward),
      }));
    }),

  // Get user's tasks
  myTasks: protectedProcedure.query(async ({ ctx }) => {
    const userTasksData = await db.getUserTasksWithDetails(ctx.user.id);
    
    return userTasksData.map((item) => ({
      userTask: {
        ...item.userTask,
        rewardAmountFormatted: item.userTask.rewardAmount
          ? formatCurrency(item.userTask.rewardAmount)
          : null,
      },
      task: item.task
        ? {
            ...item.task,
            rewardFormatted: formatCurrency(item.task.reward),
          }
        : null,
    }));
  }),

  // Get task by ID
  getById: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .query(async ({ input }) => {
      const task = await db.getTaskById(input.taskId);
      if (!task) throw new Error('Task not found');

      return {
        ...task,
        rewardFormatted: formatCurrency(task.reward),
      };
    }),

  // Start a task
  start: protectedProcedure
    .input(z.object({ taskId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const task = await db.getTaskById(input.taskId);
      if (!task) throw new Error('Task not found');

      if (task.status !== 'active') {
        throw new Error('Task is not active');
      }

      // Check if user already started this task
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      const existing = await database
        .select()
        .from(userTasks)
        .where(
          and(
            eq(userTasks.userId, ctx.user.id),
            eq(userTasks.taskId, input.taskId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new Error('You have already started this task');
      }

      // Check max participants
      if (task.maxParticipants && task.currentParticipants >= task.maxParticipants) {
        throw new Error('Task has reached maximum participants');
      }

      // Create user task
      await db.createUserTask({
        userId: ctx.user.id,
        taskId: input.taskId,
      });

      // Increment current participants
      await database
        .update(tasks)
        .set({ currentParticipants: task.currentParticipants + 1 })
        .where(eq(tasks.id, input.taskId));

      return { success: true, message: 'Task started successfully' };
    }),

  // Submit task proof
  submit: protectedProcedure
    .input(
      z.object({
        taskId: z.number(),
        proofUrl: z.string().url().optional(),
        proofText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      const userTask = await database
        .select()
        .from(userTasks)
        .where(
          and(
            eq(userTasks.userId, ctx.user.id),
            eq(userTasks.taskId, input.taskId)
          )
        )
        .limit(1);

      if (userTask.length === 0) {
        throw new Error('Task not started');
      }

      if (userTask[0].status !== 'pending') {
        throw new Error('Task already submitted');
      }

      if (!input.proofUrl && !input.proofText) {
        throw new Error('Proof is required');
      }

      await database
        .update(userTasks)
        .set({
          status: 'submitted',
          proofUrl: input.proofUrl,
          proofText: input.proofText,
          submittedAt: new Date(),
        })
        .where(eq(userTasks.id, userTask[0].id));

      // Create notification
      await db.createNotification({
        userId: ctx.user.id,
        type: 'task_submitted',
        title: 'Task Submitted',
        message: 'Your task proof has been submitted and is under review.',
      });

      return { success: true, message: 'Task submitted successfully' };
    }),
});

