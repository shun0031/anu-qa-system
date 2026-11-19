/**
 * ====================================================================================
 * CourseManagement.jsx (หน้าการจัดการหลักสูตรและสาขาวิชา สำหรับผู้ดูแลระบบ - Admin)
 * ====================================================================================
 * จัดการข้อมูลโครงสร้างหน่วยงานตามสถาปัตยกรรมระบบ (Diagram 2 Schema & Diagram 3):
 * 1. แสดงรายชื่อหลักสูตร (Courses) ทั้งหมดในระบบ พร้อมสาขาวิชาที่สังกัด และสถานะ
 * 2. เพิ่มหลักสูตรใหม่ (เช่น หลักสูตร วท.บ. สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล)
 * 3. แก้ไขข้อมูลหลักสูตรและสถานะการเปิดใช้งาน (Active/Inactive)
 * 4. ลบหลักสูตรออกจากระบบ
 * 5. หน้าต่าง Modal สำหรับเพิ่มสาขาวิชาใหม่ (Departments)
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API
import {
  GraduationCap,
  Building,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const CourseManagement = () => {
  // State ข้อมูลหลักสูตรและสาขาวิชา
  const [courses, setCourses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // State Modal สำหรับเพิ่ม/แก้ไขหลักสูตร
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseForm, setCourseForm] = useState({
    course_name: '',
    department_id: '',
    status: 'active'
  });

  // State Modal สำหรับเพิ่มสาขาวิชาใหม่
  const [isDeptModalOpen, setIsDeptModalOpen] = useState(false);
  const [deptName, setDeptName] = useState('');

  // ฟังก์ชันดึงข้อมูลหลักสูตรและสาขาวิชาจาก API
  const fetchData = async () => {
    setLoading(true);
    try {
      const [cRes, dRes] = await Promise.all([
        api.get('/courses'),
        api.get('/courses/departments')
      ]);
      setCourses(cRes.data);
      setDepartments(dRes.data);
      if (dRes.data.length > 0 && !courseForm.department_id) {
        setCourseForm(prev => ({ ...prev, department_id: dRes.data[0]._id }));
      }
    } catch (err) {
      console.error('Error fetching courses/departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // เปิด Modal เพิ่มหลักสูตรใหม่
  const handleOpenCourseCreate = () => {
    setSelectedCourse(null);
    setCourseForm({
      course_name: '',
      department_id: departments[0]?._id || '',
      status: 'active'
    });
    setIsCourseModalOpen(true);
  };

  // เปิด Modal แก้ไขข้อมูลหลักสูตร
  const handleOpenCourseEdit = (c) => {
    setSelectedCourse(c);
    setCourseForm({
      course_name: c.course_name,
      department_id: c.department_id?._id || c.department_id,
      status: c.status
    });
    setIsCourseModalOpen(true);
  };

  // ส่งฟอร์มเพิ่มหรือแก้ไขหลักสูตร
  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });
    try {
      if (selectedCourse) {
        await api.put(`/courses/${selectedCourse._id}`, courseForm);
        setMsg({ type: 'success', text: 'แก้ไขหลักสูตรสำเร็จ' });
      } else {
        await api.post('/courses', courseForm);
        setMsg({ type: 'success', text: 'เพิ่มหลักสูตรใหม่สำเร็จ' });
      }
      setIsCourseModalOpen(false);
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถบันทึกหลักสูตรได้' });
    }
  };

  // ลบหลักสูตร
  const handleDeleteCourse = async (c) => {
    if (!window.confirm(`คุณแน่ใจว่าต้องการลบหลักสูตร "${c.course_name}"?`)) return;
    try {
      await api.delete(`/courses/${c._id}`);
      setMsg({ type: 'success', text: 'ลบหลักสูตรสำเร็จ' });
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถลบหลักสูตรได้' });
    }
  };

  // ส่งฟอร์มเพิ่มสาขาวิชาใหม่
  const handleSubmitDept = async (e) => {
    e.preventDefault();
    try {
      await api.post('/courses/departments', { department_name: deptName });
      setMsg({ type: 'success', text: 'เพิ่มสาขาวิชาสำเร็จ' });
      setDeptName('');
      setIsDeptModalOpen(false);
      fetchData();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถเพิ่มสาขาวิชาได้' });
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ และปุ่มเพิ่มสาขา/หลักสูตร ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            การจัดการหลักสูตรและสาขาวิชา
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            เพิ่ม แก้ไข และกำหนดสถานะการเปิดรับการประเมินของหลักสูตร
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsDeptModalOpen(true)}
            className="px-3.5 py-2 bg-white border-2 border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition"
          >
            <Building className="w-4 h-4 text-slate-500" />
            <span>เพิ่มสาขาวิชา</span>
          </button>

          <button
            onClick={handleOpenCourseCreate}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>เพิ่มหลักสูตร</span>
          </button>
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

      {/* ==================== ส่วนที่ 2: ตารางแสดงรายการหลักสูตรทั้งหมด ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            หลักสูตรในระบบ ({courses.length} หลักสูตร)
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดหลักสูตร...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase">
                  <th className="py-3 px-4">ชื่อหลักสูตร</th>
                  <th className="py-3 px-4">สาขาวิชา</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {courses.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      {c.course_name}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-bold text-slate-700">
                      {c.department_id?.department_name || '-'}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.status === 'active' ? (
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-400">
                          เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">
                          ปิดใช้งาน
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenCourseEdit(c)}
                        title="แก้ไขหลักสูตร"
                        className="p-1.5 text-blue-800 bg-blue-100 hover:bg-blue-200 border border-blue-400 rounded-lg transition"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCourse(c)}
                        title="ลบหลักสูตร"
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

      {/* ==================== ส่วนที่ 3: Modal เพิ่ม/แก้ไขหลักสูตร ==================== */}
      {isCourseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-md p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">
              {selectedCourse ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตรใหม่'}
            </h2>

            <form onSubmit={handleSubmitCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  ชื่อหลักสูตร <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น วิทยาศาสตรบัณฑิต สาขาวิชา..."
                  value={courseForm.course_name}
                  onChange={(e) => setCourseForm({ ...courseForm, course_name: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  สังกัดสาขาวิชา <span className="text-red-600">*</span>
                </label>
                <select
                  value={courseForm.department_id}
                  onChange={(e) => setCourseForm({ ...courseForm, department_id: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
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
                  value={courseForm.status}
                  onChange={(e) => setCourseForm({ ...courseForm, status: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white"
                >
                  <option value="active">เปิดใช้งาน (Active)</option>
                  <option value="inactive">ปิดใช้งาน (Inactive)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t-2 border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
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

      {/* ==================== ส่วนที่ 4: Modal เพิ่มสาขาวิชาใหม่ ==================== */}
      {isDeptModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-sm p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">เพิ่มสาขาวิชาใหม่</h2>
            <form onSubmit={handleSubmitDept} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-800 mb-1">
                  ชื่อสาขาวิชา <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น สาขาวิชาเทคโนโลยีคอมพิวเตอร์"
                  value={deptName}
                  onChange={(e) => setDeptName(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsDeptModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-xl border border-slate-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black"
                >
                  เพิ่มสาขาวิชา
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
