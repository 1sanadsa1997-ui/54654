import { z } from 'zod';
import { router, publicProcedure, protectedProcedure } from '../_core/trpc';
import * as db from '../db';
import { users, magicLinkTokens, referrals } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendWelcomeEmail, sendMagicLinkEmail } from '../email';
import { generateReferralCode } from '../../shared/constants';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const authRouter = router({
  // Get current user
  me: publicProcedure.query(({ ctx }) => ctx.user),

  // Register new user
  register: publicProcedure
    .input(
      z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        fullName: z.string().min(2).max(100),
        password: z.string().min(8),
        gender: z.enum(['male', 'female', 'other']).optional(),
        birthdate: z.string().optional(),
        referredBy: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if user already exists
      const existingEmail = await db.getUserByEmail(input.email);
      if (existingEmail) {
        throw new Error('Email already registered');
      }

      const existingUsername = await db.getUserByUsername(input.username);
      if (existingUsername) {
        throw new Error('Username already taken');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

      // Generate unique referral code
      let referralCode = generateReferralCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await db.getDb().then(async (database) => {
          if (!database) return null;
          const result = await database
            .select()
            .from(users)
            .where(eq(users.referralCode, referralCode))
            .limit(1);
          return result.length > 0 ? result[0] : null;
        });
        if (!existing) break;
        referralCode = generateReferralCode();
        attempts++;
      }

      // Create user ID
      const userId = crypto.randomUUID();

      // Insert user
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      await database.insert(users).values({
        id: userId,
        username: input.username,
        email: input.email,
        fullName: input.fullName,
        passwordHash,
        gender: input.gender,
        birthdate: input.birthdate ? new Date(input.birthdate) : undefined,
        referralCode,
        referredBy: input.referredBy,
        status: 'pending',
        role: 'user',
        level: 0,
      });

      // Create wallet
      await db.getOrCreateWallet(userId);

      // Handle referral if exists
      if (input.referredBy) {
        const referrer = await database
          .select()
          .from(users)
          .where(eq(users.referralCode, input.referredBy))
          .limit(1);

        if (referrer.length > 0) {
          await db.createReferral({
            referrerId: referrer[0].id,
            referredId: userId,
            level: 1,
          });
        }
      }

      // Send welcome email
      await sendWelcomeEmail(input.email, input.fullName);

      return {
        success: true,
        message: 'Registration successful. Your account is under review.',
      };
    }),

  // Login with password
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user || !user.passwordHash) {
        throw new Error('Invalid credentials');
      }

      const valid = await bcrypt.compare(input.password, user.passwordHash);
      if (!valid) {
        throw new Error('Invalid credentials');
      }

      if (user.status !== 'approved') {
        throw new Error('Your account is not approved yet');
      }

      // Update last signed in
      const database = await db.getDb();
      if (database) {
        await database
          .update(users)
          .set({ lastSignedIn: new Date() })
          .where(eq(users.id, user.id));
      }

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          level: user.level,
        },
      };
    }),

  // Request magic link
  requestMagicLink: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ input }) => {
      const user = await db.getUserByEmail(input.email);
      if (!user) {
        // Don't reveal if email exists
        return { success: true, message: 'If the email exists, a magic link has been sent.' };
      }

      if (user.status !== 'approved') {
        throw new Error('Your account is not approved yet');
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      await database.insert(magicLinkTokens).values({
        token,
        userId: user.id,
        email: user.email,
        expiresAt,
        used: false,
      });

      const magicLink = `${process.env.PLATFORM_URL || 'http://localhost:3000'}/auth/magic-link?token=${token}`;
      await sendMagicLinkEmail(user.email, user.fullName, magicLink);

      return { success: true, message: 'Magic link sent to your email' };
    }),

  // Verify magic link
  verifyMagicLink: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input }) => {
      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      const tokenRecord = await database
        .select()
        .from(magicLinkTokens)
        .where(eq(magicLinkTokens.token, input.token))
        .limit(1);

      if (tokenRecord.length === 0) {
        throw new Error('Invalid magic link');
      }

      const record = tokenRecord[0];

      if (record.used) {
        throw new Error('Magic link already used');
      }

      if (new Date() > record.expiresAt) {
        throw new Error('Magic link expired');
      }

      // Mark as used
      await database
        .update(magicLinkTokens)
        .set({ used: true })
        .where(eq(magicLinkTokens.id, record.id));

      // Get user
      const user = await db.getUser(record.userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Update last signed in
      await database
        .update(users)
        .set({ lastSignedIn: new Date() })
        .where(eq(users.id, user.id));

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          level: user.level,
        },
      };
    }),

  // Logout
  logout: publicProcedure.mutation(() => {
    return { success: true };
  }),

  // Change password
  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string(),
        newPassword: z.string().min(8),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const user = await db.getUser(ctx.user.id);
      if (!user || !user.passwordHash) {
        throw new Error('User not found');
      }

      const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
      if (!valid) {
        throw new Error('Current password is incorrect');
      }

      const newPasswordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);

      const database = await db.getDb();
      if (!database) throw new Error('Database not available');

      await database
        .update(users)
        .set({ passwordHash: newPasswordHash })
        .where(eq(users.id, ctx.user.id));

      return { success: true, message: 'Password changed successfully' };
    }),
});

