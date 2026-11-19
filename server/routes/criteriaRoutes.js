/**
 * ==============================================================================
 * ไฟล์: server/routes/criteriaRoutes.js
 * หน้าที่: กำหนดเส้นทาง API สำหรับจัดการเกณฑ์ AUN-QA (Criteria Management Routes)
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getCriteria,
  getAcademicYears,
  createCriteria,
  updateCriteria,
  deleteCriteria,
  cloneCriteria
} = require('../controllers/criteriaController');
const { auth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

router.use(auth);

// ดึงรายการปีการศึกษาและข้อเกณฑ์ (ทุกคนที่ล็อกอินสามารถดูได้)
router.get('/years', getAcademicYears);
router.get('/', getCriteria);

// การเพิ่ม แก้ไข ลบ และคัดลอกเกณฑ์ (เฉพาะผู้ดูแลระบบ)
router.post('/', allowRoles('ผู้ดูแลระบบ'), createCriteria);
router.post('/clone', allowRoles('ผู้ดูแลระบบ'), cloneCriteria);
router.put('/:id', allowRoles('ผู้ดูแลระบบ'), updateCriteria);
router.delete('/:id', allowRoles('ผู้ดูแลระบบ'), deleteCriteria);

module.exports = router;
