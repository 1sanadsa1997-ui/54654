import { Handler } from '@netlify/functions';
import prisma from './prisma';

export const handler: Handler = async (event, context) => {
  console.log('Environment variables:', {
    DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
    NODE_ENV: process.env.NODE_ENV,
  });

  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
    
    await prisma.$disconnect();
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Database connection successful',
        userCount,
        environment: {
          DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
          JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
          NODE_ENV: process.env.NODE_ENV,
        }
      }),
    };
  } catch (error: any) {
    console.error('Database connection error:', error);
    
    await prisma.$disconnect();
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Database connection failed',
        message: error.message,
        environment: {
          DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
          JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
          NODE_ENV: process.env.NODE_ENV,
        }
      }),
    };
  }
};
