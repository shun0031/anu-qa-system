/**
 * ==============================================================================
 * ไฟล์: server/models/Department.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บข้อมูลสาขาวิชา (collection: departments)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - department_name: ชื่อสาขาวิชา (เช่น "สาขาเทคโนโลยีคอมพิวเตอร์")
 * ==============================================================================
 */

const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
  department_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Department', departmentSchema);
