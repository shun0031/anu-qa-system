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

  try {
    // 1. พยายามเชื่อมต่อไปยัง MongoDB เครื่องจริง
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500 // หน่วงเวลารอ 2.5 วินาทีหากเชื่อมต่อไม่ได้
    });
    console.log(`Connected to MongoDB at ${uri}`);
    return true;
  } catch (err) {
    // 2. กรณีเชื่อมต่อไม่สำเร็จ -> ใช้ In-Memory MongoDB Fallback
    console.warn(`Local/Remote MongoDB not available (${err.message}). Initializing MongoMemoryServer fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      const memoryUri = mongod.getUri();
      await mongoose.connect(memoryUri);
      console.log(`Connected to In-Memory MongoDB at ${memoryUri}`);
      return true;
    } catch (memErr) {
      console.error('Failed to start MongoMemoryServer fallback:', memErr);
      throw memErr;
    }
  }
};

module.exports = connectDB;
