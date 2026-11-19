/**
 * ==============================================================================
 * ไฟล์: client/src/components/Navbar.jsx
 * หน้าที่: แถบเมนูด้านบนของระบบ (Navigation Bar)
 * รายละเอียดการทำงาน:
 *  - แสดงโลโก้และชื่อระบบ: "ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิง AUN-QA V4.0"
 *  - แสดงชื่อสาขาและคณะ (สาขาเทคโนโลยีคอมพิวเตอร์ • คณะวิทยาศาสตร์และเทคโนโลยี)
 *  - ปุ่มสลับธีมสี <ThemeSelector />
 *  - แสดงชื่อผู้ใช้ปัจจุบันและป้ายบทบาท (Role Badge)
 *  - ปุ่มออกจากระบบ (Logout)
 * ==============================================================================
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, LogOut, Shield, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeSelector from './ThemeSelector';
import logoImg from '../assets/logo.png';

const Navbar = () => {
  const { user, logout, isAdmin, isReviewer, isLecturer } = useAuth();
  const { theme } = useTheme();

  // ป้ายแสดงบทบาทของผู้ใช้ปัจจุบัน
  const getRoleBadge = () => {
    if (isAdmin) {
      return (
        <span className="bg-emerald-600 text-white text-xs px-2.5 py-0.5 rounded-md font-bold shadow-xs">
          ผู้ดูแลระบบ (Admin)
        </span>
      );
    }
    if (isReviewer) {
      return (
        <span className="bg-purple-600 text-white text-xs px-2.5 py-0.5 rounded-md font-bold shadow-xs">
          ผู้รับผิดชอบ AUN-QA
        </span>
      );
    }
    return (
      <span className="bg-blue-600 text-white text-xs px-2.5 py-0.5 rounded-md font-bold shadow-xs">
        อาจารย์ผู้รับผิดชอบ
      </span>
    );
  };

  return (
    <header className={`${theme.navbar} sticky top-0 z-30 shadow-xs transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 min-h-20 py-2.5 flex items-center justify-between">
        {/* โลโก้และชื่อระบบ */}
        <Link to="/dashboard" className="flex items-center gap-3 group">
          <div className="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center flex-shrink-0">
            <img src={logoImg} alt="โลโก้ระบบ" className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-900 tracking-tight">
                ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิง
              </span>
              <span className="bg-blue-600 text-white text-[11px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide shadow-xs">
                AUN-QA V4.0
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 hidden sm:block">
              สาขาเทคโนโลยีคอมพิวเตอร์ • คณะวิทยาศาสตร์และเทคโนโลยี
            </p>
          </div>
        </Link>

        {/* ส่วนข้อมูลผู้ใช้ ปุ่มเปลี่ยนธีม และปุ่มออกจากระบบ */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* ปุ่มเปลี่ยนธีมสีด่วน */}
          <ThemeSelector />

          {user && (
            <>
              {/* ข้อมูลโปรไฟล์ผู้ใช้ */}
              <Link
                to="/profile"
                className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-300 shadow-xs"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-400 flex items-center justify-center text-blue-700 font-bold">
                  <User className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.full_name}
                  </div>
                  <div className="mt-0.5">{getRoleBadge()}</div>
                </div>
              </Link>

              {/* ปุ่มออกจากระบบ */}
              <button
                onClick={logout}
                title="ออกจากระบบ"
                className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 hover:border-red-600 rounded-xl font-bold text-xs transition shadow-xs"
              >
                <LogOut className="w-4 h-4 stroke-[2.2]" />
                <span className="hidden sm:inline">ออกจากระบบ</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
