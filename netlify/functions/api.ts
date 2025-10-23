const { Handler } = require('@netlify/functions');

const handler = async (event, context) => {
  console.log('API called:', {
    method: event.httpMethod,
    path: event.path,
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
      const body = JSON.parse(event.body || '{}');
      
      // Simple validation
      if (!body.email || !body.password) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Email and password are required' }),
        };
      }

      // Mock login response
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Login successful',
          user: {
            id: '1',
            username: 'testuser',
            email: body.email,
            fullName: 'Test User',
            role: 'USER',
            level: 0,
            balance: 100,
            isApproved: true,
            isSuspended: false,
          },
          token: 'mock-jwt-token',
        }),
      };
    } else if (path.startsWith('/auth/register') && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      // Simple validation
      if (!body.username || !body.email || !body.password || !body.fullName) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'All fields are required' }),
        };
      }

      // Mock registration response
      return {
        statusCode: 201,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Registration successful. Your account is under review.',
          userId: '2',
        }),
      };
    } else if (path.startsWith('/auth/me') && event.httpMethod === 'GET') {
      // Mock user info response
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'User info retrieved successfully',
          user: {
            id: '1',
            username: 'testuser',
            email: 'test@example.com',
            fullName: 'Test User',
            role: 'USER',
            level: 0,
            balance: 100,
            isApproved: false, // Pending approval
            isSuspended: false,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
        }),
      };
    } else if (path.startsWith('/user/wallet') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          wallet: {
            balance: 100,
            pendingBalance: 0,
            totalEarned: 100,
            totalWithdrawn: 0,
          }
        }),
      };
    } else if (path.startsWith('/user/stats') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          stats: {
            totalEarned: 100,
            totalWithdrawn: 0,
            currentBalance: 100,
            completedTasks: 5,
            totalReferrals: 2,
            totalWithdrawals: 0,
          }
        }),
      };
    } else if (path.startsWith('/tasks') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          tasks: [
            {
              id: '1',
              title: 'Follow Instagram Account',
              description: 'Follow our Instagram account and get rewarded',
              type: 'MANUAL',
              reward: 10,
              instructions: 'Follow @promohive on Instagram',
              url: 'https://instagram.com/promohive',
              proofRequired: true,
              maxParticipants: 100,
              currentParticipants: 25,
            },
            {
              id: '2',
              title: 'Join Telegram Channel',
              description: 'Join our Telegram channel for updates',
              type: 'MANUAL',
              reward: 5,
              instructions: 'Join our Telegram channel',
              url: 'https://t.me/promohive',
              proofRequired: true,
              maxParticipants: 200,
              currentParticipants: 50,
            }
          ]
        }),
      };
    } else if (path.startsWith('/referrals/code') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          referralCode: 'testuser',
          referralUrl: `${process.env.FRONTEND_URL || 'https://globalpromonetwork.netlify.app'}/register?ref=testuser`,
        }),
      };
    } else if (path.startsWith('/referrals/list') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          referrals: [
            {
              id: '1',
              level: 1,
              bonus: 5,
              isPaid: false,
              createdAt: new Date().toISOString(),
              referred: {
                id: '2',
                username: 'user2',
                email: 'user2@example.com',
                fullName: 'User Two',
                createdAt: new Date().toISOString(),
              }
            }
          ]
        }),
      };
    } else if (path.startsWith('/withdrawals/request') && event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      
      if (!body.amount || !body.walletAddress || !body.network) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'All withdrawal fields are required' }),
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'Withdrawal request submitted successfully',
          withdrawal: {
            id: '1',
            amount: body.amount,
            usdtAmount: body.amount,
            network: body.network,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
          }
        }),
      };
    } else if (path.startsWith('/withdrawals/list') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          withdrawals: [
            {
              id: '1',
              amount: 50,
              usdtAmount: 50,
              network: 'TRC20',
              status: 'PENDING',
              txHash: null,
              createdAt: new Date().toISOString(),
              processedAt: null,
            }
          ]
        }),
      };
    } else if (path.startsWith('/admin/users') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          users: [
            {
              id: '1',
              username: 'testuser',
              email: 'test@example.com',
              fullName: 'Test User',
              role: 'USER',
              level: 0,
              isApproved: false,
              isSuspended: false,
              balance: 100,
              createdAt: new Date().toISOString(),
              lastLoginAt: new Date().toISOString(),
            }
          ]
        }),
      };
    } else if (path.startsWith('/admin/users/') && path.includes('/approve') && event.httpMethod === 'POST') {
      const userId = event.path.split('/')[3];
      
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: 'User approved successfully',
          user: {
            id: userId,
            username: 'testuser',
            email: 'test@example.com',
            isApproved: true,
          }
        }),
      };
    } else if (path.startsWith('/admin/stats') && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          stats: {
            totalUsers: 10,
            pendingApprovals: 3,
            activeUsers: 7,
            totalTasks: 5,
            totalWithdrawals: 2,
            totalRevenue: 500,
          }
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
  } catch (error) {
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
        stack: error.stack,
      }),
    };
  }
};

module.exports = { handler };
