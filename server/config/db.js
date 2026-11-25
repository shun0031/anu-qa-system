/**
 * ==============================================================================
 * ไฟล์: server/config/db.js
 * หน้าที่: การเชื่อมต่อฐานข้อมูล MongoDB สำหรับระบบ AUN-QA
 * รายละเอียดการทำงาน:
 *  1. พยายามเชื่อมต่อไปยัง MongoDB ปลายทางตามค่าใน process.env.MONGODB_URI ก่อน
 *     (เช่น MongoDB Compass, Local MongoDB Service, หรือ MongoDB Atlas Cloud)
 *  2. หากไม่สามารถเชื่อมต่อได้ (เช่น เครื่องไม่ได้ติดตั้ง MongoDB หรือยังไม่ได้เปิด Service)
 *     ระบบจะเริ่มต้นทำงาน "MongoMemoryServer" แบบ In-Memory ให้โดยอัตโนมัติ (Fallback)
 *     ทำให้สามารถเปิดรันโปรเจกต์ได้ทันที 100% โดยไม่ต้องกังวลเรื่องการติดตั้งฐานข้อมูล
 * ==============================================================================
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  // อ่าน URI จาก .env หรือใช้ default localhost:27017
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/aun_qa_db';
  const isAtlas = uri.includes('mongodb+srv') || uri.includes('mongodb.net');
  // หากเป็น MongoDB Atlas ให้เวลารอเชื่อมต่อ 15 วินาที (หากเป็น localhost ให้รอ 2.5 วินาที)
  const timeoutMs = isAtlas ? 15000 : 2500;

  try {
    // 1. พยายามเชื่อมต่อไปยัง MongoDB เครื่องจริง หรือ MongoDB Atlas
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: timeoutMs
    });
    console.log(`✅ [Database] Connected successfully to ${isAtlas ? 'MongoDB Atlas (Cloud Cluster)' : uri}`);
    return true;
  } catch (err) {
    // 2. กรณีเชื่อมต่อไม่สำเร็จ -> ใช้ In-Memory MongoDB Fallback พร้อมแจ้งเตือนชัดเจน
    console.warn(`⚠️ [Database Warning] Failed to connect to ${isAtlas ? 'MongoDB Atlas' : uri} (${err.message})`);
    console.warn(`⚠️ Fallback: Initializing MongoMemoryServer in RAM...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`ℹ️ [Database] Connected to In-Memory MongoDB at ${memoryUri}`);
      return true;
    } catch (memErr) {
      console.error('❌ Failed to start MongoMemoryServer fallback:', memErr);
      throw memErr;
    }
  }
};

module.exports = connectDB;
