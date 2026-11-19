/**
 * ==============================================================================
 * ไฟล์: server/routes/userRoutes.js
 * หน้าที่: กำหนดเส้นทาง API สำหรับจัดการผู้ใช้งาน (User Management Routes)
 * สิทธิ์การเข้าถึง: เฉพาะ "ผู้ดูแลระบบ" (Admin) เท่านั้น
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getRolesAndDepartments
} = require('../controllers/userController');
const { auth } = require('../middleware/auth');
const { allowRoles } = require('../middleware/rbac');

// ทุก Route ในไฟล์นี้ต้องผ่านการตรวจสอบ JWT Token
router.use(auth);

// ดึงข้อมูลบทบาทและแผนกสำหรับ dropdown (ผู้ใช้ที่ล็อกอินแล้วดูได้)
router.get('/meta/roles-departments', getRolesAndDepartments);

// เส้นทางเฉพาะผู้ดูแลระบบ (Admin Only)
router.get('/', allowRoles('ผู้ดูแลระบบ'), getUsers);
router.post('/', allowRoles('ผู้ดูแลระบบ'), createUser);
router.put('/:id', allowRoles('ผู้ดูแลระบบ'), updateUser);
router.put('/:id/reset-password', allowRoles('ผู้ดูแลระบบ'), resetPassword);
router.delete('/:id', allowRoles('ผู้ดูแลระบบ'), deleteUser);

module.exports = router;
