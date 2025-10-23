import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as db from '../db';
import { formatCurrency } from '../../shared/constants';

export const userRouter = router({
  // Get user profile
  profile: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUser(ctx.user.id);
    if (!user) throw new Error('User not found');

    const wallet = await db.getOrCreateWallet(ctx.user.id);
    
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      gender: user.gender,
      birthdate: user.birthdate,
      role: user.role,
      status: user.status,
      level: user.level,
      referralCode: user.referralCode,
      createdAt: user.createdAt,
      wallet: {
        balance: wallet.balance,
        totalEarned: wallet.totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        pendingBalance: wallet.pendingBalance,
        balanceFormatted: formatCurrency(wallet.balance),
        totalEarnedFormatted: formatCurrency(wallet.totalEarned),
      },
    };
  }),

  // Get wallet details
  wallet: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await db.getOrCreateWallet(ctx.user.id);
    return {
      ...wallet,
      balanceFormatted: formatCurrency(wallet.balance),
      totalEarnedFormatted: formatCurrency(wallet.totalEarned),
      totalWithdrawnFormatted: formatCurrency(wallet.totalWithdrawn),
      pendingBalanceFormatted: formatCurrency(wallet.pendingBalance),
    };
  }),

  // Get transaction history
  transactions: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const transactions = await db.getUserTransactions(
        ctx.user.id,
        input?.limit || 50
      );
      
      return transactions.map((tx) => ({
        ...tx,
        amountFormatted: formatCurrency(Math.abs(tx.amount)),
        balanceBeforeFormatted: formatCurrency(tx.balanceBefore),
        balanceAfterFormatted: formatCurrency(tx.balanceAfter),
      }));
    }),

  // Get dashboard stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const wallet = await db.getOrCreateWallet(ctx.user.id);
    const referrals = await db.getUserReferrals(ctx.user.id);
    const userTasks = await db.getUserTasksWithDetails(ctx.user.id);
    
    const completedTasks = userTasks.filter(
      (ut) => ut.userTask.status === 'approved'
    ).length;
    
    const pendingTasks = userTasks.filter(
      (ut) => ut.userTask.status === 'submitted'
    ).length;

    return {
      balance: wallet.balance,
      balanceFormatted: formatCurrency(wallet.balance),
      totalEarned: wallet.totalEarned,
      totalEarnedFormatted: formatCurrency(wallet.totalEarned),
      totalReferrals: referrals.length,
      completedTasks,
      pendingTasks,
    };
  }),

  // Get notifications
  notifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return await db.getUserNotifications(ctx.user.id, input?.limit || 20);
    }),

  // Mark notification as read
  markNotificationRead: protectedProcedure
    .input(z.object({ notificationId: z.number() }))
    .mutation(async ({ input }) => {
      await db.markNotificationAsRead(input.notificationId);
      return { success: true };
    }),

  // Update profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        fullName: z.string().min(2).max(100).optional(),
        gender: z.enum(['male', 'female', 'other']).optional(),
        birthdate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      const { users } = await import('../../drizzle/schema');
      const { eq } = await import('drizzle-orm');

      const updateData: any = {};
      if (input.fullName) updateData.fullName = input.fullName;
      if (input.gender) updateData.gender = input.gender;
      if (input.birthdate) updateData.birthdate = new Date(input.birthdate);

      await database
        .update(users)
        .set(updateData)
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: 'Profile updated successfully' };
    }),
});

