/**
 * ==============================================================================
 * ไฟล์: server/models/Criteria.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บเกณฑ์การประเมินการศึกษา (collection: criteria)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - course_id: อ้างอิงหลักสูตรที่ใช้เกณฑ์นี้
 *  - academic_year: ปีการศึกษา (เช่น "2566", "2567")
 *  - criteria_no: รหัสข้อเกณฑ์ตามเกณฑ์ AUN-QA Version 4.0 (เช่น 1.1, 1.2, 2.1 ... 8.2)
 *  - criteria_name: ชื่อเกณฑ์
 *  - description: คำอธิบายสาระสำคัญและตัวชี้วัดของเกณฑ์
 * ==============================================================================
 */

const mongoose = require('mongoose');

const criteriaSchema = new mongoose.Schema({
  // อ้างอิงไปยังหลักสูตร (collection: courses)
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // ปีการศึกษา เช่น "2567"
  academic_year: {
    type: String,
    required: true,
    trim: true
  },
  // รหัสข้อเกณฑ์ เช่น "1.1", "1.2", "2.1", "3.1"
  criteria_no: {
    type: String,
    required: true,
    trim: true
  },
  // ชื่อของเกณฑ์การประเมิน
  criteria_name: {
    type: String,
    required: true,
    trim: true
  },
  // คำอธิบายตัวชี้วัดหรือสาระสำคัญตามคู่มือเกณฑ์ AUN-QA Version 4.0
  description: {
    type: String,
    default: ''
  }
}, { timestamps: true });

// กำหนด Compound Index เพื่อป้องกันไม่ให้มีข้อเกณฑ์ซ้ำกันในหลักสูตรและปีการศึกษาเดียวกัน
criteriaSchema.index({ course_id: 1, academic_year: 1, criteria_no: 1 }, { unique: true });

module.exports = mongoose.model('Criteria', criteriaSchema);
