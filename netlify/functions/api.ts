import { Handler } from '@netlify/functions';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import prisma from './prisma';

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  console.log('API Function called:', {
    method: event.httpMethod,
    path: event.path,
    body: event.body
  });

  try {
    const path = event.path.replace('/api', '');
    
    // Handle different endpoints
    if (path.startsWith('/auth/login') && event.httpMethod === 'POST') {
      return await handleLogin(event);
    } else if (path.startsWith('/auth/register') && event.httpMethod === 'POST') {
      return await handleRegister(event);
    } else if (path.startsWith('/auth/me') && event.httpMethod === 'GET') {
      return await handleMe(event);
    } else {
      // Default response for any API call
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'API is working!',
          method: event.httpMethod,
          path: event.path,
          endpoint: path,
          timestamp: new Date().toISOString(),
        }),
      };
    }
  } catch (error: any) {
    console.error('API Function error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Real login handler with database
async function handleLogin(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = schema.parse(body);

    const user = await prisma.user.findUnique({ 
      where: { email },
      include: { wallet: true },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid credentials' }),
      };
    }

    if (!user.isApproved) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Account pending approval' }),
      };
    }

    if (user.isSuspended) {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Account suspended' }),
      };
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          level: user.level,
          balance: user.wallet?.balance || 0,
        },
      }),
    };
  } catch (error: any) {
    console.error('Login error:', error);
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

// Real register handler with database
async function handleRegister(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    const schema = z.object({
      username: z.string().min(3).max(50),
      email: z.string().email(),
      password: z.string().min(8),
      fullName: z.string().min(2).max(100),
      referredBy: z.string().optional(),
    });

    const data = schema.parse(body);

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existing) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Email or username already exists' }),
      };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        fullName: data.fullName,
        wallet: { create: {} },
      },
    });

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Registration successful. Your account is under review.',
        userId: user.id,
      }),
    };
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.name === 'ZodError') {
      const validationErrors = error.errors.map((err: any) => ({
        field: err.path.join('.'),
        message: err.message
      }));
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Validation failed',
          details: validationErrors
        }),
      };
    }
    
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
}

// Simple me handler
async function handleMe(event: any) {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: 'User info endpoint reached',
      user: null,
      timestamp: new Date().toISOString(),
    }),
  };
}
