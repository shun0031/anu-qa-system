/**
 * ==============================================================================
 * ไฟล์: server/controllers/courseController.js
 * หน้าที่: Controller สำหรับจัดการข้อมูลหลักสูตรและสาขาวิชา (Courses & Departments)
 * อ้างอิงตามแผนผังภาพที่ 3 ฝั่งผู้ดูแลระบบ (Admin):
 *  - เพิ่มหลักสูตร
 *  - แก้ไข/ลบหลักสูตร และจัดการสาขาวิชา
 * ==============================================================================
 */

const Course = require('../models/Course');
const Department = require('../models/Department');
const { logAction } = require('../middleware/logger');

// 1. ดึงรายชื่อหลักสูตรทั้งหมด
const getCourses = async (req, res) => {
  try {
    const { department_id, status } = req.query;
    let query = {};
    if (department_id) query.department_id = department_id;
    if (status) query.status = status;

    const courses = await Course.find(query)
      .populate('department_id')
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลหลักสูตรได้', error: error.message });
  }
};

// 2. เพิ่มหลักสูตรใหม่ (Admin Create Course)
const createCourse = async (req, res) => {
  try {
    const { course_name, department_id, status } = req.body;
    if (!course_name || !department_id) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อหลักสูตรและสาขาวิชา' });
    }

    const course = await Course.create({
      course_name,
      department_id,
      status: status || 'active'
    });

    await logAction(req.user._id, 'CREATE_COURSE', 'courses', course._id, `เพิ่มหลักสูตร: ${course_name}`, req);

    const populated = await Course.findById(course._id).populate('department_id');
    res.status(201).json({ message: 'เพิ่มหลักสูตรสำเร็จ', course: populated });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถเพิ่มหลักสูตรได้', error: error.message });
  }
};

// 3. แก้ไขข้อมูลหลักสูตร (Admin Update Course)
const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_name, department_id, status } = req.body;

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลหลักสูตร' });
    }

    if (course_name) course.course_name = course_name;
    if (department_id) course.department_id = department_id;
    if (status) course.status = status;

    await course.save();
    await logAction(req.user._id, 'UPDATE_COURSE', 'courses', course._id, `อัปเดตหลักสูตร: ${course.course_name}`, req);

    const populated = await Course.findById(id).populate('department_id');
    res.json({ message: 'อัปเดตหลักสูตรสำเร็จ', course: populated });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัปเดตหลักสูตรได้', error: error.message });
  }
};

// 4. ลบหลักสูตร (Admin Delete Course)
const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลหลักสูตร' });
    }

    await logAction(req.user._id, 'DELETE_COURSE', 'courses', id, `ลบหลักสูตร: ${course.course_name}`, req);
    res.json({ message: 'ลบหลักสูตรสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบหลักสูตรได้', error: error.message });
  }
};

// 5. ดึงรายชื่อสาขาวิชาทั้งหมด
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ department_name: 1 });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลสาขาวิชาได้', error: error.message });
  }
};

// 6. เพิ่มสาขาวิชาใหม่
const createDepartment = async (req, res) => {
  try {
    const { department_name } = req.body;
    if (!department_name) {
      return res.status(400).json({ message: 'กรุณาระบุชื่อสาขาวิชา' });
    }

    const dept = await Department.create({ department_name });
    await logAction(req.user._id, 'CREATE_DEPARTMENT', 'departments', dept._id, `เพิ่มสาขาวิชา: ${department_name}`, req);

    res.status(201).json({ message: 'เพิ่มสาขาวิชาสำเร็จ', department: dept });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถเพิ่มสาขาวิชาได้', error: error.message });
  }
};

module.exports = {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getDepartments,
  createDepartment
};
