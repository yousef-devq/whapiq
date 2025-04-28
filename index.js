const express = require('express');
const { Client } = require('whatsapp-web.js');
const StorageManager = require('./storage');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// تهيئة عميل واتساب مع حفظ الجلسة في قاعدة البيانات
const { LocalAuth } = require('whatsapp-web.js');

const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'whatsapp-bot',
        dataPath: process.env.SESSIONS_PATH || './sessions'
    }),
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        headless: true,
        timeout: 60000,
        browserArgs: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    }
});

// تنظيف البيانات القديمة كل 24 ساعة
setInterval(() => {
    StorageManager.cleanOldData()
        .catch(err => console.error('خطأ في تنظيف البيانات القديمة:', err));
}, 24 * 60 * 60 * 1000);

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

// معالجة حدث انقطاع الاتصال
client.on('disconnected', async (reason) => {
    console.log('تم قطع الاتصال:', reason);
    isClientReady = false;
    
    // محاولة إعادة الاتصال
    try {
        console.log('جاري محاولة إعادة الاتصال...');
        await client.initialize();
    } catch (error) {
        console.error('فشل في إعادة الاتصال:', error);
    }
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

        // إرسال الرسالة مع إعادة المحاولة
        let retries = 3;
        let success = false;
        let lastError;

        while (retries > 0 && !success) {
            try {
                await client.sendMessage(chatId, message);
                success = true;
                res.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
            } catch (err) {
                lastError = err;
                retries--;
                if (retries > 0) {
                    // انتظر قبل إعادة المحاولة
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }

        if (!success) {
            console.error('فشل في إرسال الرسالة بعد عدة محاولات:', lastError);
            res.status(500).json({ error: 'فشل في إرسال الرسالة بعد عدة محاولات' });
        }

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