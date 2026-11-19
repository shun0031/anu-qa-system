/**
 * ==============================================================================
 * ไฟล์: server/routes/recordRoutes.js
 * หน้าที่: กำหนดเส้นทาง API สำหรับบันทึกรายงาน SAR, แนบหลักฐาน, และตรวจประเมิน (Workflow)
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getRecords,
  getRecordById,
  saveRecord,
  reviewRecord,
  addEvidence,
  removeEvidence,
  getDashboardStats
} = require('../controllers/recordController');
const { auth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

router.use(auth);

// สถิติภาพรวมและการติดตามความก้าวหน้า
router.get('/stats/dashboard', getDashboardStats);

// ดึงรายการบันทึก
router.get('/', getRecords);
router.get('/:id', getRecordById);

// อาจารย์หรือผู้ดูแลระบบบันทึกแบบร่างหรือส่งตรวจ
router.post('/', saveRecord);

// การจัดการหลักฐานอ้างอิง
router.post('/:id/evidence', addEvidence);
router.delete('/:id/evidence/:evidenceId', removeEvidence);

// ผู้รับผิดชอบ AUN-QA หรือผู้ดูแลระบบ ตรวจประเมิน (ยืนยันผล หรือ ส่งกลับแก้ไข)
router.put('/:id/review', allowRoles('ผู้รับผิดชอบ AUN-QA', 'ผู้ดูแลระบบ'), reviewRecord);

module.exports = router;
