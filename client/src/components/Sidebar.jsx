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
  UserCircle
} from 'lucide-react';

const Sidebar = () => {
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

  return (
    <aside className={`w-64 ${theme.sidebar} min-h-[calc(100vh-4.5rem)] p-4 flex flex-col justify-between shadow-xs transition-colors duration-200`}>
      <div className="space-y-6">
        {/* เมนูหลัก */}
        <div>
          <div className="px-2 text-xs font-black opacity-70 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>เมนูหลัก</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <nav className="space-y-1">
            <NavLink to="/dashboard" className={getNavClass('blue')}>
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
              <NavLink to="/my-records" className={getNavClass('blue')}>
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
              <NavLink to="/tracking" className={getNavClass('purple')}>
                <FileCheck2 className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>ติดตามการบันทึกข้อมูล</span>
              </NavLink>
              <NavLink to="/reviews" className={getNavClass('purple')}>
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
              <NavLink to="/admin/users" className={getNavClass('emerald')}>
                <Users className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>จัดการผู้ใช้และรหัสผ่าน</span>
              </NavLink>
              <NavLink to="/admin/roles" className={getNavClass('emerald')}>
                <ShieldCheck className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>กำหนดสิทธิ์ใช้งาน (RBAC)</span>
              </NavLink>
              <NavLink to="/admin/courses" className={getNavClass('emerald')}>
                <GraduationCap className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>จัดการหลักสูตรและสาขา</span>
              </NavLink>
              <NavLink to="/admin/criteria" className={getNavClass('emerald')}>
                <ListOrdered className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>แก้ไขเกณฑ์แต่ละปี</span>
              </NavLink>
              <NavLink to="/admin/files" className={getNavClass('emerald')}>
                <FolderOpen className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>ตรวจสอบจัดการไฟล์</span>
              </NavLink>
              <NavLink to="/admin/logs" className={getNavClass('emerald')}>
                <History className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
                <span>ประวัติระบบ (Audit Logs)</span>
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* โปรไฟล์ส่วนล่าง */}
      <div className="pt-4 border-t border-black/10">
        <NavLink to="/profile" className={getNavClass('blue')}>
          <UserCircle className="w-5 h-5 stroke-[2.2] flex-shrink-0" />
          <span>ข้อมูลส่วนบุคคล (Profile)</span>
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
