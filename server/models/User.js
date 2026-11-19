/**
 * ==============================================================================
 * ไฟล์: server/models/User.js
 * หน้าที่: Mongoose Model สำหรับจัดเก็บข้อมูลผู้ใช้งานระบบ (collection: users)
 * อ้างอิงตามแผนผังโครงสร้างฐานข้อมูล NoSQL/MongoDB (ภาพที่ 2):
 *  - username: ชื่อผู้ใช้ (ไม่ซ้ำ)
 *  - password_hash: รหัสผ่านที่เข้ารหัสด้วย bcrypt
 *  - full_name: ชื่อ-นามสกุลจริง
 *  - role_id: อ้างอิงบทบาทผู้ใช้ (collection: roles)
 *  - department_id: อ้างอิงสาขาวิชา (collection: departments)
 *  - status: สถานะการใช้งาน (active / inactive)
 * ==============================================================================
 */

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // ชื่อผู้ใช้งานสำหรับล็อกอิน (ไม่ซ้ำกัน และแปลงเป็นตัวพิมพ์เล็ก)
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // รหัสผ่านที่ผ่านการเข้ารหัสแบบทางเดียว (bcrypt hash) แล้ว ป้องกันข้อมูลรั่วไหล
  password_hash: {
    type: String,
    required: true
  },
  // ชื่อและนามสกุลจริงของอาจารย์หรือผู้ดูแลระบบ
  full_name: {
    type: String,
    required: true,
    trim: true
  },
  // ที่อยู่หรือห้องพักอาจารย์
  address: {
    type: String,
    default: ''
  },
  // เบอร์โทรศัพท์สำหรับติดต่อ
  phone: {
    type: String,
    default: ''
  },
  // อีเมลประจำตัว (ไม่ซ้ำกัน)
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  // ไอดีไลน์สำหรับแจ้งเตือนหรือติดต่อ
  line_id: {
    type: String,
    default: ''
  },
  // อ้างอิงบทบาทผู้ใช้ (Admin, Lecturer, Reviewer)
  role_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  // อ้างอิงสังกัดสาขาวิชา (เช่น สาขาเทคโนโลยีคอมพิวเตอร์)
  department_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    default: null
  },
  // สถานะการใช้งานบัญชี: active (ใช้งานได้), inactive (ถูกระงับ)
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  // วันเวลาที่เข้าสู่ระบบครั้งล่าสุด
  last_login: {
    type: Date,
    default: null
  }
}, {
  // บันทึกวันที่สร้างบัญชี (created_date) และวันที่แก้ไขข้อมูลล่าสุด (updated_date) อัตโนมัติ
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' }
});

module.exports = mongoose.model('User', userSchema);
