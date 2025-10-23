# PromoHive - دليل النشر على Netlify

## 🌐 معلومات الموقع
- **الموقع**: https://globalpromonetwork.netlify.app
- **المستودع**: https://github.com/1sanadsa1997-ui/54654.git
- **قاعدة البيانات**: Neon PostgreSQL
- **التخزين السحابي**: Cloudinary

## 🚀 خطوات النشر المحدثة

### 1. إعداد متغيرات البيئة في Netlify

انتقل إلى **Site settings > Environment variables** وأضف:

#### متغيرات الـ Frontend (VITE_*):
```
VITE_APP_TITLE=PromoHive
VITE_APP_LOGO=https://globalpromonetwork.netlify.app/logo.png
VITE_ANALYTICS_ENDPOINT=https://analytics.globalpromonetwork.store
VITE_ANALYTICS_WEBSITE_ID=promohive
VITE_API_URL=https://your-api-domain.com/api
VITE_CLOUDINARY_CLOUD_NAME=djplzmgtn
VITE_CLOUDINARY_API_KEY=597557396493121
VITE_CLOUDINARY_UPLOAD_PRESET=promohive_secure
VITE_ENVIRONMENT=production
VITE_VERSION=1.0.0
VITE_PLATFORM_URL=https://globalpromonetwork.netlify.app
```

#### متغيرات الـ Backend (إذا كنت تستخدم Netlify Functions):
```
DATABASE_URL=postgresql://neondb_owner:npg_RjPm5AzCSe3X@ep-blue-bread-af97x8n0-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require
CLOUDINARY_CLOUD_NAME=djplzmgtn
CLOUDINARY_API_KEY=597557396493121
CLOUDINARY_API_SECRET=8uzNmDudbHaD7yDb8RG0neeEQXg
CLOUDINARY_UPLOAD_PRESET=promohive_secure
SMTP_HOST=smtp.hostinger.com
SMTP_PORT=465
SMTP_USER=promohive@globalpromonetwork.store
SMTP_PASS=PromoHive@2025!
JWT_SECRET=lOpfvjraNjKdEM4zcvaUGAnGc1MBO84Usa1DXqzFJLLY1oEc12V8yTV5prQytyVD
JWT_ACCESS_SECRET=xoOJpqGoJwriVTQtNE0hyR79OGncbx4gmbxrr1Iu9ztMdvzH4Am8qe032NlLUSgf
JWT_REFRESH_SECRET=BeESfcZmlN9rwkT2Ill5QPBHKyp8hRYp09kl2Ag8yaiE8Pr4zuqZhuoHrXZXJKCc
```

### 2. إعدادات البناء في Netlify

- **Build command**: `npm run build:netlify`
- **Publish directory**: `dist/public`
- **Node version**: `18`

### 3. إعدادات إضافية

#### Custom Domain (اختياري):
- يمكنك ربط دومين مخصص مثل `globalpromonetwork.store`
- Netlify يوفر شهادة SSL مجانية تلقائياً

#### Form Handling:
- استخدم Netlify Forms لمعالجة النماذج
- أضف `netlify` attribute للنماذج

#### Analytics:
- يمكنك إضافة Google Analytics أو Netlify Analytics

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:
1. **404 Error**: تأكد من وجود ملف `_redirects`
2. **API Errors**: تحقق من متغيرات البيئة
3. **Build Failures**: تحقق من console في Netlify
4. **CORS Issues**: تأكد من إعدادات CORS في `netlify.toml`

### روابط مفيدة:
- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
- [Neon Database](https://neon.tech/)

## 📊 مراقبة الأداء

### Netlify Analytics:
- انتقل إلى **Analytics** في لوحة التحكم
- راقب الزيارات والأداء

### Database Monitoring:
- استخدم Neon Console لمراقبة قاعدة البيانات
- راقب الاستعلامات والأداء

## 🔄 التحديثات المستقبلية

عند إجراء تغييرات:
1. ارفع التغييرات إلى GitHub
2. Netlify سيبني الموقع تلقائياً
3. راقب عملية البناء في لوحة التحكم
