import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create SUPER_ADMIN
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'PromoHive@Admin2025!', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: process.env.ADMIN_EMAIL || '1sanadsa1997@gmil.com' },
    update: {},
    create: {
      username: 'superadmin',
      email: process.env.ADMIN_EMAIL || '1sanadsa1997@gmil.com',
      password: hashedPassword,
      fullName: process.env.ADMIN_NAME || 'Super Admin',
      role: 'SUPER_ADMIN',
      level: 3,
      isApproved: true,
      wallet: {
        create: {
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
          totalWithdrawn: 0,
        },
      },
    },
  });

  console.log('✅ Created SUPER_ADMIN:', admin.email);

  // Create sample tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Complete Survey',
        description: 'Fill out a short survey about your preferences',
        type: 'MANUAL',
        reward: 5.00,
        instructions: '1. Click the link\n2. Complete the survey\n3. Submit proof',
        url: 'https://example.com/survey',
        proofRequired: true,
        status: 'ACTIVE',
        maxParticipants: 100,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Watch Video',
        description: 'Watch a 5-minute promotional video',
        type: 'MANUAL',
        reward: 2.50,
        instructions: 'Watch the entire video and provide screenshot',
        url: 'https://example.com/video',
        proofRequired: true,
        status: 'ACTIVE',
      },
    }),
    prisma.task.create({
      data: {
        title: 'Sign up for Service',
        description: 'Create an account on partner platform',
        type: 'MANUAL',
        reward: 10.00,
        instructions: 'Sign up using your email and verify account',
        url: 'https://example.com/signup',
        proofRequired: true,
        status: 'ACTIVE',
        maxParticipants: 50,
      },
    }),
  ]);

  console.log('✅ Created sample tasks:', tasks.length);

  // Create sample offers
  const offers = await Promise.all([
    prisma.offer.create({
      data: {
        externalId: 'ADGEM_001',
        source: 'ADGEM',
        title: 'Install Mobile Game',
        description: 'Download and reach level 10',
        reward: 15.00,
        url: 'https://adgem.com/offer/1',
        isActive: true,
      },
    }),
    prisma.offer.create({
      data: {
        externalId: 'ADSTERRA_001',
        source: 'ADSTERRA',
        title: 'View Ads',
        description: 'View promotional content',
        reward: 1.00,
        url: 'https://adsterra.com/offer/1',
        isActive: true,
      },
    }),
  ]);

  console.log('✅ Created sample offers:', offers.length);

  // Create settings
  const settings = await Promise.all([
    prisma.setting.upsert({
      where: { key: 'WELCOME_BONUS' },
      update: {},
      create: { key: 'WELCOME_BONUS', value: '5.00' },
    }),
    prisma.setting.upsert({
      where: { key: 'MIN_WITHDRAWAL' },
      update: {},
      create: { key: 'MIN_WITHDRAWAL', value: '10.00' },
    }),
    prisma.setting.upsert({
      where: { key: 'USDT_RATE' },
      update: {},
      create: { key: 'USDT_RATE', value: '1.0' },
    }),
  ]);

  console.log('✅ Created settings:', settings.length);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

