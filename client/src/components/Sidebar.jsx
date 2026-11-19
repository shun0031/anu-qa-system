import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  FileCheck2,
  FileText,
  UserCheck,
  FolderOpen,
  Users,
  ShieldCheck,
  GraduationCap,
  ListOrdered,
  History,
  UserCircle,
  X
} from 'lucide-react';

const Sidebar = ({ mobileOpen, onCloseMobile }) => {
  const { user, isAdmin, isLecturer, isReviewer } = useAuth();
  const { theme } = useTheme();

  const getNavClass = (themeColor = 'blue') => {
    return ({ isActive }) => {
      const base = "flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition ";
      if (isActive) {
        if (themeColor === 'purple') {
          return base + "bg-purple-600 text-white shadow-md shadow-purple-600/30";
        }
        if (themeColor === 'emerald') {
          return base + "bg-emerald-600 text-white shadow-md shadow-emerald-600/30";
        }
        return base + `${theme.sidebarActive}`;
      }
      return base + `${theme.sidebarText} ${theme.sidebarHover}`;
    };
  };

  // ส่วนแสดงรายการเมนูการนำทาง
  const navContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-6">
        {/* เมนูหลัก */}
        <div>
          <div className="px-2 text-xs font-black opacity-70 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>เมนูหลัก</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" onClick={onCloseMobile} className={getNavClass('blue')}>
              <LayoutDashboard className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
              <span>ภาพรวมระบบ (Dashboard)</span>
            </NavLink>
          </nav>
        </div>

        {/* อาจารย์ผู้ใช้งาน */}
        {(isLecturer || isAdmin) && (
          <div>
            <div className="px-2 text-xs font-black opacity-70 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>อาจารย์ผู้ใช้งาน</span>
              <span className="w-2 h-2 rounded-full bg-sky-500"></span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/my-records" onClick={onCloseMobile} className={getNavClass('blue')}>
                <FileText className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>บันทึกข้อมูลและแนบหลักฐาน</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* ผู้รับผิดชอบ AUN-QA */}
        {(isReviewer || isAdmin) && (
          <div>
            <div className="px-2 text-xs font-black opacity-70 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>ผู้รับผิดชอบ AUN-QA</span>
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/tracking" onClick={onCloseMobile} className={getNavClass('purple')}>
                <FileCheck2 className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>ติดตามการบันทึกข้อมูล</span>
              </NavLink>
              <NavLink to="/reviews" onClick={onCloseMobile} className={getNavClass('purple')}>
                <UserCheck className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>ตรวจสอบและยืนยันข้อมูล</span>
              </NavLink>
            </nav>
          </div>
        )}

        {/* การบริหารจัดการ (Admin) */}
        {isAdmin && (
          <div>
            <div className="px-2 text-xs font-black opacity-70 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>การบริหารจัดการ (Admin)</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            </div>
            <nav className="space-y-1">
              <NavLink to="/admin/users" onClick={onCloseMobile} className={getNavClass('emerald')}>
                <Users className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>จัดการผู้ใช้และรหัสผ่าน</span>
              </NavLink>
              <NavLink to="/admin/roles" onClick={onCloseMobile} className={getNavClass('emerald')}>
                <ShieldCheck className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>กำหนดสิทธิ์ใช้งาน (RBAC)</span>
              </NavLink>
              <NavLink to="/admin/courses" onClick={onCloseMobile} className={getNavClass('emerald')}>
                <GraduationCap className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>จัดการหลักสูตรและสาขา</span>
              </NavLink>
              <NavLink to="/admin/criteria" onClick={onCloseMobile} className={getNavClass('emerald')}>
                <ListOrdered className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>แก้ไขเกณฑ์แต่ละปี</span>
              </NavLink>
              <NavLink to="/admin/files" onClick={onCloseMobile} className={getNavClass('emerald')}>
                <FolderOpen className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>ตรวจสอบจัดการไฟล์</span>
              </NavLink>
              <NavLink to="/admin/logs" onClick={onCloseMobile} className={getNavClass('emerald')}>
                <History className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>ประวัติระบบ (Audit Logs)</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* โปรไฟล์ส่วนล่าง */}
      <div className="pt-4 border-t border-black/10">
        <NavLink to="/profile" onClick={onCloseMobile} className={getNavClass('blue')}>
          <UserCircle className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
          <span>ข้อมูลส่วนบุคคล (Profile)</span>
        </NavLink>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. เมนูแบบปกติสำหรับ Desktop (หน้าจอ md ขึ้นไป) */}
      <aside className={`hidden md:flex md:w-64 ${theme.sidebar} min-h-[calc(100vh-5rem)] p-4 flex-col justify-between shadow-xs transition-colors duration-200 flex-shrink-0`}>
        {navContent}
      </aside>

      {/* 2. เมนู Drawer แบบสไลด์สำหรับจอมือถือ (หน้าจอเล็กกว่า md) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* ฉากหลังมืด (Backdrop) เมื่อแตะจะปิดเมนู */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* แผงเมนูด้านข้างที่เลื่อนออกมา */}
          <div className={`relative z-10 w-72 max-w-[85vw] h-full ${theme.sidebar} p-5 flex flex-col justify-between shadow-2xl overflow-y-auto`}>
            {/* ส่วนหัวของ Drawer มือถือ */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-black/10">
              <span className="font-extrabold text-sm text-slate-900">
                เมนูนำทางระบบ
              </span>
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-black/5 transition"
                title="ปิดเมนู"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* เนื้อหาเมนู */}
            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
