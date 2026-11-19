import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { Lock, User, AlertCircle, ArrowRight, ShieldCheck, Check } from 'lucide-react';
import ThemeSelector from '../components/ThemeSelector';
import logoImg from '../assets/logo.png';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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

  const handleQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col justify-center py-10 sm:px-6 lg:px-8 transition-colors duration-200`}>
      {/* Top right theme switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeSelector />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-5">
          <div className="w-40 h-40 sm:w-48 sm:h-48 flex items-center justify-center p-2 transition-transform duration-300 hover:scale-105">
            <img src={logoImg} alt="โลโก้ระบบ" className="w-full h-full object-contain drop-shadow-xl" />
          </div>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิง
        </h1>
        <div className="mt-1 inline-block bg-blue-600 text-white font-bold text-xs px-3 py-1 rounded-full shadow-xs">
          ตามเกณฑ์ AUN-QA Version 4.0
        </div>
        <p className="mt-2 text-xs font-semibold text-slate-600">
          สาขาเทคโนโลยีคอมพิวเตอร์ • คณะวิทยาศาสตร์และเทคโนโลยี
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-5 sm:px-8 shadow-xl rounded-3xl border-2 border-slate-200">
          {error && (
            <div className="mb-5 flex items-center gap-2 p-3.5 text-sm font-bold text-red-900 bg-red-100 border-2 border-red-400 rounded-xl">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-700" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                ชื่อผู้ใช้งาน (Username) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ระบุชื่อผู้ใช้งาน"
                  className="block w-full pl-11 pr-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1.5">
                รหัสผ่าน (Password) <span className="text-red-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ระบุรหัสผ่าน"
                  className="block w-full pl-11 pr-3 py-2.5 border-2 border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-200 transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 flex justify-center items-center gap-2 py-3 px-4 rounded-xl shadow-md text-sm font-black text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 transition disabled:opacity-50"
            >
              {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </form>

          {/* Quick Demo Logins */}
          <div className="mt-6 pt-5 border-t-2 border-slate-200">
            <div className="text-xs font-black text-slate-700 mb-2.5 text-center uppercase tracking-wide">
              ⚡ เลือกบทบาททดสอบ (Quick Login)
            </div>
            <div className="space-y-2">
              {/* Role 1: Lecturer */}
              <button
                type="button"
                onClick={() => handleQuickLogin('lecturer', 'lecturer123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-blue-400 bg-blue-50/80 hover:bg-blue-100 text-left transition shadow-xs group"
              >
                <div>
                  <div className="text-xs font-black text-blue-950">1. อาจารย์ในสาขาวิชา (Lecturer)</div>
                  <div className="text-[11px] font-semibold text-blue-800 font-mono">user: lecturer / pass: lecturer123</div>
                </div>
                <span className="text-xs bg-blue-600 group-hover:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-bold shadow-xs">
                  เลือก
                </span>
              </button>

              {/* Role 2: Reviewer */}
              <button
                type="button"
                onClick={() => handleQuickLogin('reviewer', 'reviewer123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-purple-400 bg-purple-50/80 hover:bg-purple-100 text-left transition shadow-xs group"
              >
                <div>
                  <div className="text-xs font-black text-purple-950">2. ผู้รับผิดชอบ AUN-QA (Committee)</div>
                  <div className="text-[11px] font-semibold text-purple-800 font-mono">user: reviewer / pass: reviewer123</div>
                </div>
                <span className="text-xs bg-purple-600 group-hover:bg-purple-700 text-white px-2.5 py-1 rounded-lg font-bold shadow-xs">
                  เลือก
                </span>
              </button>

              {/* Role 3: Admin */}
              <button
                type="button"
                onClick={() => handleQuickLogin('admin', 'admin123')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border-2 border-emerald-400 bg-emerald-50/80 hover:bg-emerald-100 text-left transition shadow-xs group"
              >
                <div>
                  <div className="text-xs font-black text-emerald-950">3. ผู้ดูแลระบบ (Admin)</div>
                  <div className="text-[11px] font-semibold text-emerald-800 font-mono">user: admin / pass: admin123</div>
                </div>
                <span className="text-xs bg-emerald-600 group-hover:bg-emerald-700 text-white px-2.5 py-1 rounded-lg font-bold shadow-xs">
                  เลือก
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
