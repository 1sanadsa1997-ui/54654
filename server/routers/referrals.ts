import { z } from 'zod';
import { router, protectedProcedure } from '../_core/trpc';
import * as db from '../db';
import { formatCurrency, REFERRAL_BONUSES } from '../../shared/constants';

export const referralsRouter = router({
  // Get user's referral code
  myCode: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUser(ctx.user.id);
    if (!user) throw new Error('User not found');

    return {
      referralCode: user.referralCode,
      referralUrl: `${process.env.PLATFORM_URL || 'http://localhost:3000'}/register?ref=${user.referralCode}`,
    };
  }),

  // Get user's referrals
  myReferrals: protectedProcedure.query(async ({ ctx }) => {
    const referrals = await db.getUserReferrals(ctx.user.id);
    
    return referrals.map((item) => ({
      referral: {
        ...item.referral,
        bonusAmountFormatted: item.referral.bonusAmount
          ? formatCurrency(item.referral.bonusAmount)
          : null,
      },
      user: item.user,
    }));
  }),

  // Get referral tree
  tree: protectedProcedure
    .input(
      z.object({
        maxLevel: z.number().min(1).max(3).default(3),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const tree = await db.getReferralTree(ctx.user.id, input?.maxLevel || 3);
      return tree;
    }),

  // Get referral stats
  stats: protectedProcedure.query(async ({ ctx }) => {
    const referrals = await db.getUserReferrals(ctx.user.id);
    
    const level1 = referrals.filter((r) => r.referral.level === 1);
    const level2 = referrals.filter((r) => r.referral.level === 2);
    const level3 = referrals.filter((r) => r.referral.level === 3);

    const totalEarned = referrals.reduce(
      (sum, r) => sum + (r.referral.bonusAmount || 0),
      0
    );

    return {
      total: referrals.length,
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      totalEarned,
      totalEarnedFormatted: formatCurrency(totalEarned),
      bonuses: {
        level1: {
          bonus: REFERRAL_BONUSES.L1.bonus,
          bonusFormatted: formatCurrency(REFERRAL_BONUSES.L1.bonus),
          perInvitee: REFERRAL_BONUSES.L1.perInvitee,
          perInviteeFormatted: formatCurrency(REFERRAL_BONUSES.L1.perInvitee),
        },
        level2: {
          bonus: REFERRAL_BONUSES.L2.bonus,
          bonusFormatted: formatCurrency(REFERRAL_BONUSES.L2.bonus),
        },
        level3: {
          bonus: REFERRAL_BONUSES.L3.bonus,
          bonusFormatted: formatCurrency(REFERRAL_BONUSES.L3.bonus),
        },
        newInvitee: {
          bonus: REFERRAL_BONUSES.NEW_INVITEE,
          bonusFormatted: formatCurrency(REFERRAL_BONUSES.NEW_INVITEE),
        },
      },
    };
  }),
});

