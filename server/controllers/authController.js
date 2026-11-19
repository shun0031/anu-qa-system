/**
 * ==============================================================================
 * ไฟล์: server/controllers/authController.js
 * หน้าที่: Controller สำหรับระบบยืนยันตัวตน (Authentication)
 * ฟังก์ชันหลัก:
 *  1. login: ตรวจสอบ username & password (bcrypt), สร้าง JWT token, อัปเดต last_login
 *  2. getMe: ดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบันจาก Token ที่ส่งมา
 *  3. updateProfile: อาจารย์/กรรมการแก้ไขข้อมูลส่วนตัว (ชื่อ, เบอร์โทร, LINE ID) และเปลี่ยนรหัสผ่าน
 * ==============================================================================
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/auth');
const { logAction } = require('../middleware/logger');

// -----------------------------------------------------------------------------
// 1. เข้าสู่ระบบ (Login)
// -----------------------------------------------------------------------------
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    // ค้นหาผู้ใช้จาก username พร้อมดึงข้อมูล Role และ Department
    const user = await User.findOne({ username: username.toLowerCase().trim() })
      .populate({
        path: 'role_id',
        populate: { path: 'permission_ids' }
      })
      .populate('department_id');

    if (!user) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // ตรวจสอบสถานะบัญชี
    if (user.status !== 'active') {
      return res.status(403).json({ message: 'บัญชีของคุณถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ' });
    }

    // เปรียบเทียบรหัสผ่านด้วย bcrypt
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    // บันทึกวันเวลาที่เข้าใช้งานล่าสุด
    user.last_login = new Date();
    await user.save();

    // สร้าง JWT Token อายุ 7 วัน
    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        role: user.role_id?.role_name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // บันทึก Audit Log การเข้าสู่ระบบ
    await logAction(user._id, 'LOGIN', 'users', user._id, `ผู้ใช้ ${user.username} เข้าสู่ระบบสำเร็จ`, req);

    res.json({
      message: 'เข้าสู่ระบบสำเร็จ',
      token,
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        line_id: user.line_id,
        role: user.role_id?.role_name,
        role_id: user.role_id?._id,
        permissions: user.role_id?.permission_ids?.map(p => p.permission_name) || [],
        department: user.department_id?.department_name,
        department_id: user.department_id?._id,
        status: user.status,
        last_login: user.last_login
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 2. ดึงข้อมูลส่วนตัวของผู้ใช้ปัจจุบัน (Get Current User Profile)
// -----------------------------------------------------------------------------
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'role_id',
        populate: { path: 'permission_ids' }
      })
      .populate('department_id')
      .select('-password_hash');

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    }

    res.json({
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        line_id: user.line_id,
        role: user.role_id?.role_name,
        role_id: user.role_id?._id,
        permissions: user.role_id?.permission_ids?.map(p => p.permission_name) || [],
        department: user.department_id?.department_name,
        department_id: user.department_id?._id,
        status: user.status,
        last_login: user.last_login
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลส่วนตัว', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 3. แก้ไขข้อมูลส่วนบุคคลและเปลี่ยนรหัสผ่าน (Update Profile & Password)
//    ตามแผนผังภาพที่ 3: อาจารย์และผู้รับผิดชอบ AUN-QA มีฟังก์ชัน "แก้ไขข้อมูลส่วนบุคคล"
// -----------------------------------------------------------------------------
const updateProfile = async (req, res) => {
  try {
    const { full_name, phone, address, line_id, current_password, new_password } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    }

    // อัปเดตข้อมูลทั่วไป
    if (full_name) user.full_name = full_name;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (line_id !== undefined) user.line_id = line_id;

    // กรณีต้องการเปลี่ยนรหัสผ่าน
    if (new_password) {
      if (!current_password) {
        return res.status(400).json({ message: 'กรุณาระบุรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่านใหม่' });
      }
      const isMatch = await bcrypt.compare(current_password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json({ message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' });
      }
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(new_password, salt);
    }

    await user.save();
    await logAction(user._id, 'UPDATE_PROFILE', 'users', user._id, `แก้ไขข้อมูลส่วนตัว`, req);

    res.json({
      message: 'บันทึกข้อมูลส่วนบุคคลเรียบร้อยแล้ว',
      user: {
        id: user._id,
        username: user.username,
        full_name: user.full_name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        line_id: user.line_id,
        role: req.userRole,
        department: user.department_id?.department_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัปเดตข้อมูลได้', error: error.message });
  }
};

module.exports = { login, getMe, updateProfile };
