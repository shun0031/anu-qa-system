/**
 * ==============================================================================
 * ไฟล์: server/controllers/criteriaController.js
 * หน้าที่: Controller สำหรับจัดการเกณฑ์การประเมิน AUN-QA Version 4.0 (Criteria Management)
 * อ้างอิงตามแผนผังภาพที่ 3 ฝั่งผู้ดูแลระบบ (Admin):
 *  - แก้ไขเกณฑ์ในแต่ละปีการศึกษา (เพิ่ม ลบ แก้ไข ข้อเกณฑ์ AUN-QA)
 *  - คัดลอกเกณฑ์ข้ามปีการศึกษา (Clone Criteria to New Academic Year)
 * ==============================================================================
 */

const Criteria = require('../models/Criteria');
const { logAction } = require('../middleware/logger');

// 1. ดึงรายการเกณฑ์ AUN-QA กรองตามหลักสูตรและปีการศึกษา
const getCriteria = async (req, res) => {
  try {
    const { course_id, academic_year } = req.query;
    let query = {};
    if (course_id) query.course_id = course_id;
    if (academic_year) query.academic_year = academic_year;

    const criteriaList = await Criteria.find(query)
      .populate('course_id')
      .sort({ criteria_no: 1 });

    res.json(criteriaList);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลเกณฑ์ AUN-QA ได้', error: error.message });
  }
};

// 2. ดึงรายการปีการศึกษาทั้งหมดที่มีอยู่ในระบบ
const getAcademicYears = async (req, res) => {
  try {
    const years = await Criteria.distinct('academic_year');
    res.json(years.sort().reverse());
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงรายการปีการศึกษาได้', error: error.message });
  }
};

// 3. เพิ่มข้อเกณฑ์ใหม่ (Admin Create Criteria)
const createCriteria = async (req, res) => {
  try {
    const { course_id, academic_year, criteria_no, criteria_name, description } = req.body;

    if (!course_id || !academic_year || !criteria_no || !criteria_name) {
      return res.status(400).json({ message: 'กรุณากรอกข้อมูลเกณฑ์ให้ครบถ้วน' });
    }

    const existing = await Criteria.findOne({ course_id, academic_year, criteria_no });
    if (existing) {
      return res.status(400).json({ message: `ข้อเกณฑ์ ${criteria_no} ของปีการศึกษา ${academic_year} มีอยู่ในระบบแล้ว` });
    }

    const criteria = await Criteria.create({
      course_id,
      academic_year,
      criteria_no,
      criteria_name,
      description: description || ''
    });

    await logAction(req.user._id, 'CREATE_CRITERIA', 'criteria', criteria._id, `เพิ่มเกณฑ์: ${criteria_no} (${academic_year})`, req);

    res.status(201).json({ message: 'เพิ่มเกณฑ์ AUN-QA สำเร็จ', criteria });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถเพิ่มเกณฑ์ได้', error: error.message });
  }
};

// 4. แก้ไขข้อเกณฑ์ (Admin Update Criteria)
const updateCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const { criteria_no, criteria_name, description, academic_year } = req.body;

    const criteria = await Criteria.findById(id);
    if (!criteria) {
      return res.status(404).json({ message: 'ไม่พบเกณฑ์ที่ต้องการแก้ไข' });
    }

    if (criteria_no) criteria.criteria_no = criteria_no;
    if (criteria_name) criteria.criteria_name = criteria_name;
    if (description !== undefined) criteria.description = description;
    if (academic_year) criteria.academic_year = academic_year;

    await criteria.save();
    await logAction(req.user._id, 'UPDATE_CRITERIA', 'criteria', criteria._id, `แก้ไขเกณฑ์: ${criteria.criteria_no}`, req);

    res.json({ message: 'อัปเดตเกณฑ์ AUN-QA สำเร็จ', criteria });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถอัปเดตเกณฑ์ได้', error: error.message });
  }
};

// 5. ลบข้อเกณฑ์ (Admin Delete Criteria)
const deleteCriteria = async (req, res) => {
  try {
    const { id } = req.params;
    const criteria = await Criteria.findByIdAndDelete(id);
    if (!criteria) {
      return res.status(404).json({ message: 'ไม่พบเกณฑ์' });
    }

    await logAction(req.user._id, 'DELETE_CRITERIA', 'criteria', id, `ลบเกณฑ์: ${criteria.criteria_no}`, req);
    res.json({ message: 'ลบเกณฑ์ AUN-QA สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบเกณฑ์ได้', error: error.message });
  }
};

// 6. คัดลอกเกณฑ์ทั้งหมดจากปีการศึกษาเดิมไปยังปีการศึกษาใหม่ (Clone Criteria)
const cloneCriteria = async (req, res) => {
  try {
    const { course_id, from_year, to_year } = req.body;
    if (!course_id || !from_year || !to_year) {
      return res.status(400).json({ message: 'กรุณาระบุหลักสูตร ปีการศึกษาต้นทาง และปีการศึกษาปลายทาง' });
    }

    const sourceCriteria = await Criteria.find({ course_id, academic_year: from_year });
    if (sourceCriteria.length === 0) {
      return res.status(404).json({ message: `ไม่พบเกณฑ์ของปีการศึกษา ${from_year}` });
    }

    let clonedCount = 0;
    for (const item of sourceCriteria) {
      const exists = await Criteria.findOne({ course_id, academic_year: to_year, criteria_no: item.criteria_no });
      if (!exists) {
        await Criteria.create({
          course_id,
          academic_year: to_year,
          criteria_no: item.criteria_no,
          criteria_name: item.criteria_name,
          description: item.description
        });
        clonedCount++;
      }
    }

    await logAction(req.user._id, 'CLONE_CRITERIA', 'criteria', null, `คัดลอกเกณฑ์ ${clonedCount} รายการ จากปี ${from_year} ไปยัง ${to_year}`, req);

    res.json({ message: `คัดลอกเกณฑ์เรียบร้อยแล้ว จำนวน ${clonedCount} ข้อ`, count: clonedCount });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการคัดลอกเกณฑ์', error: error.message });
  }
};

module.exports = {
  getCriteria,
  getAcademicYears,
  createCriteria,
  updateCriteria,
  deleteCriteria,
  cloneCriteria
};
