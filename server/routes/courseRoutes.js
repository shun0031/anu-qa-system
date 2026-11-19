/**
 * ==============================================================================
 * ไฟล์: server/routes/courseRoutes.js
 * หน้าที่: กำหนดเส้นทาง API สำหรับจัดการหลักสูตรและสาขาวิชา (Course & Department Routes)
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getDepartments,
  createDepartment
} = require('../controllers/courseController');
const { auth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

router.use(auth);

// จัดการสาขาวิชา
router.get('/departments', getDepartments);
router.post('/departments', allowRoles('ผู้ดูแลระบบ'), createDepartment);

// จัดการหลักสูตร
router.get('/', getCourses);
router.post('/', allowRoles('ผู้ดูแลระบบ'), createCourse);
router.put('/:id', allowRoles('ผู้ดูแลระบบ'), updateCourse);
router.delete('/:id', allowRoles('ผู้ดูแลระบบ'), deleteCourse);

module.exports = router;
