/**
 * ==============================================================================
 * ไฟล์: server/routes/authRoutes.js
 * หน้าที่: กำหนดเส้นทาง API สำหรับระบบยืนยันตัวตน (Authentication Routes)
 * เส้นทาง:
 *  - POST /api/auth/login : เข้าสู่ระบบ
 *  - GET  /api/auth/me    : ดึงข้อมูลผู้ใช้งานปัจจุบัน (ต้องผ่าน auth middleware)
 *  - PUT  /api/auth/profile : แก้ไขข้อมูลส่วนบุคคลและเปลี่ยนรหัสผ่าน
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const { login, getMe, updateProfile } = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/login', login);
router.get('/me', auth, getMe);
router.put('/profile', auth, updateProfile);

module.exports = router;
