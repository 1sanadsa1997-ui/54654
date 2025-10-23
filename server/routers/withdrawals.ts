import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as db from '../db';
import { withdrawals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { formatCurrency, WITHDRAWAL_CONFIG } from '../../shared/constants';

export const withdrawalsRouter = router({
  // Get withdrawal history
  list: protectedProcedure.query(async ({ ctx }) => {
    const userWithdrawals = await db.getUserWithdrawals(ctx.user.id);
    
    return userWithdrawals.map((w) => ({
      ...w,
      amountFormatted: formatCurrency(w.amount),
      usdtAmountFormatted: `${(w.usdtAmount / 100).toFixed(2)} USDT`,
      conversionRateFormatted: (w.conversionRate / 10000).toFixed(4),
    }));
  }),

  // Request withdrawal
  request: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(WITHDRAWAL_CONFIG.MIN_AMOUNT),
        walletAddress: z.string().min(10),
        network: z.enum(WITHDRAWAL_CONFIG.NETWORKS as any).default('TRC20'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const wallet = await db.getOrCreateWallet(ctx.user.id);

      // Check balance
      if (wallet.balance < input.amount) {
        throw new Error('Insufficient balance');
      }

      // Get conversion rate from settings or env
      const conversionRateStr = await db.getSetting('USDT_CONVERSION_RATE');
      const conversionRate = conversionRateStr
        ? parseFloat(conversionRateStr) * 10000
        : 10000; // 1.0 default

      const usdtAmount = Math.floor((input.amount * conversionRate) / 10000);

      // Create withdrawal request
      await db.createWithdrawal({
        userId: ctx.user.id,
        amount: input.amount,
        usdtAmount,
        conversionRate: Math.floor(conversionRate),
        walletAddress: input.walletAddress,
        network: input.network,
      });

      // Deduct from balance and add to pending
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      const { wallets } = await import('../../drizzle/schema');

      await database
        .update(wallets)
        .set({
          balance: wallet.balance - input.amount,
          pendingBalance: wallet.pendingBalance + input.amount,
          updatedAt: new Date(),
        })
        .where(eq(wallets.userId, ctx.user.id));

      // Create transaction record
      await db.createTransaction({
        userId: ctx.user.id,
        type: 'withdrawal',
        amount: -input.amount,
        description: `Withdrawal request to ${input.walletAddress}`,
        referenceType: 'withdrawal',
      });

      // Create notification
      await db.createNotification({
        userId: ctx.user.id,
        type: 'withdrawal_requested',
        title: 'Withdrawal Requested',
        message: `Your withdrawal request of ${formatCurrency(input.amount)} has been submitted and is pending approval.`,
      });

      return {
        success: true,
        message: 'Withdrawal request submitted successfully',
      };
    }),

  // Get withdrawal config
  config: protectedProcedure.query(async () => {
    const conversionRateStr = await db.getSetting('USDT_CONVERSION_RATE');
    const conversionRate = conversionRateStr ? parseFloat(conversionRateStr) : 1.0;

    return {
      minAmount: WITHDRAWAL_CONFIG.MIN_AMOUNT,
      minAmountFormatted: formatCurrency(WITHDRAWAL_CONFIG.MIN_AMOUNT),
      networks: WITHDRAWAL_CONFIG.NETWORKS,
      conversionRate,
    };
  }),
});

