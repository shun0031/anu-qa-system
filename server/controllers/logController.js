/**
 * ==============================================================================
 * ไฟล์: server/controllers/logController.js
 * หน้าที่: Controller สำหรับดึงข้อมูลประวัติการใช้งานระบบ (System Audit Logs)
 * อ้างอิงตามแผนผังภาพที่ 3 ฝั่งผู้ดูแลระบบ (Admin):
 *  - ตรวจสอบประวัติการใช้งานระบบ (Audit Trail)
 *  - ดูย้อนหลังว่าผู้ใช้คนใดทำรายการใด วันเวลาใด จาก IP Address ใด
 * ==============================================================================
 */

const SystemLog = require('../models/SystemLog');

const getLogs = async (req, res) => {
  try {
    const { action, limit = 100 } = req.query;
    let query = {};
    if (action) query.action = action;

    const logs = await SystemLog.find(query)
      .populate({
        path: 'user_id',
        select: 'full_name username role_id role_ids',
        populate: [{ path: 'role_id' }, { path: 'role_ids' }]
      })
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลประวัติระบบได้', error: error.message });
  }
};

module.exports = { getLogs };
