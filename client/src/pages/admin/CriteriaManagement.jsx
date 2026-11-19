/**
 * ====================================================================================
 * CriteriaManagement.jsx (หน้าการจัดการเกณฑ์ประเมิน AUN-QA แต่ละปีการศึกษา สำหรับ Admin)
 * ====================================================================================
 * โมดูลสำคัญสำหรับผู้ดูแลระบบตามโครงสร้างของสถาปัตยกรรม (Diagram 3):
 * 1. แสดงรายการเกณฑ์ AUN-QA V4.0 ที่ผูกกับหลักสูตรและปีการศึกษาที่เลือก
 * 2. เพิ่มเกณฑ์ใหม่ กำหนดเลขข้อเกณฑ์ (criteria_no), ชื่อเกณฑ์ (criteria_name), และคำอธิบาย
 * 3. แก้ไขรายละเอียดและสาระสำคัญของเกณฑ์ในแต่ละปีการศึกษา
 * 4. ลบเกณฑ์ออกจากระบบ
 * 5. ฟังก์ชันคัดลอกเกณฑ์ข้ามปีการศึกษา (Clone Criteria) ช่วยอำนวยความสะดวกเมื่อเริ่มปีการศึกษาใหม่
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API
import {
  ListOrdered,
  Plus,
  Copy,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const CriteriaManagement = () => {
  // State ข้อมูลตัวกรองหลักสูตรและปีการศึกษา
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState(['2567', '2566']);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('2567');
  const [criteriaList, setCriteriaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // State สำหรับ Modal เพิ่ม/แก้ไขเกณฑ์
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCriteria, setSelectedCriteria] = useState(null);
  const [form, setForm] = useState({
    criteria_no: '',
    criteria_name: '',
    description: '',
    academic_year: '2567'
  });

  // State สำหรับ Modal คัดลอกเกณฑ์ข้ามปีการศึกษา
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneFromYear, setCloneFromYear] = useState('2567');
  const [cloneToYear, setCloneToYear] = useState('2568');

  // โหลดรายชื่อหลักสูตรและปีการศึกษาทั้งหมดที่มีในระบบ
  const fetchMeta = async () => {
    try {
      const [cRes, yRes] = await Promise.all([
        api.get('/courses'),
        api.get('/criteria/years')
      ]);
      setCourses(cRes.data);
      if (cRes.data.length > 0) setSelectedCourse(cRes.data[0]._id);
      if (yRes.data.length > 0) setYears(yRes.data);
    } catch (err) {
      console.error('Error fetching meta:', err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  // ดึงรายการเกณฑ์ AUN-QA ตามหลักสูตรและปีการศึกษาที่เลือก
  const fetchCriteria = async () => {
    if (!selectedCourse || !selectedYear) return;
    setLoading(true);
    try {
      const res = await api.get(`/criteria?course_id=${selectedCourse}&academic_year=${selectedYear}`);
      setCriteriaList(res.data);
    } catch (err) {
      console.error('Error fetching criteria:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCriteria();
  }, [selectedCourse, selectedYear]);

  // เปิด Modal เพิ่มเกณฑ์ข้อใหม่
  const handleOpenCreate = () => {
    setSelectedCriteria(null);
    setForm({
      criteria_no: '',
      criteria_name: '',
      description: '',
      academic_year: selectedYear
    });
    setIsModalOpen(true);
  };

  // เปิด Modal แก้ไขข้อมูลเกณฑ์ข้อที่มีอยู่แล้ว
  const handleOpenEdit = (crit) => {
    setSelectedCriteria(crit);
    setForm({
      criteria_no: crit.criteria_no,
      criteria_name: crit.criteria_name,
      description: crit.description || '',
      academic_year: crit.academic_year
    });
    setIsModalOpen(true);
  };

  // ส่งข้อมูลฟอร์มเพิ่มหรือแก้ไขเกณฑ์
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      if (selectedCriteria) {
        await api.put(`/criteria/${selectedCriteria._id}`, form);
        setMsg({ type: 'success', text: 'แก้ไขเกณฑ์สำเร็จ' });
      } else {
        await api.post('/criteria', {
          ...form,
          course_id: selectedCourse
        });
        setMsg({ type: 'success', text: 'เพิ่มเกณฑ์ AUN-QA สำเร็จ' });
      }
      setIsModalOpen(false);
      fetchCriteria();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'บันทึกเกณฑ์ไม่สำเร็จ' });
    }
  };

  // ลบเกณฑ์ออกจากระบบ
  const handleDelete = async (crit) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบเกณฑ์ "${crit.criteria_no}"?`)) return;
    try {
      await api.delete(`/criteria/${crit._id}`);
      setMsg({ type: 'success', text: 'ลบเกณฑ์เรียบร้อยแล้ว' });
      fetchCriteria();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถลบเกณฑ์ได้' });
    }
  };

  // ดำเนินการคัดลอกเกณฑ์จากปีการศึกษาเดิมไปยังปีการศึกษาใหม่
  const handleCloneCriteria = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      const res = await api.post('/criteria/clone', {
        course_id: selectedCourse,
        from_year: cloneFromYear,
        to_year: cloneToYear
      });
      setMsg({ type: 'success', text: res.data.message });
      setIsCloneModalOpen(false);
      if (!years.includes(cloneToYear)) {
        setYears([...years, cloneToYear].sort().reverse());
      }
      setSelectedYear(cloneToYear);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'คัดลอกเกณฑ์ไม่สำเร็จ' });
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ ตัวกรอง และปุ่มจัดการ ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            แก้ไขเกณฑ์ในแต่ละปีการศึกษา (Criteria Management)
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            กำหนดและปรับปรุงหัวข้อเกณฑ์มาตรฐาน AUN-QA Version 4.0 ประจำแต่ละปีการศึกษา
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500"
          >
            {years.map(y => (
              <option key={y} value={y}>ปีการศึกษา {y}</option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
          >
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.course_name}</option>
            ))}
          </select>

          <button
            onClick={() => setIsCloneModalOpen(true)}
            className="px-3.5 py-2 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition"
          >
            <Copy className="w-4 h-4 text-slate-600 stroke-[2.5]" />
            <span>คัดลอกเกณฑ์ข้ามปี</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>เพิ่มเกณฑ์</span>
          </button>
        </div>
      </div>

      {/* ข้อความแจ้งเตือนผลการดำเนินงาน */}
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

      {/* ==================== ส่วนที่ 2: ตารางแสดงรายการเกณฑ์ AUN-QA ทั้งหมด ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            รายการเกณฑ์ AUN-QA Version 4.0 ปีการศึกษา {selectedYear} ({criteriaList.length} ข้อ)
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดเกณฑ์...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase">
                  <th className="py-3 px-4 w-24">ข้อเกณฑ์</th>
                  <th className="py-3 px-4">ชื่อเกณฑ์</th>
                  <th className="py-3 px-4">รายละเอียด / สาระสำคัญ</th>
                  <th className="py-3 px-4 text-right w-24">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {criteriaList.map((crit) => (
                  <tr key={crit._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-blue-700 whitespace-nowrap">
                      {crit.criteria_no}
                    </td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {crit.criteria_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700 leading-relaxed">
                      {crit.description || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEdit(crit)}
                        title="แก้ไขเกณฑ์"
                        className="p-1.5 text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-400 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(crit)}
                        title="ลบเกณฑ์"
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

      {/* ==================== ส่วนที่ 3: Modal เพิ่ม/แก้ไขเกณฑ์ ==================== */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-lg p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">
              {selectedCriteria ? `แก้ไขเกณฑ์: ${selectedCriteria.criteria_no}` : 'เพิ่มเกณฑ์ AUN-QA ใหม่'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    ข้อเกณฑ์ (เช่น 1.1, 2.1) <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น 1.1"
                    value={form.criteria_no}
                    onChange={(e) => setForm({ ...form, criteria_no: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-slate-800 mb-1">
                    ปีการศึกษา <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.academic_year}
                    onChange={(e) => setForm({ ...form, academic_year: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  ชื่อเกณฑ์ (Criteria Name) <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ผลการเรียนรู้ที่คาดหวังของหลักสูตร..."
                  value={form.criteria_name}
                  onChange={(e) => setForm({ ...form, criteria_name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  รายละเอียด / สาระสำคัญของเกณฑ์
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="อธิบายตัวชี้วัดหรือข้อกำหนดตามคู่มือ AUN-QA V4.0..."
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs"
                >
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================== ส่วนที่ 4: Modal คัดลอกเกณฑ์ข้ามปีการศึกษา ==================== */}
      {isCloneModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">
              คัดลอกเกณฑ์ AUN-QA ไปยังปีการศึกษาใหม่
            </h2>
            <form onSubmit={handleCloneCriteria} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  ปีการศึกษาต้นทาง
                </label>
                <select
                  value={cloneFromYear}
                  onChange={(e) => setCloneFromYear(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
                  {years.map(y => (
                    <option key={y} value={y}>ปีการศึกษา {y}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  ปีการศึกษาปลายทาง (สร้างใหม่)
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 2568"
                  value={cloneToYear}
                  onChange={(e) => setCloneToYear(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black"
                >
                  เริ่มคัดลอก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriteriaManagement;
