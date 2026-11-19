/**
 * ==============================================================================
 * ไฟล์: server/controllers/recordController.js
 * หน้าที่: Controller สำหรับควบคุมการทำงานเกี่ยวกับบันทึก AUN-QA (Business Logic)
 * ฟังก์ชันหลัก:
 *  1. getRecords: ดึงรายการบันทึกผลการดำเนินงาน กรองตามปี, หลักสูตร, สถานะ
 *  2. getRecordById: ดึงข้อมูลรายละเอียดของบันทึก AUN-QA 1 รายการ
 *  3. saveRecord: บันทึกแบบร่าง (Draft) หรือส่งรายงานเพื่อรับการตรวจ (Submitted)
 *  4. reviewRecord: ตรวจสอบรายงาน (ผู้รับผิดชอบ AUN-QA สั่ง Confirm หรือ Return)
 *  5. addEvidence / removeEvidence: จัดการหลักฐานอ้างอิง (ไฟล์, รูป, ลิงก์, ข้อความ)
 *  6. getDashboardStats: ประมวลผลสถิติความคืบหน้าภาพรวม (Completion Rate)
 * ==============================================================================
 */

const AunqaRecord = require('../models/AunqaRecord');
const Criteria = require('../models/Criteria');
const FileRecord = require('../models/FileRecord');
const { logAction } = require('../middleware/logger');

// -----------------------------------------------------------------------------
// 1. ดึงรายการบันทึก AUN-QA ทั้งหมด พร้อมตัวกรอง (Filters)
// -----------------------------------------------------------------------------
const getRecords = async (req, res) => {
  try {
    const { course_id, academic_year, status, criteria_id, my_records } = req.query;
    let query = {};

    if (course_id) query.course_id = course_id;
    if (academic_year) query.academic_year = academic_year;
    if (status) query.status = status;
    if (criteria_id) query.criteria_id = criteria_id;

    // กรองเฉพาะรายการที่ตนเองเป็นผู้สร้าง (กรณีอาจารย์ต้องการดูเฉพาะงานตนเอง)
    if (my_records === 'true' && req.user) {
      query['created_by.user_id'] = req.user._id;
    }

    const records = await AunqaRecord.find(query)
      .populate('criteria_id')
      .populate('course_id')
      .populate('evidences.file_id')
      .sort({ updatedAt: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลบันทึก AUN-QA ได้', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 2. ดึงข้อมูลบันทึก AUN-QA ตามรหัส ID
// -----------------------------------------------------------------------------
const getRecordById = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await AunqaRecord.findById(id)
      .populate('criteria_id')
      .populate('course_id')
      .populate('evidences.file_id');

    if (!record) {
      return res.status(404).json({ message: 'ไม่พบบันทึกข้อมูล AUN-QA' });
    }

    res.json(record);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลบันทึก', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 3. บันทึกข้อมูลรายงาน SAR (อาจารย์บันทึกแบบร่าง Draft หรือส่งตรวจ Submitted)
// -----------------------------------------------------------------------------
const saveRecord = async (req, res) => {
  try {
    const { criteria_id, course_id, academic_year, description, status, evidences } = req.body;

    if (!criteria_id || !course_id || !academic_year) {
      return res.status(400).json({ message: 'กรุณาระบุเกณฑ์ หลักสูตร และปีการศึกษา' });
    }

    // ตรวจสอบว่ามีบันทึกของเกณฑ์ข้อนี้ในปีการศึกษานี้อยู่แล้วหรือไม่
    let record = await AunqaRecord.findOne({ criteria_id, academic_year });

    if (!record) {
      // สร้างรายการบันทึกใหม่
      record = new AunqaRecord({
        criteria_id,
        course_id,
        academic_year,
        description: description || '',
        status: status || 'draft',
        created_by: {
          user_id: req.user._id,
          full_name: req.user.full_name
        },
        evidences: evidences || []
      });

      if (status === 'submitted') {
        record.review_history.push({
          action: 'submitted',
          comment: 'ส่งรายงานเพื่อขอรับการประเมิน',
          reviewed_by: { user_id: req.user._id, full_name: req.user.full_name },
          reviewed_date: new Date()
        });
      }
    } else {
      // กรณีมีบันทึกเดิมอยู่แล้ว: หากได้รับการยืนยันแล้ว เฉพาะกรรมการหรือแอดมินเท่านั้นที่แก้ไขได้
      if (record.status === 'confirmed' && req.userRole !== 'ผู้ดูแลระบบ' && req.userRole !== 'ผู้รับผิดชอบ AUN-QA') {
        return res.status(400).json({ message: 'รายการนี้ได้รับการยืนยันผลแล้ว ไม่สามารถแก้ไขได้' });
      }

      if (description !== undefined) record.description = description;
      if (evidences) record.evidences = evidences;

      // จัดการการเปลี่ยนสถานะและการบันทึกประวัติการส่งงาน
      if (status === 'submitted') {
        const wasReturned = record.status === 'returned';
        record.status = 'submitted';
        record.review_history.push({
          action: 'submitted',
          comment: wasReturned ? 'แก้ไขข้อมูล/แนบหลักฐานใหม่และส่งตรวจซ้ำ' : 'ส่งรายงานเพื่อขอรับการประเมิน',
          reviewed_by: { user_id: req.user._id, full_name: req.user.full_name },
          reviewed_date: new Date()
        });
      } else if (status === 'draft') {
        if (record.status !== 'returned') {
          record.status = 'draft';
        }
      }
    }

    await record.save();

    // บันทึก Log กิจกรรมลงใน system_logs
    await logAction(
      req.user._id,
      status === 'submitted' ? 'SUBMIT_RECORD' : 'SAVE_RECORD',
      'aunqa_records',
      record._id,
      `บันทึกข้อมูล AUN-QA (สถานะ: ${record.status})`,
      req
    );

    const populated = await AunqaRecord.findById(record._id)
      .populate('criteria_id')
      .populate('course_id')
      .populate('evidences.file_id');

    res.json({ message: 'บันทึกข้อมูลสำเร็จ', record: populated });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถบันทึกข้อมูลได้', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 4. ตรวจสอบรายงาน (ผู้รับผิดชอบ AUN-QA สั่ง Confirm หรือ Return with comment)
//    ตามแผนผังภาพที่ 3: ผู้รับผิดชอบ AUN-QA ตรวจสอบข้อมูล -> ยืนยันสถานะ หรือ สั่งส่งกลับให้อาจารย์แก้หลักฐานใหม่
// -----------------------------------------------------------------------------
const reviewRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, review_comment } = req.body; // action: 'confirmed' หรือ 'returned'

    if (!['confirmed', 'returned'].includes(action)) {
      return res.status(400).json({ message: 'คำสั่งประเมินไม่ถูกต้อง (ต้องเป็น confirmed หรือ returned)' });
    }

    // กรณีส่งกลับแก้ไข ต้องระบุเหตุผลหรือหลักฐานที่ต้องการเพิ่ม
    if (action === 'returned' && (!review_comment || !review_comment.trim())) {
      return res.status(400).json({ message: 'กรุณาระบุความคิดเห็นหรือข้อเสนอแนะในการส่งกลับเพื่อแก้ไข' });
    }

    const record = await AunqaRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'ไม่พบบันทึกข้อมูล AUN-QA' });
    }

    record.status = action;
    record.review_comment = review_comment || '';
    record.reviewed_by = {
      user_id: req.user._id,
      full_name: req.user.full_name
    };
    record.reviewed_date = new Date();

    if (action === 'confirmed') {
      record.confirmed_by = {
        user_id: req.user._id,
        full_name: req.user.full_name
      };
      record.confirmed_date = new Date();
    } else {
      record.confirmed_by = null;
      record.confirmed_date = null;
    }

    // เพิ่มข้อมูลลงในประวัติการตรวจ (review_history)
    record.review_history.push({
      action: action,
      comment: review_comment || (action === 'confirmed' ? 'ยืนยันผลการประเมินสำเร็จ' : 'ส่งกลับเพื่อแก้ไข'),
      reviewed_by: {
        user_id: req.user._id,
        full_name: req.user.full_name
      },
      reviewed_date: new Date()
    });

    await record.save();

    await logAction(
      req.user._id,
      action === 'confirmed' ? 'CONFIRM_RECORD' : 'RETURN_RECORD',
      'aunqa_records',
      record._id,
      `ผลการตรวจ AUN-QA: ${action} โดย ${req.user.full_name}`,
      req
    );

    const populated = await AunqaRecord.findById(record._id)
      .populate('criteria_id')
      .populate('course_id')
      .populate('evidences.file_id');

    res.json({
      message: action === 'confirmed' ? 'ยืนยันสถานะการบันทึกข้อมูลเรียบร้อยแล้ว' : 'ส่งกลับให้อาจารย์แก้ไขหลักฐานใหม่เรียบร้อยแล้ว',
      record: populated
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการประเมิน', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 5. แนบหลักฐานอ้างอิงเพิ่มเติมในบันทึก
// -----------------------------------------------------------------------------
const addEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const { evidence_type, file_id, text, url } = req.body;

    const record = await AunqaRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'ไม่พบบันทึกข้อมูล' });
    }

    const newEvidence = {
      evidence_id: 'ev-' + Date.now(),
      evidence_type,
      file_id: file_id || null,
      text: text || '',
      url: url || '',
      uploaded_by: {
        user_id: req.user._id,
        full_name: req.user.full_name
      },
      uploaded_date: new Date()
    };

    record.evidences.push(newEvidence);
    await record.save();

    const populated = await AunqaRecord.findById(id)
      .populate('criteria_id')
      .populate('course_id')
      .populate('evidences.file_id');

    res.json({ message: 'เพิ่มหลักฐานอ้างอิงสำเร็จ', record: populated });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถเพิ่มหลักฐานได้', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 6. ลบหลักฐานอ้างอิงออกจากบันทึก
// -----------------------------------------------------------------------------
const removeEvidence = async (req, res) => {
  try {
    const { id, evidenceId } = req.params;
    const record = await AunqaRecord.findById(id);
    if (!record) {
      return res.status(404).json({ message: 'ไม่พบบันทึกข้อมูล' });
    }

    record.evidences = record.evidences.filter(e => e.evidence_id !== evidenceId);
    await record.save();

    const populated = await AunqaRecord.findById(id)
      .populate('criteria_id')
      .populate('course_id')
      .populate('evidences.file_id');

    res.json({ message: 'ลบหลักฐานสำเร็จ', record: populated });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบหลักฐานได้', error: error.message });
  }
};

// -----------------------------------------------------------------------------
// 7. คำนวณสถิติภาพรวมและการติดตามความก้าวหน้า (Dashboard & Tracking Stats)
// -----------------------------------------------------------------------------
const getDashboardStats = async (req, res) => {
  try {
    const { course_id, academic_year } = req.query;
    let matchQuery = {};
    if (course_id) matchQuery.course_id = course_id;
    if (academic_year) matchQuery.academic_year = academic_year;

    // นับจำนวนข้อเกณฑ์ทั้งหมดในขอบเขตนี้
    let criteriaQuery = {};
    if (course_id) criteriaQuery.course_id = course_id;
    if (academic_year) criteriaQuery.academic_year = academic_year;
    const totalCriteria = await Criteria.countDocuments(criteriaQuery);

    // แยกจำนวนตามสถานะ
    const records = await AunqaRecord.find(matchQuery);
    const draftCount = records.filter(r => r.status === 'draft').length;
    const submittedCount = records.filter(r => r.status === 'submitted').length;
    const returnedCount = records.filter(r => r.status === 'returned').length;
    const confirmedCount = records.filter(r => r.status === 'confirmed').length;
    const recordedCriteriaIds = new Set(records.map(r => String(r.criteria_id)));
    const notStartedCount = Math.max(0, totalCriteria - recordedCriteriaIds.size);

    const totalEvidences = records.reduce((sum, r) => sum + (r.evidences?.length || 0), 0);

    res.json({
      totalCriteria,
      recordedCount: records.length,
      notStartedCount,
      draftCount,
      submittedCount,
      returnedCount,
      confirmedCount,
      totalEvidences,
      // คำนวณอัตราความสำเร็จเป็นเปอร์เซ็นต์ (เกณฑ์ที่ confirmed แล้ว)
      completionRate: totalCriteria > 0 ? Math.round((confirmedCount / totalCriteria) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถประมวลผลสถิติได้', error: error.message });
  }
};

module.exports = {
  getRecords,
  getRecordById,
  saveRecord,
  reviewRecord,
  addEvidence,
  removeEvidence,
  getDashboardStats
};
