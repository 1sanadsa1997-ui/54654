import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import { TRPCError } from '@trpc/server';
import * as db from '../db';
import { users, tasks, userTasks, withdrawals, levelRequests, wallets } from '../../drizzle/schema';
import { eq, desc } from 'drizzle-orm';
import { formatCurrency, LEVELS } from '../../shared/constants';
import { sendApprovalEmail, sendRejectionEmail, sendWithdrawalApprovedEmail } from '../email';

// Admin-only middleware
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== 'admin' && ctx.user.role !== 'super_admin') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({ ctx });
});

export const adminRouter = router({
  // ==================== DASHBOARD ====================
  stats: adminProcedure.query(async () => {
    const stats = await db.getSystemStats();
    return {
      ...stats,
      totalTransactionsFormatted: formatCurrency(stats?.totalTransactions || 0),
    };
  }),

  // ==================== USER MANAGEMENT ====================
  users: {
    list: adminProcedure
      .input(
        z.object({
          limit: z.number().min(1).max(500).default(100),
          status: z.enum(['pending', 'approved', 'suspended', 'rejected']).optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const allUsers = await db.getAllUsers(input?.limit || 100);
        
        if (input?.status) {
          return allUsers.filter((u) => u.status === input.status);
        }
        
        return allUsers;
      }),

    pending: adminProcedure.query(async () => {
      return await db.getPendingUsers();
    }),

    approve: adminProcedure
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUser(input.userId);
        if (!user) throw new Error('User not found');

        if (user.status === 'approved') {
          throw new Error('User already approved');
        }

        // Update status
        await db.updateUserStatus(input.userId, 'approved', ctx.user.id);

        // Credit welcome bonus ($5)
        const welcomeBonus = 500; // $5 in cents
        await db.updateWalletBalance(input.userId, welcomeBonus, 'add');
        
        await db.createTransaction({
          userId: input.userId,
          type: 'bonus',
          amount: welcomeBonus,
          description: 'Welcome bonus',
          createdBy: ctx.user.id,
        });

        // Send approval email
        await sendApprovalEmail(user.email, user.fullName);

        // Create notification
        await db.createNotification({
          userId: input.userId,
          type: 'account_approved',
          title: 'Account Approved!',
          message: `Your account has been approved! You received a $5 welcome bonus.`,
        });

        // Log admin action
        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'approve_user',
          targetType: 'user',
          targetId: input.userId,
          details: JSON.stringify({ welcomeBonus }),
        });

        return { success: true, message: 'User approved successfully' };
      }),

    reject: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          reason: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const user = await db.getUser(input.userId);
        if (!user) throw new Error('User not found');

        await db.updateUserStatus(input.userId, 'rejected', ctx.user.id);

        // Send rejection email
        await sendRejectionEmail(user.email, user.fullName, input.reason);

        // Log admin action
        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'reject_user',
          targetType: 'user',
          targetId: input.userId,
          details: JSON.stringify({ reason: input.reason }),
        });

        return { success: true, message: 'User rejected' };
      }),

    suspend: adminProcedure
      .input(z.object({ userId: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await db.updateUserStatus(input.userId, 'suspended', ctx.user.id);

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'suspend_user',
          targetType: 'user',
          targetId: input.userId,
        });

        return { success: true, message: 'User suspended' };
      }),

    creditWallet: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          amount: z.number(),
          description: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateWalletBalance(input.userId, input.amount, 'add');
        
        await db.createTransaction({
          userId: input.userId,
          type: 'admin_adjustment',
          amount: input.amount,
          description: input.description,
          createdBy: ctx.user.id,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'credit_wallet',
          targetType: 'user',
          targetId: input.userId,
          details: JSON.stringify({ amount: input.amount, description: input.description }),
        });

        return { success: true, message: 'Wallet credited successfully' };
      }),

    debitWallet: adminProcedure
      .input(
        z.object({
          userId: z.string(),
          amount: z.number(),
          description: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.updateWalletBalance(input.userId, input.amount, 'subtract');
        
        await db.createTransaction({
          userId: input.userId,
          type: 'admin_adjustment',
          amount: -input.amount,
          description: input.description,
          createdBy: ctx.user.id,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'debit_wallet',
          targetType: 'user',
          targetId: input.userId,
          details: JSON.stringify({ amount: input.amount, description: input.description }),
        });

        return { success: true, message: 'Wallet debited successfully' };
      }),
  },

  // ==================== TASK MANAGEMENT ====================
  tasks: {
    list: adminProcedure.query(async () => {
      const database = await db.getDb();
      if (!database) return [];

      return await database.select().from(tasks).orderBy(desc(tasks.createdAt));
    }),

    create: adminProcedure
      .input(
        z.object({
          title: z.string().min(3).max(200),
          description: z.string(),
          type: z.enum(['manual', 'adgem', 'adsterra', 'cpalead', 'referral']),
          reward: z.number().min(1),
          proofRequired: z.boolean().default(true),
          maxParticipants: z.number().optional(),
          url: z.string().url().optional(),
          instructions: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        await database.insert(tasks).values({
          title: input.title,
          description: input.description,
          type: input.type,
          reward: input.reward,
          proofRequired: input.proofRequired,
          maxParticipants: input.maxParticipants,
          url: input.url,
          instructions: input.instructions,
          status: 'active',
          currentParticipants: 0,
          createdBy: ctx.user.id,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'create_task',
          targetType: 'task',
          targetId: input.title,
          details: JSON.stringify(input),
        });

        return { success: true, message: 'Task created successfully' };
      }),

    update: adminProcedure
      .input(
        z.object({
          taskId: z.number(),
          title: z.string().min(3).max(200).optional(),
          description: z.string().optional(),
          reward: z.number().min(1).optional(),
          status: z.enum(['active', 'paused', 'completed', 'cancelled']).optional(),
          maxParticipants: z.number().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        const updateData: any = {};
        if (input.title) updateData.title = input.title;
        if (input.description) updateData.description = input.description;
        if (input.reward) updateData.reward = input.reward;
        if (input.status) updateData.status = input.status;
        if (input.maxParticipants) updateData.maxParticipants = input.maxParticipants;
        updateData.updatedAt = new Date();

        await database
          .update(tasks)
          .set(updateData)
          .where(eq(tasks.id, input.taskId));

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'update_task',
          targetType: 'task',
          targetId: input.taskId.toString(),
          details: JSON.stringify(updateData),
        });

        return { success: true, message: 'Task updated successfully' };
      }),

    delete: adminProcedure
      .input(z.object({ taskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        await database.delete(tasks).where(eq(tasks.id, input.taskId));

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'delete_task',
          targetType: 'task',
          targetId: input.taskId.toString(),
        });

        return { success: true, message: 'Task deleted successfully' };
      }),

    pendingProofs: adminProcedure.query(async () => {
      return await db.getPendingUserTasks();
    }),

    approveProof: adminProcedure
      .input(z.object({ userTaskId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        const userTask = await database
          .select()
          .from(userTasks)
          .where(eq(userTasks.id, input.userTaskId))
          .limit(1);

        if (userTask.length === 0) {
          throw new Error('User task not found');
        }

        const task = await db.getTaskById(userTask[0].taskId);
        if (!task) throw new Error('Task not found');

        const user = await db.getUser(userTask[0].userId);
        if (!user) throw new Error('User not found');

        // Calculate reward with level bonus
        const levelInfo = LEVELS[user.level as keyof typeof LEVELS];
        const baseReward = task.reward;
        const bonusMultiplier = 1 + (levelInfo.bonus / 100);
        const finalReward = Math.floor(baseReward * bonusMultiplier);

        // Update user task
        await database
          .update(userTasks)
          .set({
            status: 'approved',
            rewardAmount: finalReward,
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
          })
          .where(eq(userTasks.id, input.userTaskId));

        // Credit wallet
        await db.updateWalletBalance(userTask[0].userId, finalReward, 'add');
        
        await db.createTransaction({
          userId: userTask[0].userId,
          type: 'task_reward',
          amount: finalReward,
          description: `Reward for task: ${task.title}`,
          referenceType: 'task',
          referenceId: task.id.toString(),
          createdBy: ctx.user.id,
        });

        // Create notification
        await db.createNotification({
          userId: userTask[0].userId,
          type: 'task_approved',
          title: 'Task Approved!',
          message: `Your task "${task.title}" has been approved. You earned ${formatCurrency(finalReward)}!`,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'approve_task_proof',
          targetType: 'user_task',
          targetId: input.userTaskId.toString(),
          details: JSON.stringify({ reward: finalReward }),
        });

        return { success: true, message: 'Task proof approved' };
      }),

    rejectProof: adminProcedure
      .input(
        z.object({
          userTaskId: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        await database
          .update(userTasks)
          .set({
            status: 'rejected',
            rejectionReason: input.reason,
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
          })
          .where(eq(userTasks.id, input.userTaskId));

        const userTask = await database
          .select()
          .from(userTasks)
          .where(eq(userTasks.id, input.userTaskId))
          .limit(1);

        if (userTask.length > 0) {
          await db.createNotification({
            userId: userTask[0].userId,
            type: 'task_rejected',
            title: 'Task Rejected',
            message: `Your task proof was rejected. Reason: ${input.reason}`,
          });
        }

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'reject_task_proof',
          targetType: 'user_task',
          targetId: input.userTaskId.toString(),
          details: JSON.stringify({ reason: input.reason }),
        });

        return { success: true, message: 'Task proof rejected' };
      }),
  },

  // ==================== WITHDRAWAL MANAGEMENT ====================
  withdrawals: {
    pending: adminProcedure.query(async () => {
      return await db.getPendingWithdrawals();
    }),

    approve: adminProcedure
      .input(
        z.object({
          withdrawalId: z.number(),
          txHash: z.string().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        const withdrawal = await database
          .select()
          .from(withdrawals)
          .where(eq(withdrawals.id, input.withdrawalId))
          .limit(1);

        if (withdrawal.length === 0) {
          throw new Error('Withdrawal not found');
        }

        const user = await db.getUser(withdrawal[0].userId);
        if (!user) throw new Error('User not found');

        // Update withdrawal status
        await database
          .update(withdrawals)
          .set({
            status: 'completed',
            txHash: input.txHash,
            processedAt: new Date(),
            processedBy: ctx.user.id,
          })
          .where(eq(withdrawals.id, input.withdrawalId));

        // Update wallet
        const wallet = await db.getOrCreateWallet(withdrawal[0].userId);
        await database
          .update(wallets)
          .set({
            pendingBalance: wallet.pendingBalance - withdrawal[0].amount,
            totalWithdrawn: wallet.totalWithdrawn + withdrawal[0].amount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, withdrawal[0].userId));

        // Send email
        await sendWithdrawalApprovedEmail(
          user.email,
          user.fullName,
          withdrawal[0].amount,
          input.txHash
        );

        // Create notification
        await db.createNotification({
          userId: withdrawal[0].userId,
          type: 'withdrawal_completed',
          title: 'Withdrawal Completed',
          message: `Your withdrawal of ${formatCurrency(withdrawal[0].amount)} has been processed successfully!`,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'approve_withdrawal',
          targetType: 'withdrawal',
          targetId: input.withdrawalId.toString(),
          details: JSON.stringify({ txHash: input.txHash }),
        });

        return { success: true, message: 'Withdrawal approved' };
      }),

    reject: adminProcedure
      .input(
        z.object({
          withdrawalId: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        const withdrawal = await database
          .select()
          .from(withdrawals)
          .where(eq(withdrawals.id, input.withdrawalId))
          .limit(1);

        if (withdrawal.length === 0) {
          throw new Error('Withdrawal not found');
        }

        // Update withdrawal status
        await database
          .update(withdrawals)
          .set({
            status: 'rejected',
            rejectionReason: input.reason,
            processedAt: new Date(),
            processedBy: ctx.user.id,
          })
          .where(eq(withdrawals.id, input.withdrawalId));

        // Refund to balance
        const wallet = await db.getOrCreateWallet(withdrawal[0].userId);
        await database
          .update(wallets)
          .set({
            balance: wallet.balance + withdrawal[0].amount,
            pendingBalance: wallet.pendingBalance - withdrawal[0].amount,
            updatedAt: new Date(),
          })
          .where(eq(wallets.userId, withdrawal[0].userId));

        // Create notification
        await db.createNotification({
          userId: withdrawal[0].userId,
          type: 'withdrawal_rejected',
          title: 'Withdrawal Rejected',
          message: `Your withdrawal request was rejected. Reason: ${input.reason}. The amount has been refunded to your balance.`,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'reject_withdrawal',
          targetType: 'withdrawal',
          targetId: input.withdrawalId.toString(),
          details: JSON.stringify({ reason: input.reason }),
        });

        return { success: true, message: 'Withdrawal rejected and refunded' };
      }),
  },

  // ==================== LEVEL REQUESTS ====================
  levelRequests: {
    pending: adminProcedure.query(async () => {
      return await db.getPendingLevelRequests();
    }),

    approve: adminProcedure
      .input(z.object({ requestId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        const request = await database
          .select()
          .from(levelRequests)
          .where(eq(levelRequests.id, input.requestId))
          .limit(1);

        if (request.length === 0) {
          throw new Error('Level request not found');
        }

        // Update request
        await database
          .update(levelRequests)
          .set({
            status: 'approved',
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
          })
          .where(eq(levelRequests.id, input.requestId));

        // Update user level
        await db.updateUserLevel(request[0].userId, request[0].toLevel);

        // Create notification
        await db.createNotification({
          userId: request[0].userId,
          type: 'level_upgraded',
          title: 'Level Upgraded!',
          message: `Congratulations! You've been upgraded to Level ${request[0].toLevel}!`,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'approve_level_request',
          targetType: 'level_request',
          targetId: input.requestId.toString(),
        });

        return { success: true, message: 'Level request approved' };
      }),

    reject: adminProcedure
      .input(
        z.object({
          requestId: z.number(),
          reason: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const database = await db.getDb();
        if (!database) throw new Error('Database not available');

        const request = await database
          .select()
          .from(levelRequests)
          .where(eq(levelRequests.id, input.requestId))
          .limit(1);

        if (request.length === 0) {
          throw new Error('Level request not found');
        }

        // Update request
        await database
          .update(levelRequests)
          .set({
            status: 'rejected',
            rejectionReason: input.reason,
            reviewedAt: new Date(),
            reviewedBy: ctx.user.id,
          })
          .where(eq(levelRequests.id, input.requestId));

        // Refund cost
        await db.updateWalletBalance(request[0].userId, request[0].cost, 'add');
        
        await db.createTransaction({
          userId: request[0].userId,
          type: 'admin_adjustment',
          amount: request[0].cost,
          description: 'Level upgrade request refund',
          createdBy: ctx.user.id,
        });

        // Create notification
        await db.createNotification({
          userId: request[0].userId,
          type: 'level_request_rejected',
          title: 'Level Request Rejected',
          message: `Your level upgrade request was rejected. Reason: ${input.reason}. The cost has been refunded.`,
        });

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'reject_level_request',
          targetType: 'level_request',
          targetId: input.requestId.toString(),
          details: JSON.stringify({ reason: input.reason }),
        });

        return { success: true, message: 'Level request rejected and refunded' };
      }),
  },

  // ==================== SETTINGS ====================
  settings: {
    get: adminProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return await db.getSetting(input.key);
      }),

    set: adminProcedure
      .input(
        z.object({
          key: z.string(),
          value: z.string(),
          type: z.enum(['string', 'number', 'boolean', 'json']).default('string'),
        })
      )
      .mutation(async ({ ctx, input }) => {
        await db.setSetting(input.key, input.value, input.type, ctx.user.id);

        await db.logAdminAction({
          adminId: ctx.user.id,
          action: 'update_setting',
          targetType: 'setting',
          targetId: input.key,
          details: JSON.stringify({ value: input.value }),
        });

        return { success: true, message: 'Setting updated' };
      }),
  },
});

