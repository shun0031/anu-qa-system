/**
 * ==============================================================================
 * ไฟล์: client/src/context/AuthContext.jsx
 * หน้าที่: React Context สำหรับบริหารจัดการสถานะการยืนยันตัวตน (Authentication State)
 * รายละเอียดการทำงาน:
 *  1. เก็บ State ของ user, token และสถานะกำลังโหลด (loading)
 *  2. ดึงข้อมูลผู้ใช้งานเดิมจาก LocalStorage เมื่อเปิดเว็บครั้งแรก และซิงก์กับ GET /api/auth/me
 *  3. ฟังก์ชัน login: ส่ง request ไปยัง POST /api/auth/login, บันทึก token ลง LocalStorage
 *  4. ฟังก์ชัน logout: ลบ token และข้อมูลผู้ใช้ออกจาก LocalStorage
 *  5. ตัวช่วยตรวจสอบบทบาท: isAdmin, isLecturer, isReviewer
 * ==============================================================================
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // ดึงข้อมูลผู้ใช้เริ่มต้นจาก LocalStorage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // ตรวจสอบความถูกต้องของ Token กับเซิร์ฟเวอร์เมื่อเปิดหน้าเว็บ
  useEffect(() => {
    const fetchCurrentUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
          localStorage.setItem('user', JSON.stringify(res.data.user));
        } catch (err) {
          console.error('Failed to restore session:', err);
          logout();
        }
      }
      setLoading(false);
    };

    fetchCurrentUser();
  }, []);

  // ฟังก์ชันเข้าสู่ระบบ
  const login = async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    return user;
  };

  // ฟังก์ชันออกจากระบบ
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  // ฟังก์ชันอัปเดตข้อมูลผู้ใช้ใน Context เมื่อมีการแก้ไขโปรไฟล์
  const updateUser = (updatedUser) => {
    setUser(prev => ({ ...prev, ...updatedUser }));
    localStorage.setItem('user', JSON.stringify({ ...user, ...updatedUser }));
  };

  // รายชื่อบทบาททั้งหมดที่บัญชีนี้ได้รับ (รองรับ 1 บัญชีหลายสิทธิ์)
  const roles = user?.roles?.length ? user.roles : (user?.role ? [user.role] : []);

  // State สำหรับบทบาทที่กำลังเลือกใช้งานอยู่ขณะนี้ (Active Role)
  const [activeRole, setActiveRole] = useState(() => {
    return localStorage.getItem('activeRole') || null;
  });

  // ซิงค์ Active Role ให้ตรงกับสิทธิ์ที่มี
  useEffect(() => {
    if (roles.length > 0) {
      if (!activeRole || !roles.includes(activeRole)) {
        setActiveRole(roles[0]);
        localStorage.setItem('activeRole', roles[0]);
      }
    } else {
      setActiveRole(null);
      localStorage.removeItem('activeRole');
    }
  }, [user]);

  // ฟังก์ชันสลับบทบาทปัจจุบัน (Role Switcher)
  const switchActiveRole = (newRole) => {
    if (roles.includes(newRole)) {
      setActiveRole(newRole);
      localStorage.setItem('activeRole', newRole);
    }
  };

  // ตัวช่วยตรวจสอบบทบาท: ตรวจสอบว่ามีสิทธิ์นั้นๆ หรือไม่ (ไม่ว่าจะเลือก Role ไหนอยู่ก็ตาม)
  const hasRole = (roleName) => {
    if (!roleName) return false;
    return roles.some(r => r.toLowerCase() === roleName.toLowerCase());
  };

  const isAdmin = hasRole('ผู้ดูแลระบบ');
  const isLecturer = hasRole('อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์');
  const isReviewer = hasRole('ผู้รับผิดชอบ AUN-QA');

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        updateUser,
        roles,
        activeRole,
        switchActiveRole,
        hasRole,
        isAdmin,
        isLecturer,
        isReviewer
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom Hook สำหรับเรียกใช้งาน AuthContext ในหน้า Component ต่างๆ
export const useAuth = () => useContext(AuthContext);
