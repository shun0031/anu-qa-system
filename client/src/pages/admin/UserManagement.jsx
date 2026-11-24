/**
 * ====================================================================================
 * UserManagement.jsx (หน้าการจัดการผู้ใช้งานและรหัสผ่าน สำหรับผู้ดูแลระบบ - Admin)
 * ====================================================================================
 * ส่วนงานหลักของผู้ดูแลระบบตามสถาปัตยกรรมระบบ (Diagram 3):
 * 1. แสดงรายชื่อผู้ใช้งานทั้งหมด พร้อมสถานะ (Active/Inactive), บทบาท (Role), สาขาวิชา (Department)
 * 2. ค้นหาผู้ใช้งานด้วยชื่อ-นามสกุล, username หรือ email
 * 3. เพิ่มบัญชีผู้ใช้งานใหม่ กำหนดสิทธิ์บทบาทเริ่มต้น และสาขาวิชา
 * 4. แก้ไขข้อมูลส่วนบุคคลของผู้ใช้งานในระบบ
 * 5. รีเซ็ตรหัสผ่าน (Reset Password) ของผู้ใช้งานในระบบเมื่อลืมรหัสผ่าน
 * 6. ลบบัญชีผู้ใช้งานออกจากฐานข้อมูล
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API ไปยังเซิร์ฟเวอร์
import {
  Users,
  UserPlus,
  KeyRound,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Search,
  Shield,
  Building
} from 'lucide-react';

const UserManagement = () => {
  // State รายชื่อผู้ใช้, บทบาท (Roles), และสาขาวิชา (Departments)
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState({ type: '', text: '' });

  // State จัดการ Modal เพิ่ม/แก้ไขผู้ใช้ และ Modal รีเซ็ตรหัสผ่าน
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // State ฟอร์มข้อมูลผู้ใช้งาน (รองรับ 1 บัญชีหลายสิทธิ์ role_ids)
  const [form, setForm] = useState({
    username: '',
    password: '',
    full_name: '',
    email: '',
    phone: '',
    line_id: '',
    address: '',
    role_id: '',
    role_ids: [],
    department_id: '',
    status: 'active'
  });
  const [newPassword, setNewPassword] = useState('');

  // ฟังก์ชันดึงข้อมูลผู้ใช้งานและข้อมูลประกอบ (Roles, Departments)
  const fetchUsersAndMeta = async () => {
    setLoading(true);
    try {
      const [uRes, metaRes] = await Promise.all([
        api.get('/users'),
        api.get('/users/meta/roles-departments')
      ]);
      setUsers(uRes.data);
      setRoles(metaRes.data.roles);
      setDepartments(metaRes.data.departments);
      if (metaRes.data.roles.length > 0 && (!form.role_ids || form.role_ids.length === 0)) {
        setForm(prev => ({
          ...prev,
          role_id: metaRes.data.roles[0]._id,
          role_ids: [metaRes.data.roles[0]._id],
          department_id: metaRes.data.departments[0]?._id || ''
        }));
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndMeta();
  }, []);

  // ฟังก์ชันสลับการเลือกบทบาท (Checkbox Toggle)
  const handleToggleRole = (roleId) => {
    setForm(prev => {
      const currentList = Array.isArray(prev.role_ids) ? prev.role_ids : [];
      const exists = currentList.includes(roleId);
      let nextRoleIds;
      if (exists) {
        if (currentList.length === 1) {
          return prev; // บังคับให้ต้องมีอย่างน้อย 1 สิทธิ์
        }
        nextRoleIds = currentList.filter(id => id !== roleId);
      } else {
        nextRoleIds = [...currentList, roleId];
      }
      return {
        ...prev,
        role_ids: nextRoleIds,
        role_id: nextRoleIds[0] || ''
      };
    });
  };

  // เปิด Modal เพิ่มผู้ใช้ใหม่
  const handleOpenCreate = () => {
    setSelectedUser(null);
    setForm({
      username: '',
      password: '',
      full_name: '',
      email: '',
      phone: '',
      line_id: '',
      address: '',
      role_id: roles[0]?._id || '',
      role_ids: roles[0] ? [roles[0]._id] : [],
      department_id: departments[0]?._id || '',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  // เปิด Modal แก้ไขข้อมูลผู้ใช้ที่มีอยู่แล้ว (ดึงสิทธิ์ทั้งหมดที่มี)
  const handleOpenEdit = (user) => {
    setSelectedUser(user);

    let userRoleIds = [];
    if (user.role_ids && Array.isArray(user.role_ids)) {
      userRoleIds = user.role_ids.map(r => r._id || r);
    }
    const primaryId = user.role_id?._id || user.role_id;
    if (primaryId && !userRoleIds.includes(primaryId)) {
      userRoleIds.push(primaryId);
    }
    if (userRoleIds.length === 0 && roles.length > 0) {
      userRoleIds = [roles[0]._id];
    }

    setForm({
      username: user.username,
      password: '',
      full_name: user.full_name,
      email: user.email,
      phone: user.phone || '',
      line_id: user.line_id || '',
      address: user.address || '',
      role_id: userRoleIds[0] || '',
      role_ids: userRoleIds,
      department_id: user.department_id?._id || user.department_id || '',
      status: user.status
    });
    setIsModalOpen(true);
  };

  // เปิด Modal สำหรับรีเซ็ตรหัสผ่าน
  const handleOpenReset = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsResetModalOpen(true);
  };

  // ส่งข้อมูลฟอร์มเพิ่มหรือแก้ไขผู้ใช้ไปยัง API
  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      if (selectedUser) {
        await api.put(`/users/${selectedUser._id}`, form);
        setMsg({ type: 'success', text: 'แก้ไขข้อมูลผู้ใช้สำเร็จ' });
      } else {
        await api.post('/users', form);
        setMsg({ type: 'success', text: 'เพิ่มผู้ใช้งานใหม่สำเร็จ' });
      }
      setIsModalOpen(false);
      fetchUsersAndMeta();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'บันทึกข้อมูลไม่สำเร็จ' });
    }
  };

  // ส่งคำขอรีเซ็ตรหัสผ่านผู้ใช้งานไปยัง API
  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser._id}/reset-password`, {
        new_password: newPassword
      });
      setMsg({ type: 'success', text: `รีเซ็ตรหัสผ่านของ ${selectedUser.username} เรียบร้อยแล้ว` });
      setIsResetModalOpen(false);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ' });
    }
  };

  // ลบผู้ใช้งานออกจากระบบ
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้ "${user.full_name}" (${user.username})?`)) return;
    try {
      await api.delete(`/users/${user._id}`);
      setMsg({ type: 'success', text: 'ลบผู้ใช้งานเรียบร้อยแล้ว' });
      fetchUsersAndMeta();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถลบผู้ใช้งานได้' });
    }
  };

  // กรองรายชื่อผู้ใช้ตามคำค้นหา
  const filteredUsers = users.filter(u =>
    u.full_name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ ช่องค้นหา และปุ่มเพิ่มผู้ใช้ ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            การจัดการผู้ใช้งานและรหัสผ่าน (User Management)
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            กำหนดสิทธิ์ผู้ใช้งาน เพิ่ม ลบ แก้ไข และรีเซ็ตรหัสผ่าน
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อ, username, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-emerald-600 w-48 sm:w-60 shadow-xs"
            />
          </div>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>เพิ่มผู้ใช้งาน</span>
          </button>
        </div>
      </div>

      {/* ข้อความแจ้งเตือนผลการดำเนินงาน */}
      {msg.text && (
        <div
          className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 border-2 ${
            msg.type === 'success'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
              : 'bg-rose-100 text-rose-950 border-rose-500'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-700" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-700" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ==================== ส่วนที่ 2: ตารางรายชื่อผู้ใช้งานทั้งหมด ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            รายชื่อผู้ใช้งานทั้งหมด ({filteredUsers.length} บัญชี)
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดข้อมูลผู้ใช้...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4">ชื่อ-นามสกุล / Username</th>
                  <th className="py-3.5 px-4">บทบาท (Role)</th>
                  <th className="py-3.5 px-4">สาขาวิชา</th>
                  <th className="py-3.5 px-4">อีเมล / โทรศัพท์</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900">{u.full_name}</div>
                      <div className="text-xs font-bold text-slate-500 font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(() => {
                          const userRoles = (u.role_ids && u.role_ids.length > 0)
                            ? u.role_ids
                            : (u.role_id ? [u.role_id] : []);
                          if (userRoles.length === 0) return <span className="text-slate-400 text-xs">-</span>;
                          return userRoles.map((r, idx) => {
                            const rName = r?.role_name || r;
                            let badgeClass = "bg-blue-100 text-blue-900 border-blue-300";
                            if (rName === 'ผู้ดูแลระบบ') badgeClass = "bg-emerald-100 text-emerald-900 border-emerald-300";
                            else if (rName === 'ผู้รับผิดชอบ AUN-QA') badgeClass = "bg-purple-100 text-purple-900 border-purple-300";

                            return (
                              <span
                                key={idx}
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black border ${badgeClass} shadow-2xs`}
                              >
                                <Shield className="w-3 h-3 flex-shrink-0" />
                                {rName}
                              </span>
                            );
                          });
                        })()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                      {u.department_id?.department_name || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      <div className="font-bold text-slate-900">{u.email}</div>
                      <div className="text-slate-500">{u.phone || '-'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      {u.status === 'active' ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
                          ใช้งาน
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-rose-100 text-rose-900 border border-rose-400">
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* ปุ่มรีเซ็ตรหัสผ่าน */}
                      <button
                        onClick={() => handleOpenReset(u)}
                        title="รีเซ็ตรหัสผ่าน"
                        className="p-2 text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-400 rounded-lg transition"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>
                      {/* ปุ่มแก้ไขข้อมูลผู้ใช้ */}
                      <button
                        onClick={() => handleOpenEdit(u)}
                        title="แก้ไขข้อมูล"
                        className="p-2 text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-400 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      {/* ปุ่มลบผู้ใช้งาน */}
                      <button
                        onClick={() => handleDeleteUser(u)}
                        title="ลบผู้ใช้"
                        className="p-2 text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-400 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== ส่วนที่ 3: Modal เพิ่ม/แก้ไขข้อมูลผู้ใช้งาน ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-lg p-6 space-y-4 my-auto">
            <h2 className="text-base font-black text-slate-900">
              {selectedUser ? `แก้ไขข้อมูล: ${selectedUser.username}` : 'เพิ่มผู้ใช้งานใหม่'}
            </h2>

            <form onSubmit={handleSubmitUser} className="space-y-4">
              {!selectedUser && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Username <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-800 mb-1">
                      Password <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  ชื่อ-นามสกุล <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    อีเมล <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>กำหนดสิทธิ์ใช้งาน (เลือกได้หลายสิทธิ์สำหรับ 1 บัญชี) <span className="text-red-600">*</span></span>
                  <span className="text-[11px] text-blue-600 font-bold">เลือกแล้ว {form.role_ids?.length || 0} สิทธิ์</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 border-2 border-slate-300 rounded-2xl">
                  {roles.map(r => {
                    const isChecked = form.role_ids?.includes(r._id);
                    let activeCard = "border-blue-500 bg-blue-50 text-blue-950";
                    if (r.role_name === 'ผู้ดูแลระบบ') activeCard = "border-emerald-500 bg-emerald-50 text-emerald-950";
                    else if (r.role_name === 'ผู้รับผิดชอบ AUN-QA') activeCard = "border-purple-500 bg-purple-50 text-purple-950";

                    return (
                      <label
                        key={r._id}
                        className={`flex items-start gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition select-none ${
                          isChecked ? `${activeCard} font-black shadow-xs` : 'border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-bold'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleRole(r._id)}
                          className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                        />
                        <div className="text-xs leading-tight">
                          <div>{r.role_name}</div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  สาขาวิชา
                </label>
                <select
                  value={form.department_id}
                  onChange={(e) => setForm({ ...form, department_id: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="">-- ไม่ระบุ --</option>
                  {departments.map(d => (
                    <option key={d._id} value={d._id}>{d.department_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  สถานะ
                </label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="active">เปิดใช้งาน (Active)</option>
                  <option value="inactive">ปิดใช้งาน (Inactive)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ส่วนที่ 4: Modal รีเซ็ตรหัสผ่านผู้ใช้งาน ==================== */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">
              รีเซ็ตรหัสผ่าน: {selectedUser?.username}
            </h2>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  รหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)
                </label>
                <input
                  type="password"
                  required
                  placeholder="ระบุรหัสผ่านใหม่"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  ยืนยันรีเซ็ต
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
