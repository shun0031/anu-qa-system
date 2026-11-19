/**
 * ==============================================================================
 * ไฟล์: server/models/FileRecord.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บข้อมูลไฟล์หลักฐาน (collection: files)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - ผู้ดูแลระบบ (Admin) สามารถตรวจสอบและจัดการไฟล์ทั้งหมดในระบบได้
 *  - เก็บ metadata: original_name, file_name, file_path, file_type, mime_type, file_size
 *  - uploaded_by: ผู้ที่ทำการอัปโหลดไฟล์
 * ==============================================================================
 */

const mongoose = require('mongoose');

const fileRecordSchema = new mongoose.Schema({
  // ชื่อไฟล์เดิมที่ผู้ใช้อัปโหลดมา เช่น "แผนการศึกษา_มคอ2.pdf"
  original_name: {
    type: String,
    required: true
  },
  // ชื่อไฟล์ที่ระบบตั้งขึ้นใหม่เพื่อป้องกันชื่อซ้ำ เช่น "17156900-แผนการศึกษา.pdf"
  file_name: {
    type: String,
    required: true
  },
  // ตำแหน่งที่จัดเก็บไฟล์ในเซิร์ฟเวอร์ (เช่น uploads/...)
  file_path: {
    type: String,
    required: true
  },
  // ประเภทไฟล์หลักฐาน: 'document' (เอกสาร), 'image' (รูปภาพ)
  file_type: {
    type: String,
    default: 'file'
  },
  // ชนิดข้อมูล MIME Type เช่น application/pdf, image/png
  mime_type: {
    type: String,
    default: ''
  },
  // ขนาดไฟล์ในหน่วยไบต์ (Bytes)
  file_size: {
    type: Number,
    default: 0
  },
  // อ้างอิงผู้ที่อัปโหลดไฟล์ (collection: users)
  uploaded_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // วันที่และเวลาที่อัปโหลด
  upload_date: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('FileRecord', fileRecordSchema, 'files');
