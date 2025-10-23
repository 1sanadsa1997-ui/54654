import { Handler } from '@netlify/functions';

export const handler: Handler = async (event, context) => {
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
        stack: error.stack,
      }),
    };
  }
};

export const handler: Handler = async (event, context) => {
  console.log('Full API called:', {
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
    
    // Handle different endpoints
    if (path.startsWith('/auth/login') && event.httpMethod === 'POST') {
      return await handleLogin(event);
    } else if (path.startsWith('/auth/register') && event.httpMethod === 'POST') {
      return await handleRegister(event);
    } else if (path.startsWith('/auth/me') && event.httpMethod === 'GET') {
      return await handleMe(event);
    } else if (path.startsWith('/auth/logout') && event.httpMethod === 'POST') {
      return await handleLogout(event);
    } else if (path.startsWith('/user/wallet') && event.httpMethod === 'GET') {
      return await handleUserWallet(event);
    } else if (path.startsWith('/user/stats') && event.httpMethod === 'GET') {
      return await handleUserStats(event);
    } else if (path.startsWith('/tasks') && event.httpMethod === 'GET') {
      return await handleGetTasks(event);
    } else if (path.startsWith('/referrals/code') && event.httpMethod === 'GET') {
      return await handleGetReferralCode(event);
    } else if (path.startsWith('/referrals/list') && event.httpMethod === 'GET') {
      return await handleGetReferrals(event);
    } else if (path.startsWith('/withdrawals/request') && event.httpMethod === 'POST') {
      return await handleWithdrawalRequest(event);
    } else if (path.startsWith('/withdrawals/list') && event.httpMethod === 'GET') {
      return await handleWithdrawalsList(event);
    } else if (path.startsWith('/admin/users') && event.httpMethod === 'GET') {
      return await handleAdminUsers(event);
    } else if (path.startsWith('/admin/users/') && path.includes('/approve') && event.httpMethod === 'POST') {
      return await handleApproveUser(event);
    } else if (path.startsWith('/admin/stats') && event.httpMethod === 'GET') {
      return await handleAdminStats(event);
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
        stack: error.stack,
      }),
    };
  }
};

// Authentication handlers
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

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=86400`,
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
        token,
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

    // Handle referral if provided
    if (data.referredBy) {
      const referrer = await prisma.user.findUnique({
        where: { username: data.referredBy },
      });
      
      if (referrer) {
        await prisma.referral.create({
          data: {
            referrerId: referrer.id,
            referredId: user.id,
            level: 1,
            bonus: 5.00,
          },
        });
      }
    }

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

async function handleMe(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Authentication required',
          message: 'Please login to access this resource'
        }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Invalid token',
          message: 'Please login again'
        }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { wallet: true },
    });

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'User not found',
          message: 'User account not found'
        }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'User info retrieved successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          level: user.level,
          balance: user.wallet?.balance || 0,
          isApproved: user.isApproved,
          isSuspended: user.isSuspended,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        },
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

async function handleLogout(event: any) {
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json',
      'Set-Cookie': 'token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
    },
    body: JSON.stringify({ message: 'Logged out successfully' }),
  };
}

// User handlers
async function handleUserWallet(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
    });

    if (!wallet) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Wallet not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        wallet: {
          balance: wallet.balance,
          pendingBalance: wallet.pendingBalance,
          totalEarned: wallet.totalEarned,
          totalWithdrawn: wallet.totalWithdrawn,
        }
      }),
    };
  } catch (error: any) {
    console.error('Wallet error:', error);
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

async function handleUserStats(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { 
        wallet: true,
        referrals: true,
        withdrawals: true,
      },
    });

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    // Get completed tasks count
    const completedTasks = await prisma.userTask.count({
      where: { 
        userId: payload.userId,
        status: 'APPROVED'
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        stats: {
          totalEarned: user.wallet?.totalEarned || 0,
          totalWithdrawn: user.wallet?.totalWithdrawn || 0,
          currentBalance: user.wallet?.balance || 0,
          completedTasks,
          totalReferrals: user.referrals.length,
          totalWithdrawals: user.withdrawals.length,
        }
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

// Tasks handlers
async function handleGetTasks(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const tasks = await prisma.task.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          type: task.type,
          reward: task.reward,
          instructions: task.instructions,
          url: task.url,
          proofRequired: task.proofRequired,
          maxParticipants: task.maxParticipants,
          currentParticipants: task.currentParticipants,
        }))
      }),
    };
  } catch (error: any) {
    console.error('Get tasks error:', error);
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

// Referrals handlers
async function handleGetReferralCode(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'User not found' }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        referralCode: user.username,
        referralUrl: `${process.env.FRONTEND_URL || 'https://yourdomain.com'}/register?ref=${user.username}`,
      }),
    };
  } catch (error: any) {
    console.error('Get referral code error:', error);
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

async function handleGetReferrals(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const referrals = await prisma.referral.findMany({
      where: { referrerId: payload.userId },
      include: {
        referred: {
          select: {
            id: true,
            username: true,
            email: true,
            fullName: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        referrals: referrals.map(ref => ({
          id: ref.id,
          level: ref.level,
          bonus: ref.bonus,
          isPaid: ref.isPaid,
          createdAt: ref.createdAt,
          referred: ref.referred,
        }))
      }),
    };
  } catch (error: any) {
    console.error('Get referrals error:', error);
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

// Withdrawals handlers
async function handleWithdrawalRequest(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const body = JSON.parse(event.body || '{}');
    const schema = z.object({
      amount: z.number().positive(),
      walletAddress: z.string().min(10),
      network: z.enum(['TRC20', 'ERC20', 'BEP20']),
    });

    const data = schema.parse(body);

    const wallet = await prisma.wallet.findUnique({
      where: { userId: payload.userId },
    });

    if (!wallet) {
      return {
        statusCode: 404,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Wallet not found' }),
      };
    }

    if (Number(wallet.balance) < data.amount) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Insufficient balance' }),
      };
    }

    // Calculate USDT amount (assuming 1:1 conversion for demo)
    const usdtAmount = data.amount;
    const conversionRate = 1.0;

    const withdrawal = await prisma.withdrawal.create({
      data: {
        userId: payload.userId,
        amount: data.amount,
        usdtAmount: usdtAmount,
        conversionRate: conversionRate,
        walletAddress: data.walletAddress,
        network: data.network,
        status: 'PENDING',
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'Withdrawal request submitted successfully',
        withdrawal: {
          id: withdrawal.id,
          amount: withdrawal.amount,
          usdtAmount: withdrawal.usdtAmount,
          network: withdrawal.network,
          status: withdrawal.status,
          createdAt: withdrawal.createdAt,
        }
      }),
    };
  } catch (error: any) {
    console.error('Withdrawal request error:', error);
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

async function handleWithdrawalsList(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid token' }),
      };
    }

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        withdrawals: withdrawals.map(withdrawal => ({
          id: withdrawal.id,
          amount: withdrawal.amount,
          usdtAmount: withdrawal.usdtAmount,
          network: withdrawal.network,
          status: withdrawal.status,
          txHash: withdrawal.txHash,
          createdAt: withdrawal.createdAt,
          processedAt: withdrawal.processedAt,
        }))
      }),
    };
  } catch (error: any) {
    console.error('Withdrawals list error:', error);
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

// Admin handlers
async function handleAdminUsers(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Admin access required' }),
      };
    }

    const users = await prisma.user.findMany({
      include: { wallet: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        users: users.map(user => ({
          id: user.id,
          username: user.username,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          level: user.level,
          isApproved: user.isApproved,
          isSuspended: user.isSuspended,
          balance: user.wallet?.balance || 0,
          createdAt: user.createdAt,
          lastLoginAt: user.lastLoginAt,
        }))
      }),
    };
  } catch (error: any) {
    console.error('Admin users error:', error);
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

async function handleApproveUser(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Admin access required' }),
      };
    }

    const userId = event.path.split('/')[3];
    
    const user = await prisma.user.update({
      where: { id: userId },
      data: { 
        isApproved: true,
        updatedAt: new Date(),
      },
    });

    // Add welcome bonus
    await prisma.wallet.update({
      where: { userId: userId },
      data: {
        balance: { increment: 5.00 },
        totalEarned: { increment: 5.00 },
      },
    });

    await prisma.transaction.create({
      data: {
        userId: userId,
        type: 'SIGNUP_BONUS',
        amount: 5.00,
        description: 'Welcome bonus for account approval',
      },
    });

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message: 'User approved successfully',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          isApproved: user.isApproved,
        }
      }),
    };
  } catch (error: any) {
    console.error('Approve user error:', error);
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

async function handleAdminStats(event: any) {
  try {
    const token = extractTokenFromHeader(event.headers.authorization || event.headers.Authorization);
    if (!token) {
      return {
        statusCode: 401,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Authentication required' }),
      };
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return {
        statusCode: 403,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Admin access required' }),
      };
    }

    const [
      totalUsers,
      pendingApprovals,
      activeUsers,
      totalTasks,
      totalWithdrawals,
      totalRevenue,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isApproved: false } }),
      prisma.user.count({ where: { isApproved: true, isSuspended: false } }),
      prisma.task.count(),
      prisma.withdrawal.count(),
      prisma.transaction.aggregate({
        _sum: { amount: true },
        where: { type: 'TASK_REWARD' },
      }),
    ]);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        stats: {
          totalUsers,
          pendingApprovals,
          activeUsers,
          totalTasks,
          totalWithdrawals,
          totalRevenue: totalRevenue._sum.amount || 0,
        }
      }),
    };
  } catch (error: any) {
    console.error('Admin stats error:', error);
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