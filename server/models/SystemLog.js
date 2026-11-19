/**
 * ==============================================================================
 * ไฟล์: server/models/SystemLog.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บบันทึกประวัติการใช้งานระบบ (collection: system_logs)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - ตรวจสอบประวัติการใช้งาน (Audit Trail) เพื่อความโปร่งใสและตรวจสอบได้
 *  - บันทึก: user_id, action, target_collection, target_id, detail, timestamp, ip_address
 * ==============================================================================
 */

const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  // อ้างอิงผู้ใช้งานที่กระทำการ (null หากเป็นระบบอัตโนมัติ)
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // การกระทำ เช่น 'LOGIN', 'SUBMIT_RECORD', 'CONFIRM_RECORD', 'RETURN_RECORD', 'UPLOAD_FILE'
  action: {
    type: String,
    required: true
  },
  // ชื่อ Collection ที่ได้รับผลกระทบ เช่น 'aunqa_records', 'users', 'files'
  target_collection: {
    type: String,
    default: ''
  },
  // รหัสข้อมูล ID ที่ได้รับผลกระทบ
  target_id: {
    type: String,
    default: ''
  },
  // รายละเอียดเพิ่มเติมของกิจกรรม
  detail: {
    type: String,
    default: ''
  },
  // วันเวลาที่เกิดกิจกรรม
  timestamp: {
    type: Date,
    default: Date.now
  },
  // หมายเลข IP Address ของเครื่องผู้ใช้งาน
  ip_address: {
    type: String,
    default: ''
  }
});

module.exports = mongoose.model('SystemLog', systemLogSchema, 'system_logs');
