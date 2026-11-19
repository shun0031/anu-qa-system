/**
 * ==============================================================================
 * ไฟล์: server/models/AunqaRecord.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บข้อมูลบันทึกรายงาน AUN-QA (collection: aunqa_records)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - criteria_id: อ้างอิง (Reference) ไปยัง collection 'criteria'
 *  - course_id: อ้างอิง (Reference) ไปยัง collection 'courses'
 *  - status: สถานะของบันทึก (draft, submitted, returned, confirmed)
 *  - evidences: หลักฐานอ้างอิงแบบฝัง (Embedded Array) ตามภาพที่ 2
 *  - review_history: ประวัติการตรวจแบบฝัง (Embedded Array) สำหรับบันทึก Audit Trail
 * ==============================================================================
 */

const mongoose = require('mongoose');

// -----------------------------------------------------------------------------
// 1. Schema ย่อยสำหรับหลักฐานอ้างอิง (Evidences - Embedded Array)
//    ตามหมายเหตุในภาพที่ 2: "TB_EVIDENCE ไม่ใช่ collection แยก แต่ฝังใน aunqa_records"
// -----------------------------------------------------------------------------
const evidenceSchema = new mongoose.Schema({
  evidence_id: {
    type: String,
    required: true // รหัสประจำหลักฐาน เช่น ev-171569000
  },
  evidence_type: {
    type: String,
    enum: ['file', 'image', 'text', 'link'], // ประเภทหลักฐาน 4 รูปแบบตามภาพที่ 3
    required: true
  },
  file_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FileRecord', // กรณีเป็นไฟล์หรือรูปภาพ เชื่อมไปยัง collection 'files'
    default: null
  },
  text: {
    type: String, // ข้อความสรุป หรือคำอธิบายหลักฐาน
    default: ''
  },
  url: {
    type: String, // ลิงก์อ้างอิง (เช่น Google Drive, ลิงก์ระบบภายนอก หรือ path ไฟล์)
    default: ''
  },
  uploaded_by: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // ผู้ที่แนบหลักฐาน
    },
    full_name: String // เก็บชื่อแบบ Denormalized เพื่อให้อ่านข้อมูลง่ายโดยไม่ต้อง Query ซ้ำ
  },
  uploaded_date: {
    type: Date,
    default: Date.now // วันที่แนบหลักฐาน
  }
}, { _id: false });

// -----------------------------------------------------------------------------
// 2. Schema ย่อยสำหรับประวัติการตรวจ (Review History - Embedded Array)
//    ตามหมายเหตุภาพที่ 2: ฝังใน record เก็บประวัติการส่ง, การตรวจ, และการส่งกลับ
// -----------------------------------------------------------------------------
const reviewHistorySchema = new mongoose.Schema({
  action: {
    type: String, // 'submitted' (ส่งตรวจ), 'returned' (ส่งกลับแก้ไข), 'confirmed' (ยืนยันผล)
    required: true
  },
  comment: {
    type: String, // ข้อเสนอแนะหรือความคิดเห็นของกรรมการ
    default: ''
  },
  reviewed_by: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // ผู้ตรวจประเมิน
    },
    full_name: String
  },
  reviewed_date: {
    type: Date,
    default: Date.now // วันเวลาที่ตรวจ
  }
}, { _id: false });

// -----------------------------------------------------------------------------
// 3. Schema หลักสำหรับบันทึกข้อมูล AUN-QA (aunqa_records)
// -----------------------------------------------------------------------------
const aunqaRecordSchema = new mongoose.Schema({
  // อ้างอิงข้อเกณฑ์ AUN-QA Version 4.0
  criteria_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Criteria',
    required: true
  },
  // อ้างอิงหลักสูตร
  course_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  // ปีการศึกษา เช่น "2567"
  academic_year: {
    type: String,
    required: true
  },
  // รายงานผลการดำเนินงานตามเกณฑ์ (Description ที่อาจารย์เป็นผู้กรอก)
  description: {
    type: String,
    default: ''
  },
  // สถานะการบันทึกข้อมูล (Workflow Status)
  //  - draft: อาจารย์กำลังร่าง/บันทึกข้อมูล
  //  - submitted: อาจารย์ส่งรายงานแล้ว รอคณะกรรมการ AUN-QA ตรวจสอบ
  //  - returned: ผู้รับผิดชอบ AUN-QA ส่งกลับให้อาจารย์แก้ไข/แนบหลักฐานใหม่
  //  - confirmed: ผู้รับผิดชอบ AUN-QA ตรวจสอบแล้วและยืนยันผลสำเร็จ
  status: {
    type: String,
    enum: ['draft', 'submitted', 'returned', 'confirmed'],
    default: 'draft'
  },
  // ข้อมูลผู้จัดทำรายงาน (อาจารย์ผู้รับผิดชอบ)
  created_by: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    full_name: String
  },
  // ความเห็นล่าสุดของกรรมการ AUN-QA
  review_comment: {
    type: String,
    default: ''
  },
  // ผู้ตรวจประเมินล่าสุด
  reviewed_by: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    full_name: String
  },
  reviewed_date: {
    type: Date,
    default: null
  },
  // ประวัติการตรวจทั้งหมด (ฝังไว้ใน Document)
  review_history: [reviewHistorySchema],

  // ข้อมูลผู้ที่ยืนยันผลสำเร็จ (Confirmed By)
  confirmed_by: {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    full_name: String
  },
  confirmed_date: {
    type: Date,
    default: null
  },

  // รายการหลักฐานอ้างอิง (Evidences ฝังใน Document)
  evidences: [evidenceSchema]
}, {
  // บันทึกวันเวลาที่สร้าง (created_date) และวันเวลาที่แก้ไขล่าสุด (updated_date) อัตโนมัติ
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

module.exports = mongoose.model('AunqaRecord', aunqaRecordSchema, 'aunqa_records');
