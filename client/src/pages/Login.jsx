/**
 * ==============================================================================
 * ไฟล์: client/src/pages/Login.jsx
 * หน้าที่: หน้าจอเข้าสู่ระบบทางการ (Official Login Portal)
 * ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิงตามเกณฑ์ AUN-QA Version 4.0
 * สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล คณะวิทยาศาสตร์และเทคโนโลยี
 * ==============================================================================
 */

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Eye, EyeOff, HelpCircle } from 'lucide-react';
import ThemeSelector from '../components/ThemeSelector';
import logoImg from '../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col justify-center py-8 px-4 sm:py-12 sm:px-6 lg:px-8 transition-colors duration-200 relative`}>
      {/* ปุ่มสลับธีมมุมขวาบน */}
      <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-10">
        <ThemeSelector />
      </div>

      {/* ส่วนหัว: โลโก้สถาบันและชื่อระบบทางการ */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-4 sm:mb-5">
          <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 flex items-center justify-center p-2 transition-transform duration-300 hover:scale-105">
            <img src={logoImg} alt="โลโก้ระบบ" className="w-full h-full object-contain drop-shadow-xl" />
          </div>
        </div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิง
        </h1>
        <div className="mt-1.5 inline-flex items-center gap-1.5 bg-blue-600 text-white font-black text-xs px-3.5 py-1 rounded-full shadow-xs">
          <span>ตามเกณฑ์ AUN-QA Version 4.0</span>
        </div>
        <p className="mt-2 text-xs sm:text-sm font-semibold text-slate-600">
          สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล • คณะวิทยาศาสตร์และเทคโนโลยี
        </p>
      </div>

      {/* การ์ดแบบฟอร์มเข้าสู่ระบบ */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-9 shadow-2xl rounded-3xl border-2 border-slate-200 backdrop-blur-sm">
          <div className="mb-6 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900">เข้าสู่ระบบ</h2>
              <p className="text-xs font-semibold text-slate-500 mt-0.5">ระบุบัญชีผู้ใช้เพื่อเข้าจัดการข้อมูล</p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <ShieldCheck className="w-5 h-5 stroke-[2.2]" />
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 text-xs font-bold text-rose-950 bg-rose-50 border-2 border-rose-400 rounded-2xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {/* ฟิลด์ชื่อผู้ใช้ */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                ชื่อผู้ใช้งาน (Username) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="เช่น somchai.j หรือ admin"
                  className="block w-full pl-10 pr-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition bg-slate-50/50 hover:bg-white"
                />
              </div>
            </div>

            {/* ฟิลด์รหัสผ่าน */}
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                รหัสผ่าน (Password) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ระบุรหัสผ่านของคุณ"
                  className="block w-full pl-10 pr-11 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-3 focus:ring-blue-100 transition bg-slate-50/50 hover:bg-white"
                />
                {/* ปุ่มเปิด/ปิดการแสดงรหัสผ่าน */}
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition focus:outline-none"
                  title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ปุ่มกดเข้าสู่ระบบ */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* ส่วนข้อมูลติดต่อและช่วยเหลือผู้ใช้งาน */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600">
              <HelpCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed font-semibold">
                <span>หากลืมรหัสผ่าน หรือต้องการเปิดสิทธิ์การใช้งานใหม่</span>
                <span className="block text-slate-500 font-normal mt-0.5">
                  กรุณาติดต่อผู้ดูแลระบบ (Admin) สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล
                </span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <span className="text-[11px] font-bold text-slate-400 inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                ระบบจัดเก็บข้อมูลบนคลาวด์ถาวรตามมาตรฐานความปลอดภัย
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
