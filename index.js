const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// تهيئة عميل واتساب مع حفظ الجلسة محلياً
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

// متغير لتخزين حالة الاتصال
let isClientReady = false;

// معالجة حدث QR code
client.on('qr', (qr) => {
    console.log('QR Code received:');
    qrcode.generate(qr, { small: true });
});

// معالجة حدث الجاهزية
client.on('ready', () => {
    console.log('Client is ready!');
    isClientReady = true;
});

// بدء تشغيل العميل
client.initialize();

// التحقق من صحة رقم الهاتف
function isValidPhoneNumber(number) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
}

// نقطة نهاية لإرسال الرسائل
app.post('/send', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!isClientReady) {
            return res.status(503).json({ error: 'WhatsApp client not ready. Please scan QR code first.' });
        }

        if (!number || !message) {
            return res.status(400).json({ error: 'Number and message are required.' });
        }

        if (!isValidPhoneNumber(number)) {
            return res.status(400).json({ error: 'Invalid phone number format. Use international format (e.g., +46701234567).' });
        }

        // تنسيق رقم الهاتف لواتساب
        const chatId = number.substring(1) + '@c.us';

        // التحقق من وجود الرقم على واتساب
        const isRegistered = await client.isRegisteredUser(chatId);
        if (!isRegistered) {
            return res.status(404).json({ error: 'رقم الهاتف غير مسجل في واتساب' });
        }

        // إرسال الرسالة
        await client.sendMessage(chatId, message);
        res.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
    }
});

// نقطة نهاية للتحقق من رقم الهاتف
app.post('/check-number', async (req, res) => {
    try {
        const { number } = req.body;

        if (!isClientReady) {
            return res.status(503).json({ error: 'عميل واتساب غير جاهز. يرجى مسح رمز QR أولاً' });
        }

        if (!number) {
            return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
        }

        if (!isValidPhoneNumber(number)) {
            return res.status(400).json({ error: 'تنسيق رقم الهاتف غير صالح. استخدم التنسيق الدولي (مثال: +46701234567)' });
        }

        // تنسيق رقم الهاتف لواتساب
        const chatId = number.substring(1) + '@c.us';

        // التحقق من وجود الرقم على واتساب
        const isRegistered = await client.isRegisteredUser(chatId);

        res.json({
            chatId: chatId,
            isRegistered: isRegistered
        });

    } catch (error) {
        console.error('خطأ في التحقق من الرقم:', error);
        res.status(500).json({ error: 'فشل في التحقق من الرقم' });
    }
});

// تشغيل الخادم
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});