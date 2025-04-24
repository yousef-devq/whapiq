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

## الترخيص

هذا المشروع مرخص تحت [MIT License](LICENSE).