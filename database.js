const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// إنشاء اتصال بقاعدة البيانات
const dbPath = path.join(__dirname, 'sessions.db');
const db = new sqlite3.Database(dbPath);

// إنشاء جدول الجلسات
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// وظائف إدارة الجلسات
const SessionManager = {
    // حفظ أو تحديث جلسة
    async saveSession(id, data) {
        return new Promise((resolve, reject) => {
            const query = `INSERT OR REPLACE INTO sessions (id, data, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)`;
            db.run(query, [id, JSON.stringify(data)], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // استرجاع جلسة
    async getSession(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT data FROM sessions WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row ? JSON.parse(row.data) : null);
            });
        });
    },

    // حذف جلسة
    async deleteSession(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM sessions WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },

    // تنظيف الجلسات القديمة (أقدم من 30 يوماً)
    async cleanOldSessions() {
        return new Promise((resolve, reject) => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            db.run('DELETE FROM sessions WHERE updated_at < ?', [thirtyDaysAgo.toISOString()], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
};

module.exports = SessionManager;