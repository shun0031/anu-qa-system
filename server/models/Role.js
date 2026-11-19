/**
 * ==============================================================================
 * ไฟล์: server/models/Role.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บข้อมูลบทบาทผู้ใช้งาน (collection: roles)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - role_name: ชื่อบทบาท เช่น ผู้ดูแลระบบ, อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์, ผู้รับผิดชอบ AUN-QA
 *  - permission_ids: รายการสิทธิ์ที่ผูกกับบทบาทนี้ (ยุบจาก TB_ROLE_PERMISSION เป็น Array of ObjectId)
 * ==============================================================================
 */

const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
  role_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  permission_ids: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Permission'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
