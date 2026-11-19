/**
 * ==============================================================================
 * ไฟล์: server/middleware/upload.js
 * หน้าที่: Middleware สำหรับจัดการการรับและจัดเก็บไฟล์อัปโหลด (File Upload Handler)
 * อ้างอิงตามสถาปัตยกรรมระบบในภาพที่ 1:
 *  - รับไฟล์เอกสาร (PDF, Word, Excel, PowerPoint, ZIP)
 *  - รับไฟล์รูปภาพ (JPG, JPEG, PNG, GIF, WEBP)
 *  - กำหนดขนาดไฟล์สูงสุด 50MB
 *  - สร้างชื่อไฟล์ที่ปลอดภัยและไม่ซ้ำกันด้วย Timestamp
 * ==============================================================================
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ตรวจสอบและสร้างโฟลเดอร์ uploads/ อัตโนมัติหากยังไม่มี
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// กำหนดที่จัดเก็บและการตั้งชื่อไฟล์
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // บันทึกลงโฟลเดอร์ uploads/
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // แปลงชื่อไฟล์ให้ปลอดภัย รองรับภาษาไทยและอักขระพื้นฐาน
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.\u0E00-\u0E7F_-]/g, '_');
    cb(null, `${uniqueSuffix}-${safeName}`);
  }
});

// กรองประเภทไฟล์ที่อนุญาตให้อัปโหลด
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /jpeg|jpg|png|gif|webp|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|zip|rar/i;
  const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
  
  if (allowedExtensions.test(ext)) {
    cb(null, true); // นามสกุลถูกต้อง อนุญาตให้อัปโหลด
  } else {
    cb(new Error(`ประเภทไฟล์ .${ext} ไม่อนุญาตให้อัปโหลดในระบบ`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // ขนาดสูงสุด 50 Megabytes
});

module.exports = upload;
