import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
  console.log('Simple API called:', {
    method: event.httpMethod,
    path: event.path,
    headers: event.headers,
    environment: {
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
      NODE_ENV: process.env.NODE_ENV,
    }
  });

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: '',
    };
  }

  try {
    const path = event.path.replace('/api', '');
    
    if (path.startsWith('/auth/login') && event.httpMethod === 'POST') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Login endpoint reached',
          environment: {
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
            NODE_ENV: process.env.NODE_ENV,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    } else if (path.startsWith('/auth/register') && event.httpMethod === 'POST') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Register endpoint reached',
          environment: {
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
            NODE_ENV: process.env.NODE_ENV,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    } else if (path.startsWith('/auth/me') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Me endpoint reached',
          environment: {
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
            NODE_ENV: process.env.NODE_ENV,
          },
          timestamp: new Date().toISOString(),
        }),
      };
    } else {
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
          environment: {
            DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
            JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ? 'Set' : 'Not set',
            NODE_ENV: process.env.NODE_ENV,
          },
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
      body: JSON.stringify({ 
        error: 'Internal server error',
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
