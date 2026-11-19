/**
 * ==============================================================================
 * ไฟล์: server/routes/fileRoutes.js
 * หน้าที่: กำหนดเส้นทาง API สำหรับจัดการไฟล์หลักฐาน (File Routes)
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const {
  uploadFile,
  getFiles,
  deleteFile,
  downloadFile
} = require('../controllers/fileController');
const { auth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

router.use(auth);

// อัปโหลดไฟล์หลักฐาน (อาจารย์, กรรมการ, แอดมิน ใช้ได้)
router.post('/upload', upload.single('file'), uploadFile);

// ดูรายการไฟล์ทั้งหมด (เฉพาะแอดมิน และผู้รับผิดชอบ AUN-QA)
router.get('/', allowRoles('ผู้ดูแลระบบ', 'ผู้รับผิดชอบ AUN-QA'), getFiles);

// ลบไฟล์ (เฉพาะแอดมิน)
router.delete('/:id', allowRoles('ผู้ดูแลระบบ'), deleteFile);

// ดาวน์โหลดไฟล์
router.get('/:id/download', downloadFile);

module.exports = router;
