# PromoHive Global Promo Network

Complete production-ready web application for task-based earning platform.

## 🚀 Quick Start

### Prerequisites
- Ubuntu 20.04+ VPS (Hostinger or similar)
- Node.js 18.x
- PostgreSQL database (NeonDB recommended)
- Domain name with DNS configured

### 1. Upload Project
```bash
# Upload the promohive.zip to your VPS
scp promohive.zip root@your-vps-ip:/root/
```

### 2. Extract and Setup
```bash
ssh root@your-vps-ip
cd /root
unzip promohive.zip
cd promohive
```

### 3. Configure Environment
```bash
# Copy and edit environment file
cp .env.example .env
nano .env
```

**Required Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string from NeonDB
- `JWT_ACCESS_SECRET` - Random secure string
- `JWT_REFRESH_SECRET` - Random secure string
- `ADMIN_EMAIL` - Super admin email
- `ADMIN_PASSWORD` - Super admin password
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` - Email configuration
- `FRONTEND_URL` - Your domain (e.g., https://globalpromonetwork.store)
- `CORS_ORIGIN` - Same as FRONTEND_URL
- `ADGEM_JWT`, `ADSTERRA_API_KEY`, `CPALEAD_API_KEY` - API keys

### 4. Deploy
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

The script will:
- Install Node.js, PM2, Nginx
- Install dependencies
- Build client and server
- Setup database (migrations + seed)
- Configure Nginx with SSL
- Start application with PM2

### 5. Access Application
- Frontend: https://yourdomain.com
- API: https://yourdomain.com/api
- Admin login: Use ADMIN_EMAIL and ADMIN_PASSWORD from .env

## 📁 Project Structure

```
promohive/
├── client/          # React frontend
│   ├── src/
│   │   ├── pages/   # Page components
│   │   └── components/
│   └── package.json
├── server/          # Express backend
│   ├── src/
│   │   ├── routes/  # API routes
│   │   ├── middleware/
│   │   ├── utils/
│   │   └── cron/    # Scheduled jobs
│   └── package.json
├── prisma/          # Database
│   ├── schema.prisma
│   └── seed.ts
├── scripts/         # Deployment scripts
│   ├── deploy.sh
│   ├── verify_release.sh
│   └── test.sh
├── nginx.conf       # Nginx configuration
├── ecosystem.config.js  # PM2 configuration
└── README.md
```

## 🔐 Authentication Flow

1. **Signup**: User registers with email, password, full name
2. **Approval**: Admin must approve account before user can login
3. **Welcome Bonus**: $5 credited automatically upon approval
4. **Login**: JWT-based authentication with access + refresh tokens
5. **Magic Link**: Alternative login via email link

## 💰 Features

### User Features
- Task completion (Manual, AdGem, Adsterra, CPAlead)
- Multi-level referral system (3 levels)
- Wallet management
- USDT withdrawals (TRC20/ERC20/BEP20)
- Level upgrades (0-3)

### Admin Features
- User management (approve, suspend, edit)
- Task management (create, edit, approve proofs)
- Withdrawal processing
- Analytics dashboard
- System settings

### External Integrations
- **AdGem**: App ID 31283, JWT authentication
- **Adsterra**: Daily revenue sync via cron
- **CPAlead**: Offer management

## 🗄️ Database

### Setup NeonDB
1. Create account at https://neon.tech
2. Create new project
3. Copy connection string
4. Add to .env as DATABASE_URL

### Migrations
```bash
cd server
npx prisma migrate deploy
npx prisma db seed
```

### Models
- User, Wallet, Transaction
- Task, UserTask, Proof
- Referral, Withdrawal
- Offer, AdRevenue, Setting
- MagicLinkToken, LevelRequest, AdminAction

## 🛠️ Development

### Local Development
```bash
# Install dependencies
npm install

# Start development servers
npm run dev
```

### Build
```bash
npm run build
```

### Tests
```bash
npm run test
```

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout

### User
- `GET /api/user/wallet` - Get wallet
- `GET /api/user/stats` - Get statistics

### Tasks
- `GET /api/tasks` - List available tasks
- `POST /api/tasks/:id/start` - Start task
- `POST /api/tasks/:id/submit` - Submit proof

### Referrals
- `GET /api/referrals/code` - Get referral code
- `GET /api/referrals/list` - List referrals

### Withdrawals
- `POST /api/withdrawals/request` - Request withdrawal
- `GET /api/withdrawals/list` - List withdrawals

### Admin
- `GET /api/admin/users` - List users
- `POST /api/admin/users/:id/approve` - Approve user
- `GET /api/admin/stats` - System statistics

## 🔧 Maintenance

### View Logs
```bash
pm2 logs promohive-server
```

### Restart Application
```bash
pm2 restart promohive-server
```

### Update Application
```bash
cd /var/www/promohive
git pull  # or upload new files
npm run build
pm2 restart promohive-server
```

### Backup Database
```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

## 🔐 Security

- bcrypt password hashing
- JWT with httpOnly cookies
- Helmet security headers
- CORS protection
- Rate limiting
- Input validation with Zod
- SQL injection prevention (Prisma)

## 📧 Email Templates

Emails are sent for:
- Registration (under review)
- Account approval
- Magic link login
- Withdrawal confirmation

Configure SMTP in .env to enable emails.

## 🌐 Webhooks

### AdGem Postback
URL: `https://yourdomain.com/api/webhooks/adgem`

### Adsterra Callback
URL: `https://yourdomain.com/api/webhooks/adsterra`

### CPAlead Postback
URL: `https://yourdomain.com/api/webhooks/cpalead`

## 📈 Monitoring

- PM2 process monitoring
- Winston logging (logs/ directory)
- Health check endpoint: `/health`

## 🆘 Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Database Connection Issues
- Check DATABASE_URL format
- Verify NeonDB is accessible
- Check firewall rules

### SSL Certificate Issues
```bash
certbot renew
systemctl restart nginx
```

### PM2 Not Starting
```bash
pm2 delete all
pm2 start ecosystem.config.js
pm2 save
```

## 📝 License

Proprietary - All rights reserved

## 🤝 Support

For issues or questions, contact: promohive@globalpromonetwork.store

---

**If anything is unclear → No clarifications required — implement exactly as specified above. All UI text in English.**

