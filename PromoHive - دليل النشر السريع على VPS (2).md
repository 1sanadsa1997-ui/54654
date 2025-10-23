# PromoHive - دليل النشر السريع على VPS

## 📦 ما تحتاجه

1. **VPS Server** (Hostinger أو أي مزود آخر)
   - Ubuntu 20.04 أو أحدث
   - 2GB RAM على الأقل
   - 20GB مساحة تخزين

2. **قاعدة بيانات PostgreSQL**
   - احصل على حساب مجاني من [NeonDB](https://neon.tech)
   - انسخ connection string

3. **Domain Name**
   - أضف A Record يشير إلى IP السيرفر
   - مثال: globalpromonetwork.store → 72.60.215.2

4. **SMTP Email**
   - استخدم Hostinger Email أو Gmail SMTP

## 🚀 خطوات النشر (5 دقائق)

### 1. رفع الملف
```bash
# من جهازك المحلي
scp promohive-deployment.zip root@72.60.215.2:/root/
```

### 2. فك الضغط والإعداد
```bash
# اتصل بالسيرفر
ssh root@72.60.215.2

# فك الضغط
cd /root
unzip promohive-deployment.zip
cd promohive-final
```

### 3. إنشاء ملف .env
```bash
nano .env
```

**الصق هذا المحتوى (عدّل القيم):**
```env
# DATABASE (من NeonDB)
DATABASE_URL="postgresql://neondb_owner:npg_RjPm5AzCSe3X@ep-blue-bread-af97x8n0-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require"

# SECURITY (أنشئ مفاتيح عشوائية)
JWT_ACCESS_SECRET="xoOJpqGoJwriVTQtNE0hyR79OGncbx4gmbxrr1Iu9ztMdvzH4Am8qe032NlLUSgf"
JWT_REFRESH_SECRET="BeESfcZmlN9rwkT2Ill5QPBHKyp8hRYp09kl2Ag8yaiE8Pr4zuqZhuoHrXZXJKCc"

# ADMIN
ADMIN_EMAIL="1sanadsa1997@gmil.com"
ADMIN_PASSWORD="PromoHive@Admin2025!"
ADMIN_NAME="Super Admin"

# SMTP (من Hostinger)
SMTP_HOST="smtp.hostinger.com"
SMTP_PORT="465"
SMTP_USER="promohive@globalpromonetwork.store"
SMTP_PASS="PromoHive@2025!"
SMTP_SECURE="true"
SMTP_FROM_EMAIL="promohive@globalpromonetwork.store"

# ENVIRONMENT
NODE_ENV="production"
PORT="3002"
FRONTEND_URL="https://globalpromonetwork.store"
CORS_ORIGIN="https://globalpromonetwork.store"

# API KEYS (سيتم إضافتها لاحقاً)
ADGEM_APP_ID="31283"
ADGEM_JWT="your-adgem-jwt-token"
ADSTERRA_API_KEY="your-adsterra-api-key"
CPALEAD_API_KEY="your-cpalead-api-key"

# SETTINGS
WELCOME_BONUS_AMOUNT="5.00"
MIN_WITHDRAWAL_AMOUNT="10.00"
USDT_CONVERSION_RATE="1.0"
ENABLE_CRON_JOBS="true"
LOG_LEVEL="info"
```

احفظ بـ `Ctrl+X` ثم `Y` ثم `Enter`

### 4. تشغيل النشر التلقائي
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh
```

**سيقوم السكريبت بـ:**
- ✅ تثبيت Node.js, PM2, Nginx
- ✅ تثبيت المكتبات
- ✅ بناء Frontend & Backend
- ✅ إعداد قاعدة البيانات
- ✅ تكوين SSL (Let's Encrypt)
- ✅ تشغيل التطبيق

### 5. التحقق من التشغيل
```bash
# تحقق من PM2
pm2 status

# تحقق من Nginx
systemctl status nginx

# شاهد اللوجات
pm2 logs promohive-server
```

## 🌐 الوصول للتطبيق

- **الموقع**: https://globalpromonetwork.store
- **API**: https://globalpromonetwork.store/api
- **تسجيل دخول الإدارة**: 
  - Email: 1sanadsa1997@gmil.com
  - Password: PromoHive@Admin2025!

## 🔧 الأوامر المفيدة

```bash
# إعادة تشغيل التطبيق
pm2 restart promohive-server

# مشاهدة اللوجات
pm2 logs

# إيقاف التطبيق
pm2 stop promohive-server

# إعادة تشغيل Nginx
systemctl restart nginx

# تجديد SSL
certbot renew
```

## 📊 ما بعد النشر

1. **اختبر التسجيل**: سجل حساب جديد
2. **وافق على المستخدم**: من لوحة الإدارة
3. **أضف مهام**: من قسم Tasks
4. **اختبر السحب**: اطلب سحب USDT

## 🆘 حل المشاكل

### خطأ في قاعدة البيانات
```bash
cd /root/promohive-final/server
npx prisma migrate deploy
npx prisma db seed
```

### SSL لا يعمل
```bash
certbot --nginx -d globalpromonetwork.store --force-renew
systemctl restart nginx
```

### التطبيق لا يعمل
```bash
pm2 delete all
cd /root/promohive-final
pm2 start ecosystem.config.js
pm2 save
```

## 📧 الدعم

للمساعدة: promohive@globalpromonetwork.store

---

**ملاحظة**: هذا دليل مختصر. للتفاصيل الكاملة، راجع `README.md` في المشروع.

