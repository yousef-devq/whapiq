# WhatsApp API Bot

واجهة برمجة تطبيقات (API) لإرسال رسائل WhatsApp باستخدام Node.js وWhatsApp Web API.

## المميزات

- إرسال رسائل WhatsApp عبر طلبات HTTP
- التحقق من تسجيل أرقام الهواتف على WhatsApp
- واجهة REST API سهلة الاستخدام
- دعم التوثيق عبر رمز QR
- حفظ الجلسة محلياً

## المتطلبات

- Node.js >= 14.0.0
- متصفح ويب حديث
- حساب WhatsApp نشط

## التثبيت

```bash
# تثبيت التبعيات
npm install

# تشغيل الخادم
npm start
```

## الاستخدام

### إرسال رسالة

```http
POST /send
Content-Type: application/json

{
  "number": "+1234567890",
  "message": "مرحباً!"
}
```

### التحقق من رقم الهاتف

```http
POST /check-number
Content-Type: application/json

{
  "number": "+1234567890"
}
```


## النشر على Railway


1. قم بإنشاء حساب على [Railway](https://railway.app/)
2. قم بتثبيت CLI الخاص بـ Railway:
```bash
npm install -g @railway/cli
```
3. قم بتسجيل الدخول:
```bash
railway login
```
4. قم بربط المشروع:
```bash
railway link
```
5. قم بالنشر:
```bash
railway up
```

ملاحظات مهمة للنشر:
- تأكد من وجود ملف `railway.toml` في مجلد المشروع
- تأكد من تعيين المتغيرات البيئية في لوحة تحكم Railway
- سيتم حفظ جلسات WhatsApp في المسار `/data/sessions`

## الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).#   w h a t s a p i  
 #   w h a t s a p i  
 