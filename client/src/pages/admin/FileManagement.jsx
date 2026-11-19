/**
 * ====================================================================================
 * FileManagement.jsx (หน้าการตรวจสอบและจัดการไฟล์ทั้งหมดในระบบ สำหรับ Admin)
 * ====================================================================================
 * หน้าจัดการพื้นที่จัดเก็บไฟล์และคลังหลักฐาน (File Storage Handler) ตาม Diagram 1 & 3:
 * 1. แสดงรายการไฟล์หลักฐานทั้งหมดในระบบ ทั้งเอกสาร (PDF, Word, Excel) และรูปภาพ (JPG, PNG)
 * 2. การ์ดสรุปสถิติการใช้งานพื้นที่จัดเก็บ (Total Files, Total Size MB, รูปภาพ vs เอกสาร)
 * 3. ค้นหาไฟล์ด้วยชื่อต้นฉบับ (original_name) และตัวกรองประเภทไฟล์
 * 4. ปุ่มเปิดดูตัวอย่างไฟล์ (View/Preview) ในเบราว์เซอร์
 * 5. ปุ่มดาวน์โหลดไฟล์ลงเครื่อง (Download)
 * 6. ปุ่มลบไฟล์ออกจากระบบ ทั้งในฐานข้อมูลและไฟล์จริงบน Disk Storage
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API
import {
  FolderOpen,
  File,
  Image as ImageIcon,
  Download,
  Trash2,
  Search,
  HardDrive,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const FileManagement = () => {
  // State รายการไฟล์, สถานะโหลด, คำค้นหา และตัวกรองประเภท
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [msg, setMsg] = useState({ type: '', text: '' });

  // ดึงข้อมูลรายการไฟล์ทั้งหมดจากเซิร์ฟเวอร์
  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/files');
      setFiles(res.data);
    } catch (err) {
      console.error('Error fetching files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  // ลบไฟล์ออกจากระบบ
  const handleDelete = async (file) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบไฟล์ "${file.original_name}" ออกจากระบบ?`)) return;
    try {
      await api.delete(`/files/${file._id}`);
      setMsg({ type: 'success', text: 'ลบไฟล์สำเร็จ' });
      fetchFiles();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถลบไฟล์ได้' });
    }
  };

  // กรองไฟล์ตามประเภทและคำค้นหา
  const filteredFiles = files.filter(f => {
    const matchType = filterType === 'all' || f.file_type === filterType;
    const matchSearch = !search || f.original_name.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  // คำนวณขนาดพื้นที่จัดเก็บรวมเป็นเมกะไบต์ (MB)
  const totalSizeMB = (files.reduce((sum, f) => sum + (f.file_size || 0), 0) / (1024 * 1024)).toFixed(2);

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ ตัวค้นหา และตัวกรอง ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ตรวจสอบและจัดการไฟล์ทั้งหมด (File Storage Management)
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            ดูไฟล์หลักฐานเอกสารและรูปภาพทั้งหมดที่ถูกอัปโหลดในระบบ AUN-QA
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อไฟล์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-blue-600 w-48 sm:w-60 shadow-xs"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">ทุกประเภท</option>
            <option value="document">ไฟล์เอกสาร</option>
            <option value="image">รูปภาพ</option>
          </select>
        </div>
      </div>

      {/* กล่องแจ้งเตือนผลการดำเนินงาน */}
      {msg.text && (
        <div
          className={`p-3.5 rounded-xl text-sm font-bold flex items-center gap-2 border-2 ${
            msg.type === 'success'
              ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
              : 'bg-rose-100 text-rose-950 border-rose-500'
          }`}
        >
          {msg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-700" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-700" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* ==================== ส่วนที่ 2: การ์ดสรุปสถิติการใช้งานพื้นที่จัดเก็บ ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <FolderOpen className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase">จำนวนไฟล์ทั้งหมด</div>
            <div className="text-2xl font-black text-slate-900">{files.length} รายการ</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
            <HardDrive className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase">ขนาดพื้นที่จัดเก็บรวม</div>
            <div className="text-2xl font-black text-slate-900">{totalSizeMB} MB</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <ImageIcon className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="text-xs font-black text-slate-500 uppercase">รูปภาพ / เอกสาร</div>
            <div className="text-2xl font-black text-slate-900">
              {files.filter(f => f.file_type === 'image').length} / {files.filter(f => f.file_type === 'document').length}
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ส่วนที่ 3: ตารางแสดงรายการไฟล์ทั้งหมด ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            รายการไฟล์ในระบบ ({filteredFiles.length} รายการ)
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดรายการไฟล์...</div>
        ) : filteredFiles.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">ไม่พบไฟล์ที่ตรงกับเงื่อนไข</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase">
                  <th className="py-3 px-4">ชื่อไฟล์</th>
                  <th className="py-3 px-4">ประเภท</th>
                  <th className="py-3 px-4">ขนาด</th>
                  <th className="py-3 px-4">ผู้อัปโหลด</th>
                  <th className="py-3 px-4">วันที่อัปโหลด</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {filteredFiles.map((f) => (
                  <tr key={f._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-slate-900 flex items-center gap-2.5 max-w-sm truncate">
                      {f.file_type === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600 flex-shrink-0 stroke-[2.5]" />
                      ) : (
                        <File className="w-4 h-4 text-blue-600 flex-shrink-0 stroke-[2.5]" />
                      )}
                      <span className="truncate" title={f.original_name}>{f.original_name}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs px-2.5 py-1 rounded-md font-black bg-slate-100 text-slate-700 border border-slate-300">
                        {f.file_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                      {f.file_size ? `${(f.file_size / 1024).toFixed(1)} KB` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                      {f.uploaded_by?.full_name || 'ผู้ใช้งาน'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                      {new Date(f.upload_date).toLocaleDateString('th-TH')}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                      {/* ปุ่มเปิดดูไฟล์ */}
                      <a
                        href={`/uploads/${f.file_name}`}
                        target="_blank"
                        rel="noreferrer"
                        title="เปิดดู"
                        className="inline-flex p-1.5 text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-400 rounded-lg transition"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                      {/* ปุ่มดาวน์โหลดไฟล์ */}
                      <a
                        href={`/api/files/${f._id}/download`}
                        title="ดาวน์โหลด"
                        className="inline-flex p-1.5 text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-400 rounded-lg transition"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      {/* ปุ่มลบไฟล์ */}
                      <button
                        onClick={() => handleDelete(f)}
                        title="ลบไฟล์"
                        className="p-1.5 text-rose-800 bg-rose-100 hover:bg-rose-200 border border-rose-400 rounded-lg transition"
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
    </div>
  );
};

export default FileManagement;
