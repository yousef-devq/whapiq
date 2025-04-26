const fs = require('fs').promises;
const path = require('path');

// إنشاء مسار مجلد التخزين
const STORAGE_DIR = path.join(__dirname, 'storage');

// التأكد من وجود مجلد التخزين
async function ensureStorageDir() {
    try {
        await fs.access(STORAGE_DIR);
    } catch {
        await fs.mkdir(STORAGE_DIR, { recursive: true });
    }
}

// مدير التخزين
const StorageManager = {
    // حفظ أو تحديث البيانات
    async saveData(id, data) {
        await ensureStorageDir();
        const filePath = path.join(STORAGE_DIR, `${id}.json`);
        const fileData = {
            data,
            updated_at: new Date().toISOString()
        };
        await fs.writeFile(filePath, JSON.stringify(fileData, null, 2));
    },

    // استرجاع البيانات
    async getData(id) {
        try {
            await ensureStorageDir();
            const filePath = path.join(STORAGE_DIR, `${id}.json`);
            const content = await fs.readFile(filePath, 'utf8');
            const fileData = JSON.parse(content);
            return fileData.data;
        } catch (error) {
            if (error.code === 'ENOENT') return null;
            throw error;
        }
    },

    // حذف البيانات
    async deleteData(id) {
        try {
            const filePath = path.join(STORAGE_DIR, `${id}.json`);
            await fs.unlink(filePath);
        } catch (error) {
            if (error.code !== 'ENOENT') throw error;
        }
    },

    // تنظيف البيانات القديمة
    async cleanOldData() {
        try {
            await ensureStorageDir();
            const files = await fs.readdir(STORAGE_DIR);
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                
                const filePath = path.join(STORAGE_DIR, file);
                const content = await fs.readFile(filePath, 'utf8');
                const fileData = JSON.parse(content);

                if (new Date(fileData.updated_at) < thirtyDaysAgo) {
                    await fs.unlink(filePath);
                }
            }
        } catch (error) {
            console.error('خطأ في تنظيف البيانات القديمة:', error);
        }
    }
};

module.exports = StorageManager;