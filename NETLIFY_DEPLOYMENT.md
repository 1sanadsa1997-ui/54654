# PromoHive - دليل النشر على Netlify

## 🚀 خطوات النشر

### 1. إعداد المشروع محلياً
```bash
# تثبيت التبعيات
npm install

# بناء المشروع
npm run build:netlify
```

### 2. النشر على Netlify

#### الطريقة الأولى: عبر Git
1. ارفع المشروع إلى GitHub/GitLab
2. اربط المستودع مع Netlify
3. استخدم الإعدادات التالية:
   - **Build command**: `npm run build:netlify`
   - **Publish directory**: `dist/public`
   - **Node version**: `18`

#### الطريقة الثانية: عبر Drag & Drop
1. شغل الأمر: `npm run build:netlify`
2. اسحب مجلد `dist/public` إلى Netlify

### 3. إعداد متغيرات البيئة في Netlify

انتقل إلى **Site settings > Environment variables** وأضف:

```
VITE_APP_TITLE=PromoHive
VITE_APP_LOGO=https://your-domain.netlify.app/logo.png
VITE_API_URL=https://your-api-domain.com/api
VITE_CLOUDINARY_CLOUD_NAME=your-cloud-name
VITE_CLOUDINARY_API_KEY=your-api-key
VITE_CLOUDINARY_UPLOAD_PRESET=your-preset
```

### 4. إعدادات إضافية

#### Custom Domain
- اربط دومينك المخصص في **Domain settings**

#### SSL Certificate
- Netlify يوفر شهادة SSL مجانية تلقائياً

#### Form Handling
- استخدم Netlify Forms لمعالجة النماذج

## 📁 هيكل المشروع بعد البناء

```
dist/
└── public/
    ├── index.html
    ├── assets/
    │   ├── index-[hash].js
    │   └── index-[hash].css
    └── _redirects
```

## 🔧 استكشاف الأخطاء

### مشاكل شائعة:
1. **404 Error**: تأكد من وجود ملف `_redirects`
2. **API Errors**: تحقق من متغيرات البيئة
3. **Build Failures**: تحقق من console في Netlify

### روابط مفيدة:
- [Netlify Documentation](https://docs.netlify.com/)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html)
