/**
 * ==============================================================================
 * ไฟล์: server/routes/logRoutes.js
 * หน้าที่: กำหนดเส้นทาง API สำหรับดูประวัติการใช้งานระบบ (System Audit Log Routes)
 * สิทธิ์การเข้าถึง: เฉพาะ "ผู้ดูแลระบบ" (Admin) เท่านั้น
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const { getLogs } = require('../controllers/logController');
const { auth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

router.use(auth);

// ดึงประวัติการใช้งานระบบ
router.get('/', allowRoles('ผู้ดูแลระบบ'), getLogs);

module.exports = router;
