/**
 * ==============================================================================
 * ไฟล์: server/middleware/logger.js
 * หน้าที่: ฟังก์ชันตัวช่วยสำหรับบันทึกประวัติการกระทำของผู้ใช้งาน (Audit Logging)
 * อ้างอิงตาม Schema Diagram ภาพที่ 2 (collection: system_logs):
 *  - บันทึก: user_id, action, target_collection, target_id, detail, ip_address, timestamp
 * ==============================================================================
 */

const SystemLog = require('../models/SystemLog');

/**
 * ฟังก์ชันบันทึกกิจกรรมลงใน collection system_logs
 * @param {ObjectId} userId - รหัสผู้ใช้งานที่กระทำการ
 * @param {string} action - ชื่อกิจกรรม เช่น 'LOGIN', 'SUBMIT_RECORD', 'CONFIRM_RECORD'
 * @param {string} targetCollection - คอลเลกชันที่ได้รับผลกระทบ เช่น 'aunqa_records', 'users'
 * @param {string|ObjectId} targetId - รหัสข้อมูลที่ได้รับผลกระทบ
 * @param {string} detail - รายละเอียดเพิ่มเติม
 * @param {object} req - Express Request object สำหรับดึง IP Address
 */
const logAction = async (userId, action, targetCollection, targetId, detail, req) => {
  try {
    const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '') : '';
    await SystemLog.create({
      user_id: userId || null,
      action,
      target_collection: targetCollection,
      target_id: targetId ? String(targetId) : '',
      detail,
      ip_address: typeof ip === 'string' ? ip : JSON.stringify(ip),
      timestamp: new Date()
    });
  } catch (error) {
    console.error('Error logging system action:', error.message);
  }
};

module.exports = { logAction };
