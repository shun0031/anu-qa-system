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

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { User, LogOut, Shield, Award, Menu, X, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import ThemeSelector from './ThemeSelector';
import logoImg from '../assets/logo.png';

const Navbar = ({ onToggleMobileMenu, isMobileMenuOpen }) => {
  const { user, logout, roles, activeRole, switchActiveRole } = useAuth();
  const { theme } = useTheme();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  // สไตล์และชื่อย่อของแต่ละบทบาท
  const getRoleInfo = (roleName) => {
    if (roleName === 'ผู้ดูแลระบบ') {
      return { label: 'ผู้ดูแลระบบ (Admin)', short: 'Admin', color: 'bg-emerald-600 text-white' };
    }
    if (roleName === 'ผู้รับผิดชอบ AUN-QA') {
      return { label: 'ผู้รับผิดชอบ AUN-QA', short: 'กรรมการ QA', color: 'bg-purple-600 text-white' };
    }
    return { label: 'อาจารย์ผู้รับผิดชอบ', short: 'อาจารย์', color: 'bg-blue-600 text-white' };
  };

  // ป้ายแสดงบทบาทของผู้ใช้ (รองรับ 1 บัญชีมีหลายสิทธิ์)
  const renderRoleBadges = () => {
    const list = roles && roles.length > 0 ? roles : (user?.role ? [user.role] : []);
    return (
      <div className="flex flex-wrap items-center gap-1 mt-0.5">
        {list.map((r, i) => {
          const info = getRoleInfo(r);
          return (
            <span
              key={i}
              className={`${info.color} text-[10px] px-2 py-0.5 rounded-md font-bold shadow-xs whitespace-nowrap`}
              title={info.label}
            >
              {list.length > 1 ? info.short : info.label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <header className={`${theme.navbar} sticky top-0 z-30 shadow-xs transition-colors duration-200`}>
      <div className="w-full px-4 sm:px-6 lg:px-8 min-h-16 sm:min-h-20 py-2 flex items-center justify-between gap-2">
        {/* ฝั่งซ้าย: ปุ่มเปิดเมนูมือถือ + โลโก้และชื่อระบบ */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* ปุ่ม Hamburger Menu สำหรับจอมือถือ (แสดงเฉพาะหน้าจอขนาดเล็ก) */}
          {user && (
            <button
              onClick={onToggleMobileMenu}
              className="p-2 -ml-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl md:hidden transition focus:outline-none flex-shrink-0"
              title="เปิด/ปิดเมนู"
              aria-label="เมนูหลัก"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <Menu className="w-6 h-6 stroke-[2.5]" />
              )}
            </button>
          )}

          {/* โลโก้และชื่อระบบ */}
          <Link to="/dashboard" className="flex items-center gap-2 sm:gap-3 group min-w-0">
            <div className="w-9 h-9 sm:w-12 sm:h-12 md:w-14 md:h-14 flex items-center justify-center flex-shrink-0">
              <img src={logoImg} alt="โลโก้ระบบ" className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-base lg:text-lg text-slate-900 tracking-tight truncate max-w-[150px] xs:max-w-[200px] sm:max-w-none">
                  ระบบจัดเก็บข้อมูลและหลักฐาน
                </span>
                <span className="bg-blue-600 text-white text-[10px] sm:text-[11px] font-black px-1.5 sm:px-2 py-0.5 rounded-md uppercase tracking-wide shadow-xs flex-shrink-0">
                  AUN-QA
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-semibold text-slate-600 hidden md:block truncate">
                สาขาเทคโนโลยีคอมพิวเตอร์ • คณะวิทยาศาสตร์และเทคโนโลยี
              </p>
            </div>
          </Link>
        </div>

        {/* ฝั่งขวา: ปุ่มเปลี่ยนธีม + ข้อมูลผู้ใช้ + ปุ่มออกจากระบบ */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* ปุ่มเปลี่ยนธีมสีด่วน */}
          <ThemeSelector />

          {user && (
            <>
              {/* ข้อมูลโปรไฟล์ผู้ใช้ */}
              <Link
                to="/profile"
                className="flex items-center gap-2 p-1.5 sm:py-1.5 sm:px-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition border border-slate-300 shadow-xs"
                title={user.full_name}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-100 border border-blue-400 flex items-center justify-center text-blue-700 font-bold flex-shrink-0">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.2]" />
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.full_name}
                  </div>
                  {renderRoleBadges()}
                </div>
              </Link>

              {/* ปุ่มสลับบทบาท (แสดงเฉพาะเมื่อบัญชีมีมากกว่า 1 สิทธิ์) */}
              {roles && roles.length > 1 && (
                <div className="relative hidden sm:block">
                  <button
                    onClick={() => setRoleMenuOpen(prev => !prev)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition shadow-xs"
                    title="คลิกเพื่อสลับมุมมองบทบาทการทำงาน"
                  >
                    <span>สลับบทบาท ({roles.length})</span>
                    <ChevronDown className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  {roleMenuOpen && (
                    <div className="absolute right-0 mt-1.5 w-60 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 text-xs">
                      <div className="font-black text-slate-700 px-2.5 py-1.5 border-b border-slate-100 text-[11px] uppercase tracking-wide">
                        สิทธิ์ที่คุณมีในบัญชีนี้ ({roles.length} สิทธิ์)
                      </div>
                      <div className="mt-1 space-y-1">
                        {roles.map((r, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              switchActiveRole(r);
                              setRoleMenuOpen(false);
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left font-bold transition ${
                              activeRole === r ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                                r === 'ผู้ดูแลระบบ' ? 'bg-emerald-500' : r === 'ผู้รับผิดชอบ AUN-QA' ? 'bg-purple-500' : 'bg-blue-500'
                              }`} />
                              <span className="truncate">{r}</span>
                            </div>
                            {activeRole === r && <Check className="w-4 h-4 text-blue-600 stroke-[3] flex-shrink-0" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ปุ่มออกจากระบบ */}
              <button
                onClick={logout}
                title="ออกจากระบบ"
                className="flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 hover:border-red-600 rounded-xl font-bold text-xs transition shadow-xs"
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
