/**
 * ==============================================================================
 * ไฟล์: server/middleware/auth.js
 * หน้าที่: Middleware สำหรับตรวจสอบสิทธิ์การเข้าใช้งานผ่าน JSON Web Token (JWT)
 * รายละเอียดการทำงาน:
 *  1. ดึง Token จาก HTTP Header 'Authorization: Bearer <token>'
 *  2. ตรวจสอบความถูกต้องและวันหมดอายุของ Token ด้วย JWT_SECRET
 *  3. ดึงข้อมูล User จากฐานข้อมูล พร้อมสิทธิ์และบทบาท (populate role_id & department_id)
 *  4. ตรวจสอบสถานะบัญชี (user.status === 'active')
 *  5. แนบข้อมูล user และ userRole เข้ากับ req เพื่อให้ Controller ถัดไปใช้งาน
 * ==============================================================================
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'aun-qa-secret-key-2024';

const auth = async (req, res, next) => {
  try {
    // 1. ตรวจสอบว่ามี Authorization Header ส่งมาหรือไม่
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'ไม่มีสิทธิ์เข้าถึง: ไม่พบ Token ยืนยันตัวตน' });
    }

    // 2. สกัดเอาเฉพาะตัวรหัส Token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. ค้นหาข้อมูลผู้ใช้งานในฐานข้อมูลโดยไม่ส่ง password_hash กลับไป
    const user = await User.findById(decoded.id)
      .populate('role_id')
      .populate('department_id')
      .select('-password_hash');

    if (!user) {
      return res.status(401).json({ message: 'ไม่พบข้อมูลผู้ใช้งาน หรือบัญชีถูกระงับ' });
    }

    // 4. ตรวจสอบว่าบัญชีถูกปิดการใช้งานหรือไม่
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'บัญชีผู้ใช้นี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
    }

    // 5. บันทึกข้อมูลลงใน Request object
    req.user = user;
    req.userRole = user.role_id?.role_name;
    next(); // ผ่านไปยัง middleware หรือ controller ถัดไป
  } catch (error) {
    return res.status(401).json({ message: 'Token ไม่ถูกต้องหรือหมดอายุ', error: error.message });
  }
};

module.exports = { auth, JWT_SECRET };
