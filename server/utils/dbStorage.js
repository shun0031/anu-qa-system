/**
 * ==============================================================================
 * ไฟล์: server/utils/dbStorage.js
 * หน้าที่: ระบบบันทึกและกู้คืนฐานข้อมูลลงไฟล์ฮาร์ดดิสก์อัตโนมัติ (Local Disk Auto-Persistence)
 * ประโยชน์:
 *  - ป้องกันข้อมูลสูญหายเมื่อรันด้วย In-Memory Database (RAM)
 *  - เมื่อปิด Command Prompt หรือรีสตาร์ทเครื่อง ข้อมูลผู้ใช้, บันทึก SAR, เกณฑ์ และหลักสูตร
 *    จะถูกโหลดกลับมาจาก server/data/db_store.json อัตโนมัติ 100%
 * ==============================================================================
 */

const fs = require('fs');
const path = require('path');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const Criteria = require('../models/Criteria');
const AunqaRecord = require('../models/AunqaRecord');
const SystemLog = require('../models/SystemLog');

const DATA_DIR = path.join(__dirname, '../data');
const BACKUP_FILE = path.join(DATA_DIR, 'db_store.json');

// ตรวจสอบและสร้างโฟลเดอร์ data หากยังไม่มี
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

let saveTimeout = null;

// ฟังก์ชันบันทึกข้อมูลทุก Collection ลงไฟล์ JSON บนฮาร์ดดิสก์
const saveDbToFile = async () => {
  try {
    ensureDataDir();

    const [
      departments,
      courses,
      permissions,
      roles,
      users,
      criteria,
      records,
      logs
    ] = await Promise.all([
      Department.find().lean(),
      Course.find().lean(),
      Permission.find().lean(),
      Role.find().lean(),
      User.find().lean(),
      Criteria.find().lean(),
      AunqaRecord.find().lean(),
      SystemLog.find().limit(500).sort({ timestamp: -1 }).lean()
    ]);

    // ป้องกันการเซฟทับด้วยข้อมูลว่าง
    if (!users || users.length === 0) {
      return;
    }

    const payload = {
      savedAt: new Date().toISOString(),
      departments,
      courses,
      permissions,
      roles,
      users,
      criteria,
      records,
      logs
    };

    fs.writeFileSync(BACKUP_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    // console.log(`[DB Auto-Persistence] Saved ${users.length} users, ${records.length} records to disk.`);
  } catch (err) {
    console.warn('[DB Auto-Persistence] Failed to save DB to file:', err.message);
  }
};

// ฟังก์ชันเซฟแบบ Debounce (เรียกซ้ำหลายครั้งจะรอ 1 วินาทีแล้วเซฟครั้งเดียว)
const triggerDbSave = () => {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    saveDbToFile().catch(() => {});
  }, 1000);
};

// ฟังก์ชันกู้คืนข้อมูลจากไฟล์ JSON กลับเข้าสู่ MongoDB เมื่อเปิดเครื่องใหม่
const restoreDbFromFile = async () => {
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      return false;
    }

    const raw = fs.readFileSync(BACKUP_FILE, 'utf-8');
    if (!raw || raw.trim().length === 0) return false;

    const data = JSON.parse(raw);
    if (!data.users || data.users.length === 0) return false;

    console.log(`[DB Auto-Persistence] Restoring database from disk backup (${data.savedAt})...`);

    // ล้างและนำเข้าข้อมูลตามลำดับเพื่อความสอดคล้องของ ID
    if (data.departments && data.departments.length > 0) {
      await Department.deleteMany({});
      await Department.insertMany(data.departments);
    }

    if (data.courses && data.courses.length > 0) {
      await Course.deleteMany({});
      await Course.insertMany(data.courses);
    }

    if (data.permissions && data.permissions.length > 0) {
      await Permission.deleteMany({});
      await Permission.insertMany(data.permissions);
    }

    if (data.roles && data.roles.length > 0) {
      await Role.deleteMany({});
      await Role.insertMany(data.roles);
    }

    if (data.users && data.users.length > 0) {
      await User.deleteMany({});
      await User.insertMany(data.users);
    }

    if (data.criteria && data.criteria.length > 0) {
      await Criteria.deleteMany({});
      await Criteria.insertMany(data.criteria);
    }

    if (data.records && data.records.length > 0) {
      await AunqaRecord.deleteMany({});
      await AunqaRecord.insertMany(data.records);
    }

    if (data.logs && data.logs.length > 0) {
      await SystemLog.deleteMany({});
      await SystemLog.insertMany(data.logs);
    }

    console.log(`[DB Auto-Persistence] Successfully restored ${data.users.length} users and ${data.records?.length || 0} records!`);
    return true;
  } catch (err) {
    console.error('[DB Auto-Persistence] Failed to restore from file:', err.message);
    return false;
  }
};

module.exports = {
  saveDbToFile,
  triggerDbSave,
  restoreDbFromFile
};
