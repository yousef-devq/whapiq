require('dotenv').config();

const express = require('express');
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
app.use(bodyParser.json());

// تكوين المنفذ
const PORT = process.env.PORT || 3000;

// تهيئة عميل واتساب
let client = null;
let isClientReady = false;

async function connectToWhatsApp() {
    const sessionsPath = path.resolve(process.env.SESSIONS_PATH || './sessions');
    const { state, saveCreds } = await useMultiFileAuthState(sessionsPath);

    client = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        defaultQueryTimeoutMs: 60000
    });

    client.ev.on('creds.update', saveCreds);


    client.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('اتصال مغلق بسبب:', lastDisconnect.error, '\nجاري إعادة الاتصال:', shouldReconnect);
            
            if (shouldReconnect) {
                await connectToWhatsApp();
            }
        } else if (connection === 'open') {
            console.log('تم الاتصال بنجاح!');
            isClientReady = true;
        }
    });

    return client;
}

// بدء الاتصال
connectToWhatsApp().catch(err => {
    console.error('فشل في الاتصال:', err);
    process.exit(1);
});

// معالجة الأخطاء غير المتوقعة
process.on('uncaughtException', (err) => {
    console.error('خطأ غير متوقع:', err);
});

process.on('unhandledRejection', (err) => {
    console.error('وعد مرفوض غير معالج:', err);
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`الخادم يعمل على المنفذ ${PORT}`);
});

// التحقق من صحة رقم الهاتف
function isValidPhoneNumber(number) {
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(number);
}

// نقطة نهاية لإرسال الرسائل
app.post('/send', async (req, res) => {
    try {
        const { number, message } = req.body;

        if (!isClientReady || !client) {
            return res.status(503).json({ error: 'عميل واتساب غير جاهز. يرجى مسح رمز QR أولاً' });
        }

        if (!number || !message) {
            return res.status(400).json({ error: 'الرقم والرسالة مطلوبان' });
        }

        if (!isValidPhoneNumber(number)) {
            return res.status(400).json({ error: 'تنسيق رقم الهاتف غير صالح. استخدم التنسيق الدولي (مثال: +46701234567)' });
        }

        // تنسيق رقم الهاتف لواتساب
        const chatId = number.substring(1) + '@s.whatsapp.net';

        // التحقق من وجود الرقم على واتساب
        const [result] = await client.onWhatsApp(chatId);
        if (!result?.exists) {
            return res.status(404).json({ error: 'رقم الهاتف غير مسجل في واتساب' });
        }

        // إرسال الرسالة مع إعادة المحاولة
        let retries = 3;
        let success = false;
        let lastError;

        while (retries > 0 && !success) {
            try {
                await client.sendMessage(chatId, { text: message });
                success = true;
                res.json({ success: true, message: 'تم إرسال الرسالة بنجاح' });
            } catch (err) {
                lastError = err;
                retries--;
                if (retries > 0) {
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

        if (!isClientReady || !client) {
            return res.status(503).json({ error: 'عميل واتساب غير جاهز. يرجى مسح رمز QR أولاً' });
        }

        if (!number) {
            return res.status(400).json({ error: 'رقم الهاتف مطلوب' });
        }

        if (!isValidPhoneNumber(number)) {
            return res.status(400).json({ error: 'تنسيق رقم الهاتف غير صالح. استخدم التنسيق الدولي (مثال: +46701234567)' });
        }

        // تنسيق رقم الهاتف لواتساب
        const chatId = number.substring(1) + '@s.whatsapp.net';

        // التحقق من وجود الرقم على واتساب
        const [result] = await client.onWhatsApp(chatId);

        res.json({
            chatId: chatId,
            isRegistered: result?.exists || false
        });

    } catch (error) {
        console.error('خطأ في التحقق من الرقم:', error);
        res.status(500).json({ error: 'فشل في التحقق من الرقم' });
    }
});

// تشغيل الخادم
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});