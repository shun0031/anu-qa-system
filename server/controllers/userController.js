/**
 * ==============================================================================
 * ไฟล์: server/controllers/userController.js
 * หน้าที่: Controller สำหรับการจัดการผู้ใช้งานในระบบ (User Management)
 * อ้างอิงตามแผนผังภาพที่ 3 ฝั่งผู้ดูแลระบบ (Admin):
 *  - กำหนดสิทธิ์ผู้ใช้งาน
 *  - การจัดการรหัสผ่านและผู้ใช้ (เพิ่ม ลบ แก้ไข และรีเซ็ตรหัสผ่าน)
 * ==============================================================================
 */

const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Role = require('../models/Role');
const Department = require('../models/Department');
const { logAction } = require('../middleware/logger');

// 1. ดึงรายชื่อผู้ใช้งานทั้งหมด พร้อมค้นหาและกรองตามบทบาท/สถานะ
const getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role_id = role;
    if (status) query.status = status;

    const users = await User.find(query)
      .populate('role_id')
      .populate('department_id')
      .select('-password_hash')
      .sort({ created_date: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้', error: error.message });
  }
};

// 2. สร้างบัญชีผู้ใช้งานใหม่ (Admin Create User)
const createUser = async (req, res) => {
  try {
    const { username, password, full_name, email, phone, address, line_id, role_id, department_id, status } = req.body;

    if (!username || !password || !full_name || !email || !role_id) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน' });
    }

    // ตรวจสอบชื่อผู้ใช้และอีเมลซ้ำ
    const existingUser = await User.findOne({
      $or: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'ชื่อผู้ใช้หรืออีเมลนี้ถูกใช้งานแล้ว' });
    }

    // เข้ารหัสผ่าน
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.toLowerCase().trim(),
      password_hash,
      full_name,
      email: email.toLowerCase().trim(),
      phone: phone || '',
      address: address || '',
      line_id: line_id || '',
      role_id,
      department_id: department_id || null,
      status: status || 'active'
    });

    await logAction(req.user._id, 'CREATE_USER', 'users', newUser._id, `เพิ่มผู้ใช้งานใหม่: ${newUser.username}`, req);

    const populatedUser = await User.findById(newUser._id)
      .populate('role_id')
      .populate('department_id')
      .select('-password_hash');

    res.status(201).json({ message: 'สร้างผู้ใช้งานสำเร็จ', user: populatedUser });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถสร้างผู้ใช้งานได้', error: error.message });
  }
};

// 3. แก้ไขข้อมูลผู้ใช้งาน (Admin Update User)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, phone, address, line_id, role_id, department_id, status } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    }

    if (full_name) user.full_name = full_name;
    if (email) user.email = email.toLowerCase().trim();
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    if (line_id !== undefined) user.line_id = line_id;
    if (role_id) user.role_id = role_id;
    if (department_id !== undefined) user.department_id = department_id || null;
    if (status) user.status = status;

    await user.save();
    await logAction(req.user._id, 'UPDATE_USER', 'users', user._id, `แก้ไขข้อมูลผู้ใช้งาน: ${user.username}`, req);

    const updated = await User.findById(id)
      .populate('role_id')
      .populate('department_id')
      .select('-password_hash');

    res.json({ message: 'อัปเดตข้อมูลผู้ใช้งานสำเร็จ', user: updated });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้งานได้', error: error.message });
  }
};

// 4. รีเซ็ตรหัสผ่านผู้ใช้งานโดยผู้ดูแลระบบ (Admin Reset Password)
const resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    if (!new_password || new_password.length < 6) {
      return res.status(400).json({ message: 'รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(new_password, salt);
    await user.save();

    await logAction(req.user._id, 'RESET_PASSWORD', 'users', user._id, `รีเซ็ตรหัสผ่านสำหรับ ${user.username}`, req);

    res.json({ message: `รีเซ็ตรหัสผ่านของ ${user.username} สำเร็จเรียบร้อยแล้ว` });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถรีเซ็ตรหัสผ่านได้', error: error.message });
  }
};

// 5. ลบผู้ใช้งาน (Admin Delete User)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // ป้องกันแอดมินลบบัญชีตนเอง
    if (String(req.user._id) === String(id)) {
      return res.status(400).json({ message: 'ไม่สามารถลบบัญชีของตนเองได้' });
    }

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: 'ไม่พบผู้ใช้งาน' });
    }

    await logAction(req.user._id, 'DELETE_USER', 'users', id, `ลบผู้ใช้งาน: ${user.username}`, req);
    res.json({ message: 'ลบผู้ใช้งานสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบผู้ใช้งานได้', error: error.message });
  }
};

// 6. ดึงรายชื่อบทบาทและสาขาวิชาสำหรับ Dropdown
const getRolesAndDepartments = async (req, res) => {
  try {
    const roles = await Role.find().populate('permission_ids');
    const departments = await Department.find().sort({ department_name: 1 });
    res.json({ roles, departments });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลบทบาทและแผนกได้', error: error.message });
  }
};

module.exports = {
  getUsers,
  createUser,
  updateUser,
  resetPassword,
  deleteUser,
  getRolesAndDepartments
};
