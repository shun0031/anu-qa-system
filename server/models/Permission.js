/**
 * ==============================================================================
 * ไฟล์: server/models/Permission.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บรายการสิทธิ์การใช้งาน (collection: permissions)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - permission_name: ชื่อสิทธิ์ เช่น 'submit_aunqa_record', 'review_aunqa_record'
 * ==============================================================================
 */

const mongoose = require('mongoose');

const permissionSchema = new mongoose.Schema({
  permission_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Permission', permissionSchema);
