/**
 * ====================================================================================
 * TrackingDashboard.jsx (หน้าติดตามความก้าวหน้าการรายงานประเมินตนเอง AUN-QA V4.0)
 * ====================================================================================
 * หน้าจอสำหรับผู้รับผิดชอบ AUN-QA และผู้บริหาร ใช้ติดตามสถานะการประเมินตนเองของหลักสูตร:
 * 1. ตัวกรองเลือกดูตามปีการศึกษาและหลักสูตร
 * 2. การ์ดแสดงสถิติสรุป 5 มิติ (เกณฑ์ทั้งหมด, ยืนยันผลสำเร็จ, ส่งตรวจ, ส่งกลับแก้ไข, ฉบับร่าง)
 * 3. แถบเปอร์เซ็นต์ความก้าวหน้า (Completion Rate Progress Bar)
 * 4. ตารางเมทริกซ์แจกแจงสถานะละเอียดครบทุกข้อเกณฑ์ของ AUN-QA V4.0
 * 5. ปุ่มพิมพ์รายงาน (Print View) เพื่อนำเสนอต่อคณะกรรมการประกันคุณภาพ
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API
import {
  FileCheck2,
  Printer,
  TrendingUp,
  Award,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  CheckCircle
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge'; // คอมโพเนนต์ป้ายแสดงสถานะ

const TrackingDashboard = () => {
  // State จัดการตัวกรองหลักสูตรและปีการศึกษา
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState(['2567', '2566']);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('2567');

  // State สรุปสถิติความก้าวหน้า
  const [stats, setStats] = useState({
    totalCriteria: 0,
    recordedCount: 0,
    notStartedCount: 0,
    draftCount: 0,
    submittedCount: 0,
    returnedCount: 0,
    confirmedCount: 0,
    completionRate: 0
  });

  // State รายการเกณฑ์และแผนผังบันทึก
  const [criteriaList, setCriteriaList] = useState([]);
  const [recordsMap, setRecordsMap] = useState({});
  const [loading, setLoading] = useState(true);

  // โหลดรายการหลักสูตรและปีการศึกษาเริ่มต้น
  useEffect(() => {
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
        console.error('Failed to load courses/years:', err);
      }
    };
    fetchMeta();
  }, []);

  // โหลดสถิติและข้อมูลเกณฑ์เมื่อเปลี่ยนหลักสูตรหรือปีการศึกษา
  useEffect(() => {
    if (!selectedCourse || !selectedYear) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsRes, critRes, recRes] = await Promise.all([
          api.get(`/records/stats/dashboard?course_id=${selectedCourse}&academic_year=${selectedYear}`),
          api.get(`/criteria?course_id=${selectedCourse}&academic_year=${selectedYear}`),
          api.get(`/records?course_id=${selectedCourse}&academic_year=${selectedYear}`)
        ]);

        setStats(statsRes.data);
        setCriteriaList(critRes.data);

        const map = {};
        recRes.data.forEach((r) => {
          const cId = r.criteria_id?._id || r.criteria_id;
          map[cId] = r;
        });
        setRecordsMap(map);
      } catch (err) {
        console.error('Failed to load tracking data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCourse, selectedYear]);

  // ฟังก์ชันสั่งพิมพ์รายงานผ่านเบราว์เซอร์
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ ตัวกรอง และปุ่มพิมพ์รายงาน ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ติดตามการบันทึกข้อมูลและสถานะการประเมิน AUN-QA
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            รายงานความก้าวหน้ารายข้อเกณฑ์ตามเกณฑ์ AUN-QA Version 4.0
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-purple-500"
          >
            {years.map(y => (
              <option key={y} value={y}>ปีการศึกษา {y}</option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-purple-500 max-w-xs truncate"
          >
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.course_name}</option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-sm flex items-center gap-2 transition"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* ==================== ส่วนที่ 2: การ์ดตัวชี้วัดสถิติ 5 มิติ ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 text-center shadow-xs">
          <div className="text-xs font-black text-slate-600 uppercase">ข้อเกณฑ์ทั้งหมด</div>
          <div className="text-3xl font-black text-slate-900 mt-1">{stats.totalCriteria}</div>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-400 text-center shadow-xs">
          <div className="text-xs font-black text-emerald-800 uppercase">ยืนยันผลสำเร็จ</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{stats.confirmedCount}</div>
        </div>

        <div className="bg-blue-50 p-4 rounded-2xl border-2 border-blue-400 text-center shadow-xs">
          <div className="text-xs font-black text-blue-900 uppercase">ส่งตรวจแล้ว</div>
          <div className="text-3xl font-black text-blue-700 mt-1">{stats.submittedCount}</div>
        </div>

        <div className="bg-rose-50 p-4 rounded-2xl border-2 border-rose-400 text-center shadow-xs">
          <div className="text-xs font-black text-rose-900 uppercase">ส่งกลับให้แก้ไข</div>
          <div className="text-3xl font-black text-rose-700 mt-1">{stats.returnedCount}</div>
        </div>

        <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-400 text-center col-span-2 md:col-span-1 shadow-xs">
          <div className="text-xs font-black text-amber-900 uppercase">ฉบับร่าง</div>
          <div className="text-3xl font-black text-amber-600 mt-1">{stats.draftCount}</div>
        </div>
      </div>

      {/* ==================== ส่วนที่ 3: แถบแสดงอัตราความก้าวหน้าภาพรวม ==================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-black text-slate-900">ความก้าวหน้าการรายงานประเมินตนเอง</span>
          <span className="text-sm font-black text-emerald-700">{stats.completionRate}%</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex border border-slate-300">
          <div
            style={{ width: `${stats.totalCriteria ? (stats.confirmedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-emerald-500"
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.submittedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-blue-600"
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.returnedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-rose-500"
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.draftCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-amber-400"
          />
        </div>
      </div>

      {/* ==================== ส่วนที่ 4: ตารางเมทริกซ์ติดตามสถานะรายเกณฑ์ AUN-QA V4.0 ==================== */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-purple-600 stroke-[2.5]" />
            ตารางติดตามสถานะรายข้อเกณฑ์ AUN-QA Version 4.0
          </h2>
          <span className="text-xs font-bold text-slate-600">ปีการศึกษา {selectedYear}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-20">เกณฑ์</th>
                  <th className="py-3.5 px-4">ชื่อเกณฑ์และสาระสำคัญ</th>
                  <th className="py-3.5 px-4 w-36">สถานะ</th>
                  <th className="py-3.5 px-4 w-28">หลักฐาน</th>
                  <th className="py-3.5 px-4">ผู้รับผิดชอบ / ผู้ตรวจ</th>
                  <th className="py-3.5 px-4">ความคิดเห็นล่าสุด</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {criteriaList.map((crit) => {
                  const record = recordsMap[crit._id];
                  const status = record?.status || 'not_started';
                  const evidenceCount = record?.evidences?.length || 0;

                  return (
                    <tr key={crit._id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-black text-blue-700 whitespace-nowrap">
                        {crit.criteria_no}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {crit.criteria_name}
                        </div>
                        <div className="text-[11px] font-medium text-slate-600 mt-0.5 line-clamp-1">
                          {crit.description}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {status === 'not_started' ? (
                          <span className="text-xs px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 font-bold border border-slate-300">
                            ยังไม่เริ่ม
                          </span>
                        ) : (
                          <StatusBadge status={status} />
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700">
                        {evidenceCount > 0 ? (
                          <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            {evidenceCount} รายการ
                          </span>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-slate-700">
                        {record?.created_by?.full_name ? (
                          <div>
                            <div className="font-bold">ผู้เขียน: {record.created_by.full_name}</div>
                            {record.reviewed_by?.full_name && (
                              <div className="text-purple-700 font-bold mt-0.5">
                                ผู้ตรวจ: {record.reviewed_by.full_name}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 font-bold">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-semibold text-slate-700 max-w-xs truncate">
                        {record?.review_comment || (record?.description ? 'มีรายงานผลแล้ว' : '-')}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingDashboard;
