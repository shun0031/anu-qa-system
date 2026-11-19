/**
 * ==============================================================================
 * ไฟล์: server/controllers/fileController.js
 * หน้าที่: Controller สำหรับจัดการไฟล์หลักฐาน (File Upload & Management)
 * อ้างอิงตามแผนผังภาพที่ 3 ฝั่งผู้ดูแลระบบ (Admin):
 *  - ตรวจสอบจัดการไฟล์ทั้งหมด (ดูไฟล์, ดาวน์โหลดไฟล์, ลบไฟล์ออกจากระบบและดิสก์)
 * ==============================================================================
 */

const path = require('path');
const fs = require('fs');
const FileRecord = require('../models/FileRecord');
const { logAction } = require('../middleware/logger');

// 1. รับไฟล์อัปโหลดและบันทึกลงฐานข้อมูล (Upload File Handler)
const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'กรุณาเลือกไฟล์ที่ต้องการอัปโหลด' });
    }

    const { originalname, filename, path: filePath, mimetype, size } = req.file;

    // จำแนกประเภทไฟล์ (เอกสาร หรือ รูปภาพ)
    let fileType = 'document';
    if (mimetype.startsWith('image/')) {
      fileType = 'image';
    }

    // บันทึก Metadata ของไฟล์ลงใน collection 'files'
    const fileRecord = await FileRecord.create({
      original_name: originalname,
      file_name: filename,
      file_path: filePath,
      file_type: fileType,
      mime_type: mimetype,
      file_size: size,
      uploaded_by: req.user._id,
      upload_date: new Date()
    });

    await logAction(
      req.user._id,
      'UPLOAD_FILE',
      'files',
      fileRecord._id,
      `อัปโหลดไฟล์หลักฐาน: ${originalname} (${(size / 1024).toFixed(1)} KB)`,
      req
    );

    const populated = await FileRecord.findById(fileRecord._id).populate('uploaded_by', 'full_name username');

    res.status(201).json({
      message: 'อัปโหลดไฟล์สำเร็จ',
      file: populated
    });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปโหลดไฟล์', error: error.message });
  }
};

// 2. ดึงรายการไฟล์ทั้งหมดในระบบ (Admin ดูรายการไฟล์)
const getFiles = async (req, res) => {
  try {
    const { search, file_type } = req.query;
    let query = {};

    if (search) {
      query.original_name = { $regex: search, $options: 'i' };
    }
    if (file_type) {
      query.file_type = file_type;
    }

    const files = await FileRecord.find(query)
      .populate('uploaded_by', 'full_name username email')
      .sort({ upload_date: -1 });

    res.json(files);
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถดึงข้อมูลรายการไฟล์ได้', error: error.message });
  }
};

// 3. ลบไฟล์ออกจากฐานข้อมูลและลบไฟล์จริงออกจากดิสก์ (Admin Delete File)
const deleteFile = async (req, res) => {
  try {
    const { id } = req.params;
    const fileRecord = await FileRecord.findById(id);

    if (!fileRecord) {
      return res.status(404).json({ message: 'ไม่พบไฟล์ที่ต้องการลบ' });
    }

    // ลบไฟล์จริงในโฟลเดอร์ uploads/
    if (fs.existsSync(fileRecord.file_path)) {
      try {
        fs.unlinkSync(fileRecord.file_path);
      } catch (err) {
        console.warn('Could not remove file on disk:', err.message);
      }
    }

    await FileRecord.findByIdAndDelete(id);

    await logAction(
      req.user._id,
      'DELETE_FILE',
      'files',
      id,
      `ลบไฟล์หลักฐาน: ${fileRecord.original_name}`,
      req
    );

    res.json({ message: 'ลบไฟล์สำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'ไม่สามารถลบไฟล์ได้', error: error.message });
  }
};

// 4. ดาวน์โหลดไฟล์หลักฐาน (Download File)
const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;
    const fileRecord = await FileRecord.findById(id);

    if (!fileRecord) {
      return res.status(404).json({ message: 'ไม่พบไฟล์' });
    }

    const absolutePath = path.resolve(fileRecord.file_path);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: 'ไฟล์ต้นฉบับไม่อยู่ในเครื่อง' });
    }

    res.download(absolutePath, fileRecord.original_name);
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์', error: error.message });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  deleteFile,
  downloadFile
};
