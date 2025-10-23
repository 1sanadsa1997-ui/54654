import { Handler } from '@netlify/functions';
import bcrypt from 'bcrypt';
import { z } from 'zod';

// Simple in-memory database for demo purposes
// In production, you would use a real database
const users: any[] = [];
let nextId = 1;

// Add a test user for demo purposes
(async () => {
  const testUser = {
    id: nextId++,
    username: 'testuser',
    email: 'test@example.com',
    password: await bcrypt.hash('password123', 10),
    fullName: 'Test User',
    role: 'USER',
    level: 0,
    isApproved: true,
    isSuspended: false,
    balance: 100,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  users.push(testUser);
})();

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
    } else if (path.startsWith('/user/stats') && event.httpMethod === 'GET') {
      return await handleUserStats(event);
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

// Simple login handler with in-memory database
async function handleLogin(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    const schema = z.object({
      email: z.string().email(),
      password: z.string(),
    });

    const { email, password } = schema.parse(body);

    // Find user in memory
    const user = users.find(u => u.email === email);

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
    user.lastLoginAt = new Date();

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
          balance: user.balance || 0,
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

// Simple register handler with in-memory database
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
    const existing = users.find(u => 
      u.email === data.email || u.username === data.username
    );

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

    const user = {
      id: nextId++,
      username: data.username,
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      role: 'USER',
      level: 0,
      isApproved: false,
      isSuspended: false,
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    users.push(user);

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

// Real me handler with database
async function handleMe(event: any) {
  try {
    // For now, return a simple response
    // In a real app, you'd validate the JWT token here
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'User info endpoint reached',
        user: null, // Will be implemented with proper auth
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('Me error:', error);
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

// User stats handler with in-memory database
async function handleUserStats(event: any) {
  try {
    const totalUsers = users.length;
    const pendingApprovals = users.filter(u => !u.isApproved).length;
    const activeUsers = users.filter(u => u.isApproved && !u.isSuspended).length;

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'User stats endpoint reached',
        stats: {
          totalUsers,
          pendingApprovals,
          activeUsers,
        },
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
    console.error('User stats error:', error);
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
