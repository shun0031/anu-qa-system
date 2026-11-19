/**
 * ==============================================================================
 * ไฟล์: client/src/pages/Profile.jsx
 * หน้าที่: หน้าจอข้อมูลส่วนบุคคลและการตรวจสอบสิทธิ์ (Profile Page)
 * อ้างอิงตามแผนผังภาพที่ 3 (ฟังก์ชันร่วมของ อาจารย์ และ ผู้รับผิดชอบ AUN-QA):
 *  - "ตรวจสอบสิทธิ์": แสดงบทบาท สังกัดสาขาวิชา และรายการสิทธิ์ (Permissions)
 *  - "แก้ไขข้อมูลส่วนบุคคล": แก้ไขชื่อ, เบอร์โทร, ที่อยู่, LINE ID และเปลี่ยนรหัสผ่าน
 * ==============================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  User,
  Shield,
  Key,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Building,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    line_id: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  // โหลดข้อมูลเดิมของผู้ใช้เข้าสู่ฟอร์ม
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || '',
        line_id: user.line_id || ''
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // บันทึกการเปลี่ยนแปลงข้อมูลส่วนตัวและรหัสผ่าน
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    // ตรวจสอบความถูกต้องกรณีต้องการเปลี่ยนรหัสผ่าน
    if (formData.new_password) {
      if (formData.new_password !== formData.confirm_password) {
        setMsg({ type: 'error', text: 'รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน' });
        return;
      }
      if (!formData.current_password) {
        setMsg({ type: 'error', text: 'กรุณากรอกรหัสผ่านปัจจุบันเพื่อเปลี่ยนรหัสผ่าน' });
        return;
      }
    }

    setLoading(true);
    try {
      const res = await api.put('/auth/profile', {
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        line_id: formData.line_id,
        current_password: formData.current_password || undefined,
        new_password: formData.new_password || undefined
      });

      updateUser(res.data.user);
      setMsg({ type: 'success', text: res.data.message || 'บันทึกข้อมูลเรียบร้อยแล้ว' });
      setFormData(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: ''
      }));
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ส่วนหัวหน้าเว็บ */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">ข้อมูลส่วนบุคคลและการตรวจสอบสิทธิ์</h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
          จัดการข้อมูลผู้ใช้งาน ตรวจสอบสิทธิ์การเข้าถึงระบบ และเปลี่ยนรหัสผ่าน
        </p>
      </div>

      {msg.text && (
        <div
          className={`p-4 rounded-xl flex items-center gap-2 text-sm font-bold border-2 ${
            msg.type === 'success'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
              : 'bg-rose-100 text-rose-950 border-rose-500'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-700" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-700" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* การ์ดด้านซ้าย: ตรวจสอบสิทธิ์และข้อมูลสังกัด (Role & Permissions) */}
        <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-6">
          <div className="text-center pb-6 border-b border-slate-100">
            <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 border-2 border-blue-400 flex items-center justify-center text-blue-700 mb-3 shadow-sm">
              <User className="w-10 h-10" />
            </div>
            <h2 className="text-lg font-black text-slate-900">{user?.full_name}</h2>
            <p className="text-xs font-bold text-slate-500 font-mono">@{user?.username}</p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
              <Shield className="w-3.5 h-3.5 text-blue-600" />
              {user?.role}
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-slate-700 font-medium">
              <Building className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>สาขาวิชา: <strong className="text-slate-900">{user?.department || 'สาขาเทคโนโลยีคอมพิวเตอร์'}</strong></span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 font-medium">
              <Mail className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 font-medium">
              <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>{user?.phone || 'ยังไม่ได้ระบุเบอร์โทร'}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-700 font-medium">
              <MessageSquare className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <span>LINE ID: {user?.line_id || '-'}</span>
            </div>
          </div>

          {/* รายการสิทธิ์ที่ได้รับ (Permissions List) */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
              สิทธิ์การใช้งานในระบบ (Permissions)
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {user?.permissions?.length > 0 ? (
                user.permissions.map((perm, idx) => (
                  <span
                    key={idx}
                    className="text-[11px] px-2.5 py-1 bg-slate-100 text-slate-800 rounded-lg font-bold border border-slate-200"
                  >
                    ✓ {perm}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-400">สิทธิ์มาตรฐานตามบทบาท</span>
              )}
            </div>
          </div>
        </div>

        {/* การ์ดด้านขวา: ฟอร์มแก้ไขข้อมูลส่วนตัวและเปลี่ยนรหัสผ่าน */}
        <div className="lg:col-span-2 bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-base font-black text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600 stroke-[2.5]" />
              แก้ไขข้อมูลส่วนบุคคล
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  ชื่อ-นามสกุล <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  เบอร์โทรศัพท์
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="08X-XXX-XXXX"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  LINE ID
                </label>
                <input
                  type="text"
                  name="line_id"
                  value={formData.line_id}
                  onChange={handleChange}
                  placeholder="ระบุ LINE ID สำหรับติดต่อ"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5">
                  ที่อยู่
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="ที่อยู่หรือห้องพักอาจารย์"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                />
              </div>
            </div>

            {/* ส่วนเปลี่ยนรหัสผ่าน */}
            <div className="pt-4 border-t border-slate-100">
              <h2 className="text-sm font-black text-slate-900 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-600 stroke-[2.5]" />
                เปลี่ยนรหัสผ่าน (เว้นว่างไว้หากไม่ต้องการเปลี่ยน)
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่านปัจจุบัน
                  </label>
                  <input
                    type="password"
                    name="current_password"
                    value={formData.current_password}
                    onChange={handleChange}
                    placeholder="รหัสผ่านปัจจุบัน"
                    className="w-full px-3.5 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    รหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    name="new_password"
                    value={formData.new_password}
                    onChange={handleChange}
                    placeholder="อย่างน้อย 6 ตัวอักษร"
                    className="w-full px-3.5 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    ยืนยันรหัสผ่านใหม่
                  </label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    placeholder="ยืนยันรหัสผ่านใหม่"
                    className="w-full px-3.5 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md transition disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
