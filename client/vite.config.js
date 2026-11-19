/**
 * ==============================================================================
 * ไฟล์: client/vite.config.js
 * หน้าที่: การตั้งค่า Vite Build Tool และ Development Server ของฝั่ง Frontend
 * รายละเอียด:
 *  - plugins: ใช้ @vitejs/plugin-react เพื่อรองรับ JSX และ Fast Refresh
 *  - server.port: กำหนดให้ Frontend รันที่ Port 3000
 *  - server.proxy: ส่งต่อคำขอ (Reverse Proxy) /api และ /uploads ไปยัง Backend (Port 5001)
 *    เพื่อป้องกันปัญหา CORS และทำให้เรียกใช้งานผ่าน URL สัมพัทธ์ได้สะดวก
 * ==============================================================================
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // อนุญาตให้เชื่อมต่อผ่าน IP ในวงเครือข่าย LAN/Wi-Fi เดียวกันได้
    port: 3000, // พอร์ตสำหรับ Frontend Client
    proxy: {
      // ส่งต่อการเรียก REST API ไปยังเซิร์ฟเวอร์ Backend
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true
      },
      // ส่งต่อการเรียกดูรูปภาพหรือดาวน์โหลดไฟล์หลักฐาน
      '/uploads': {
        target: 'http://localhost:5001',
        changeOrigin: true
      }
    }
  }
});
