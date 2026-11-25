/**
 * ==============================================================================
 * ไฟล์: server/server.js
 * หน้าที่: จุดเริ่มต้นหลักของ Backend Server (Main Entry Point)
 * รายละเอียดการทำงาน:
 *  1. โหลด Environment Variables จากไฟล์ .env
 *  2. กำหนดค่า Express Application
 *  3. ตั้งค่า Middleware พื้นฐาน (CORS, JSON Parser, Static Folder สำหรับไฟล์อัปโหลด)
 *  4. เชื่อมต่อฐานข้อมูล MongoDB (พร้อม Fallback In-Memory หากเครื่องไม่มี MongoDB)
 *  5. Seed ข้อมูลเริ่มต้น (ผู้ใช้ 3 บทบาท, เกณฑ์ AUN-QA V4.0 ทั้ง 8 หมวด)
 *  6. กำหนดเส้นทาง API (API Routes) และเริ่มต้นการทำงานของเซิร์ฟเวอร์ (Listen Port)
 * ==============================================================================
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// นำเข้าโมดูลเชื่อมต่อฐานข้อมูลและการ Seed ข้อมูล
const connectDB = require('./config/db');
const seedInitialData = require('./config/seedData');
const { saveDbToFile } = require('./utils/dbStorage');

// นำเข้า Routing แต่ละโมดูลตามฟังก์ชันระบบ
const authRoutes = require('./routes/authRoutes');       // ระบบเข้าสู่ระบบ ยืนยันตัวตน และข้อมูลโปรไฟล์
const userRoutes = require('./routes/userRoutes');       // การจัดการผู้ใช้งานและรีเซ็ตรหัสผ่าน (Admin)
const courseRoutes = require('./routes/courseRoutes');   // การจัดการหลักสูตรและสาขาวิชา
const criteriaRoutes = require('./routes/criteriaRoutes'); // การจัดการเกณฑ์ AUN-QA แต่ละปีการศึกษา
const recordRoutes = require('./routes/recordRoutes');   // การบันทึก SAR, แนบหลักฐาน และการตรวจประเมิน
const fileRoutes = require('./routes/fileRoutes');       // การอัปโหลด ดาวน์โหลด และจัดการไฟล์หลักฐาน
const logRoutes = require('./routes/logRoutes');         // ประวัติการใช้งานระบบ (System Audit Logs)

const app = express();
const PORT = process.env.PORT || 5001; // พอร์ตเริ่มต้นของ Backend API

// -----------------------------------------------------------------------------
// ตั้งค่า Middlewares
// -----------------------------------------------------------------------------
app.use(cors()); // อนุญาตให้ Frontend (เช่น localhost:3000) สามารถเรียกใช้ API ได้ข้ามโดเมน
app.use(express.json({ limit: '50mb' })); // รองรับ Request Body แบบ JSON สูงสุด 50MB
app.use(express.urlencoded({ extended: true, limit: '50mb' })); // รองรับ URL-encoded form data

// กำหนดโฟลเดอร์สำหรับให้บริการไฟล์ที่ถูกอัปโหลด (Static Files) เช่น ไฟล์เอกสาร และรูปภาพ
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -----------------------------------------------------------------------------
// กำหนด Endpoint ให้กับ Routes แต่ละชุด
// -----------------------------------------------------------------------------
app.use('/api/auth', authRoutes);         // เช่น POST /api/auth/login, GET /api/auth/me
app.use('/api/users', userRoutes);       // เช่น GET /api/users, POST /api/users
app.use('/api/courses', courseRoutes);   // เช่น GET /api/courses, POST /api/courses
app.use('/api/criteria', criteriaRoutes);// เช่น GET /api/criteria, POST /api/criteria/clone
app.use('/api/records', recordRoutes);   // เช่น GET /api/records, POST /api/records, PUT /api/records/:id/review
app.use('/api/files', fileRoutes);       // เช่น POST /api/files/upload, GET /api/files
app.use('/api/logs', logRoutes);         // เช่น GET /api/logs (Admin ดูประวัติการใช้งาน)

// Endpoint ตรวจสอบสถานะการทำงานของ Server (Health Check)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'AUN-QA Version 4.0 Backend API is running smoothly',
    timestamp: new Date()
  });
});

// ให้บริการ Frontend Static Files เมื่อรันบน Production (เช่น Render / Cloud Server)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
  });
}

// Middleware สำหรับจัดการ Error ส่วนกลาง (Global Error Handler)
app.use((err, req, res, next) => {
  console.error('Server error handler:', err);
  res.status(err.status || 500).json({
    message: err.message || 'เกิดข้อผิดพลาดภายในระบบ',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// -----------------------------------------------------------------------------
// ฟังก์ชันเริ่มต้นการทำงานของเซิร์ฟเวอร์
// -----------------------------------------------------------------------------
const startServer = async () => {
  try {
    // 1. เชื่อมต่อฐานข้อมูล MongoDB
    await connectDB();

    // 2. ตรวจสอบและสร้างข้อมูลเริ่มต้น (ผู้ใช้งานเริ่มต้น 3 บทบาท และเกณฑ์ AUN-QA V4.0)
    await seedInitialData();

    // 3. เริ่มต้นรับ Request ตาม Port ที่กำหนด
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`🚀 AUN-QA Server running on port ${PORT}`);
      console.log(`🔗 API Base: http://localhost:${PORT}/api`);
      console.log(`====================================================`);
    });

    // สำรองข้อมูลลงฮาร์ดดิสก์สม่ำเสมอทุก 60 วินาที เพื่อป้องกันข้อมูลหายเมื่อรันแบบ In-Memory
    setInterval(() => {
      saveDbToFile().catch(() => {});
    }, 60000);

    // บันทึกลงดิสก์ทันทีก่อนปิดเซิร์ฟเวอร์
    process.on('SIGINT', async () => {
      await saveDbToFile();
      process.exit(0);
    });
    process.on('SIGTERM', async () => {
      await saveDbToFile();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
