/**
 * ====================================================================================
 * SystemLogs.jsx (หน้าประวัติการใช้งานระบบและ Audit Trail สำหรับผู้ดูแลระบบ - Admin)
 * ====================================================================================
 * โมดูลตรวจสอบความโปร่งใสและความปลอดภัยตาม Diagram 1 & 2 (Collection: system_logs):
 * 1. แสดงรายการบันทึกประวัติการกระทำ (User Action Logs) ย้อนหลังในระบบ
 * 2. ค้นหาข้อความใน Log, ชื่อผู้กระทำ หรือรายละเอียดเหตุการณ์
 * 3. ตัวกรองตาม Action สำคัญ เช่น LOGIN, SAVE_RECORD, SUBMIT_RECORD, CONFIRM_RECORD, RETURN_RECORD, UPLOAD_FILE
 * 4. แสดงข้อมูลละเอียด: วันและเวลา (Timestamp), ผู้กระทำ (User), Action Badge, เป้าหมาย (Target Collection), รายละเอียด (Detail) และ IP Address
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API
import { History, Search, Shield, Filter } from 'lucide-react';

const SystemLogs = () => {
  // State รายการ log, สถานะโหลด, ตัวกรอง action และคำค้นหา
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('');
  const [search, setSearch] = useState('');

  // ฟังก์ชันดึงรายการ Audit Logs จาก API
  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/logs?action=${filterAction}`);
      setLogs(res.data);
    } catch (err) {
      console.error('Error fetching system logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction]);

  // กรอง Log ตามคำค้นหา
  const filteredLogs = logs.filter(l =>
    !search ||
    l.action?.toLowerCase().includes(search.toLowerCase()) ||
    l.detail?.toLowerCase().includes(search.toLowerCase()) ||
    l.user_id?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  // กำหนดสไตล์สีของ Action Badge เพื่อให้อ่านและจำแนกได้ชัดเจน
  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-blue-100 text-blue-900 border-blue-400';
      case 'CONFIRM_RECORD':
        return 'bg-emerald-100 text-emerald-900 border-emerald-400';
      case 'RETURN_RECORD':
        return 'bg-rose-100 text-rose-900 border-rose-400';
      case 'SUBMIT_RECORD':
        return 'bg-indigo-100 text-indigo-900 border-indigo-400';
      case 'DELETE_USER':
      case 'DELETE_FILE':
        return 'bg-red-100 text-red-900 border-red-400';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ ตัวค้นหา และตัวกรองประเภท Action ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ประวัติการใช้งานระบบ (System Audit Logs)
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            บันทึกความเคลื่อนไหว กิจกรรมการใช้งาน และการเปลี่ยนแปลงข้อมูลในระบบ (collection: system_logs)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหา log..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600 w-48 sm:w-60 shadow-xs"
            />
          </div>

          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="">ทุก Action</option>
            <option value="LOGIN">LOGIN</option>
            <option value="SAVE_RECORD">SAVE_RECORD</option>
            <option value="SUBMIT_RECORD">SUBMIT_RECORD</option>
            <option value="CONFIRM_RECORD">CONFIRM_RECORD</option>
            <option value="RETURN_RECORD">RETURN_RECORD</option>
            <option value="UPLOAD_FILE">UPLOAD_FILE</option>
            <option value="CREATE_USER">CREATE_USER</option>
          </select>
        </div>
      </div>

      {/* ==================== ส่วนที่ 2: ตารางแสดงประวัติ Log ทั้งหมด ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            รายการบันทึกประวัติ ({filteredLogs.length} รายการล่าสุด)
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดบันทึก...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">ไม่พบบันทึกประวัติ</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase">
                  <th className="py-3 px-4">วันและเวลา</th>
                  <th className="py-3 px-4">ผู้กระทำ (User)</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">เป้าหมาย (Collection)</th>
                  <th className="py-3 px-4">รายละเอียด</th>
                  <th className="py-3 px-4 text-right">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-xs">
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-600 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('th-TH')}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900 whitespace-nowrap">
                      {log.user_id?.full_name || 'System'}
                      {log.user_id?.username && (
                        <span className="text-[11px] text-slate-500 block font-normal font-mono">
                          @{log.user_id.username}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-md text-[11px] font-black border ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11px] font-bold">
                      {log.target_collection || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium max-w-md">
                      {log.detail || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                      {log.ip_address || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemLogs;
