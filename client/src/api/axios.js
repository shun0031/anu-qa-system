/**
 * ==============================================================================
 * ไฟล์: client/src/api/axios.js
 * หน้าที่: การตั้งค่า Axios Instance สำหรับเรียกใช้งาน REST API ของเซิร์ฟเวอร์
 * รายละเอียดการทำงาน:
 *  1. กำหนด baseURL เป็น '/api' (เชื่อมต่อผ่าน Vite Proxy ไปยัง Backend)
 *  2. Request Interceptor: แนบ JWT Token จาก LocalStorage เข้าสู่ Authorization Header อัตโนมัติ
 *  3. Response Interceptor: ดักจับกรณี Token หมดอายุ (HTTP Status 401)
 *     เพื่อเคลียร์ session และนำผู้ใช้กลับสู่หน้า Login อัตโนมัติ
 * ==============================================================================
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api' // เรียกผ่าน Vite Proxy
});

// Request Interceptor: แนบ Token เข้าไปในทุกคำขอที่ส่งออกไป
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: จัดการกรณีเซสชันหมดอายุ (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
