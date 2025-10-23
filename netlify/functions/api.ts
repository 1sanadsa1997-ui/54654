import { Handler } from '@netlify/functions';

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
      return handleLogin(event);
    } else if (path.startsWith('/auth/register') && event.httpMethod === 'POST') {
      return handleRegister(event);
    } else if (path.startsWith('/auth/me') && event.httpMethod === 'GET') {
      return handleMe(event);
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

// Simple login handler
async function handleLogin(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Login endpoint reached',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
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

// Simple register handler
async function handleRegister(event: any) {
  try {
    const body = JSON.parse(event.body || '{}');
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Registration endpoint reached',
        data: body,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error: any) {
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
