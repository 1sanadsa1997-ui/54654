import cron from 'node-cron';
import { logger } from '../utils/logger';

export function startCronJobs() {
  // AdGem sync - Daily at 2 AM
  cron.schedule(process.env.ADGEM_SYNC_SCHEDULE || '0 2 * * *', () => {
    logger.info('Running AdGem sync...');
    // TODO: Implement AdGem sync
  });

  // Adsterra sync - Daily at 3 AM
  cron.schedule(process.env.ADSTERRA_SYNC_SCHEDULE || '0 3 * * *', () => {
    logger.info('Running Adsterra sync...');
    // TODO: Implement Adsterra sync
  });

  // CPAlead sync - Daily at 4 AM
  cron.schedule(process.env.CPALEAD_SYNC_SCHEDULE || '0 4 * * *', () => {
    logger.info('Running CPAlead sync...');
    // TODO: Implement CPAlead sync
  });

  logger.info('✅ Cron jobs scheduled');
}

