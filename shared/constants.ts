/**
 * PromoHive Shared Constants
 * Constants used across client and server
 */

// Level Configuration
export const LEVELS = {
  0: { cap: 990, upgrade: 0, bonus: 0 }, // $9.90
  1: { cap: 5000, upgrade: 5000, bonus: 35 }, // $50
  2: { cap: 10000, upgrade: 10000, bonus: 55 }, // $100
  3: { cap: 15000, upgrade: 15000, bonus: 75 }, // $150
} as const;

// Referral Configuration
export const REFERRAL_BONUSES = {
  L1: { bonus: 7000, perInvitee: 500 }, // $70 + $5/invitee
  L2: { bonus: 13000 }, // $130
  L3: { bonus: 18000 }, // $180
  NEW_INVITEE: 1000, // $10
} as const;

// Withdrawal Configuration
export const WITHDRAWAL_CONFIG = {
  MIN_AMOUNT: 1000, // $10 in cents
  NETWORKS: ['TRC20', 'ERC20', 'BEP20'] as const,
} as const;

// Task Types
export const TASK_TYPES = {
  MANUAL: 'manual',
  ADGEM: 'adgem',
  ADSTERRA: 'adsterra',
  CPALEAD: 'cpalead',
  REFERRAL: 'referral',
} as const;

// User Status
export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  SUSPENDED: 'suspended',
  REJECTED: 'rejected',
} as const;

// User Roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

// Transaction Types
export const TRANSACTION_TYPES = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  BONUS: 'bonus',
  TASK_REWARD: 'task_reward',
  REFERRAL_REWARD: 'referral_reward',
  WITHDRAWAL: 'withdrawal',
  LEVEL_UPGRADE: 'level_upgrade',
  ADMIN_ADJUSTMENT: 'admin_adjustment',
} as const;

// Helper Functions
export function formatCurrency(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function getLevelInfo(level: number) {
  return LEVELS[level as keyof typeof LEVELS] || LEVELS[0];
}

export function getNextLevel(currentLevel: number) {
  const nextLevel = currentLevel + 1;
  return nextLevel <= 3 ? nextLevel : null;
}

export function canUpgradeLevel(currentBalance: number, currentLevel: number): boolean {
  const nextLevel = getNextLevel(currentLevel);
  if (!nextLevel) return false;
  
  const levelInfo = getLevelInfo(nextLevel);
  return currentBalance >= levelInfo.upgrade;
}

