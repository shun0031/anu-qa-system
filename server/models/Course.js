/**
 * ==============================================================================
 * ไฟล์: server/models/Course.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บข้อมูลหลักสูตร (collection: courses)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - course_name: ชื่อหลักสูตร
 *  - department_id: อ้างอิงสาขาวิชาที่เป็นเจ้าของหลักสูตร (collection: departments)
 *  - status: สถานะการเปิดรับการประเมิน (active / inactive)
 * ==============================================================================
 */

const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  course_name: {
    type: String,
    required: true,
    trim: true
  },
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
