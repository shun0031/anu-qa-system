/**
 * ====================================================================================
 * Dashboard.jsx (หน้ากระดานสรุปผลภาพรวมระบบ AUN-QA)
 * ====================================================================================
 * หน้าหลักที่แสดงหลังจากผู้ใช้งานเข้าสู่ระบบ โดยจะแสดง:
 * 1. แบนเนอร์ทักทายและปุ่มทางลัดตามบทบาทของผู้ใช้งาน (อาจารย์, ผู้รับผิดชอบ AUN-QA, แอดมิน)
 * 2. การ์ดตัวชี้วัดสถิติ 4 สถานะ (ยืนยันผลสำเร็จ, ส่งตรวจแล้ว, ส่งกลับแก้ไข, ฉบับร่าง)
 * 3. แถบความคืบหน้าภาพรวม (Progress Bar) และอัตราความสำเร็จ (Completion Rate)
 * 4. ภาพรวมเกณฑ์มาตรฐาน AUN-QA ทั้ง 8 หมวด
 * 5. รายการข้อมูลและหลักฐานที่บันทึกล่าสุดในระบบ
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Hook สำหรับดึงข้อมูลผู้ใช้ปัจจุบันและสิทธิ์การใช้งาน
import api from '../api/axios'; // Axios instance สำหรับเรียก REST API ไปยังเซิร์ฟเวอร์
import {
  FileCheck2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileText,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge'; // คอมโพเนนต์ป้ายแสดงสถานะพร้อมสีที่ชัดเจน

const Dashboard = () => {
  // ดึงข้อมูลผู้ใช้ปัจจุบันและ flag ระบุสิทธิ์ (Admin, Lecturer, Reviewer) จาก AuthContext
  const { user, isAdmin, isLecturer, isReviewer } = useAuth();

  // State สำหรับเก็บข้อมูลสถิติต่างๆ ของระบบที่ได้จาก API
  const [stats, setStats] = useState({
    totalCriteria: 0,     // จำนวนเกณฑ์ทั้งหมด
    recordedCount: 0,     // จำนวนเกณฑ์ที่มีการบันทึกแล้ว
    notStartedCount: 0,   // จำนวนเกณฑ์ที่ยังไม่ได้เริ่มบันทึก
    draftCount: 0,        // จำนวนเกณฑ์สถานะฉบับร่าง (Draft)
    submittedCount: 0,    // จำนวนเกณฑ์สถานะส่งตรวจ (Submitted)
    returnedCount: 0,     // จำนวนเกณฑ์สถานะส่งกลับแก้ไข (Returned)
    confirmedCount: 0,    // จำนวนเกณฑ์สถานะยืนยันผลแล้ว (Confirmed)
    totalEvidences: 0,    // จำนวนหลักฐานอ้างอิงทั้งหมด
    completionRate: 0     // อัตราความสำเร็จ (%)
  });

  // State เก็บรายการบันทึกล่าสุด 5 รายการ
  const [recentRecords, setRecentRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลสถิติและรายการบันทึกล่าสุดเมื่อโหลดหน้าจอ
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recordsRes] = await Promise.all([
          api.get('/records/stats/dashboard'),       // ดึงตัวเลขสรุปสถิติสำหรับ Dashboard
          api.get('/records?academic_year=2567')     // ดึงรายการบันทึกของปีการศึกษาปัจจุบัน
        ]);
        setStats(statsRes.data);
        setRecentRecords(recordsRes.data.slice(0, 5));
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: แบนเนอร์ทักทายและปุ่มทางลัดตามบทบาท ==================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 p-7 sm:p-9 text-white shadow-lg border border-blue-700">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3 border border-white/30 text-white">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>มาตรฐานสากลการประกันคุณภาพการศึกษา AUN-QA V4.0</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            ยินดีต้อนรับ, {user?.full_name}
          </h1>
          <p className="mt-2 text-blue-100 text-xs sm:text-sm font-medium leading-relaxed">
            ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิงสำหรับรายงานประเมินตนเอง (SAR) ตามเกณฑ์ AUN-QA Version 4.0
            หลักสูตรวิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล ประจำปีการศึกษา 2567
          </p>

          {/* ปุ่มทางลัดนำทางด่วน แยกตามบทบาทของผู้ใช้งาน */}
          <div className="mt-5 flex flex-wrap gap-2.5">
            {isLecturer && (
              <Link
                to="/my-records"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
              >
                <FileText className="w-4 h-4 stroke-[2.5]" />
                เริ่มบันทึกและแนบหลักฐาน
              </Link>
            )}
            {isReviewer && (
              <Link
                to="/reviews"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
              >
                <FileCheck2 className="w-4 h-4 stroke-[2.5]" />
                ตรวจสอบรายงานและหลักฐาน
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/users"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
              >
                <Layers className="w-4 h-4 stroke-[2.5]" />
                จัดการระบบผู้ใช้งาน
              </Link>
            )}
            <Link
              to="/tracking"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
            >
              <span>ติดตามความคืบหน้าเกณฑ์ 8 ด้าน</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </Link>
          </div>
        </div>
      </div>

      {/* ==================== ส่วนที่ 2: การ์ดตัวชี้วัดสถิติ 4 สถานะหลัก ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* การ์ดยืนยันผลสำเร็จ (Confirmed) */}
        <div className="bg-white p-5 rounded-2xl border-2 border-emerald-400 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-emerald-800 uppercase tracking-wider">ยืนยันผลสำเร็จ</p>
            <div className="text-4xl font-black text-emerald-700 mt-1">{stats.confirmedCount}</div>
            <p className="text-xs font-bold text-slate-500 mt-1">จาก {stats.totalCriteria} ข้อเกณฑ์</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-emerald-100 border-2 border-emerald-400 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        {/* การ์ดส่งแล้วรอตรวจสอบ (Submitted) */}
        <div className="bg-white p-5 rounded-2xl border-2 border-blue-400 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-blue-900 uppercase tracking-wider">ส่งแล้ว (รอตรวจ)</p>
            <div className="text-4xl font-black text-blue-700 mt-1">{stats.submittedCount}</div>
            <p className="text-xs font-bold text-slate-500 mt-1">รอ AUN-QA ตรวจสอบ</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-blue-100 border-2 border-blue-400 text-blue-700 flex items-center justify-center">
            <TrendingUp className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        {/* การ์ดส่งกลับแก้ไข (Returned) */}
        <div className="bg-white p-5 rounded-2xl border-2 border-rose-400 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-rose-900 uppercase tracking-wider">ส่งกลับแก้ไข</p>
            <div className="text-4xl font-black text-rose-700 mt-1">{stats.returnedCount}</div>
            <p className="text-xs font-bold text-slate-500 mt-1">ต้องแนบหลักฐานเพิ่ม</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-rose-100 border-2 border-rose-400 text-rose-700 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>

        {/* การ์ดฉบับร่าง (Draft) */}
        <div className="bg-white p-5 rounded-2xl border-2 border-amber-400 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-black text-amber-900 uppercase tracking-wider">ฉบับร่าง</p>
            <div className="text-4xl font-black text-amber-600 mt-1">{stats.draftCount}</div>
            <p className="text-xs font-bold text-slate-500 mt-1">อาจารย์กำลังบันทึก</p>
          </div>
          <div className="w-13 h-13 rounded-2xl bg-amber-100 border-2 border-amber-400 text-amber-700 flex items-center justify-center">
            <Clock className="w-7 h-7 stroke-[2.5]" />
          </div>
        </div>
      </div>

      {/* ==================== ส่วนที่ 3: แถบความคืบหน้ารวม (Progress Bar & Completion Rate) ==================== */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">อัตราความสำเร็จการประเมินตนเอง (Completion Rate)</h2>
            <p className="text-xs font-semibold text-slate-500">สัดส่วนเกณฑ์ที่ได้รับการยืนยันผลจากคณะกรรมการ AUN-QA</p>
          </div>
          <div className="text-right flex items-baseline gap-2">
            <span className="text-3xl font-black text-blue-700">{stats.completionRate}%</span>
            <span className="text-xs font-bold text-slate-600">({stats.confirmedCount}/{stats.totalCriteria} ข้อ)</span>
          </div>
        </div>

        {/* แถบ Progress Bar แบบแบ่งสัดส่วนตามสีสถานะ */}
        <div className="w-full bg-slate-200 rounded-full h-5 overflow-hidden flex border-2 border-slate-300 shadow-inner">
          <div
            style={{ width: `${stats.totalCriteria ? (stats.confirmedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`ยืนยันแล้ว: ${stats.confirmedCount}`}
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.submittedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-blue-600 transition-all duration-500"
            title={`ส่งตรวจ: ${stats.submittedCount}`}
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.returnedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`ส่งกลับ: ${stats.returnedCount}`}
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.draftCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-amber-400 transition-all duration-500"
            title={`ฉบับร่าง: ${stats.draftCount}`}
          />
        </div>

        {/* ป้ายคำอธิบายสัญลักษณ์สี (Legend) */}
        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-700">
          <span className="flex items-center gap-1.5 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500" /> ยืนยันแล้ว ({stats.confirmedCount})
          </span>
          <span className="flex items-center gap-1.5 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-300">
            <span className="w-3 h-3 rounded-full bg-blue-600" /> ส่งตรวจแล้ว ({stats.submittedCount})
          </span>
          <span className="flex items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-300">
            <span className="w-3 h-3 rounded-full bg-rose-500" /> ส่งกลับแก้ไข ({stats.returnedCount})
          </span>
          <span className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-300">
            <span className="w-3 h-3 rounded-full bg-amber-400" /> ฉบับร่าง ({stats.draftCount})
          </span>
          <span className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-300">
            <span className="w-3 h-3 rounded-full bg-slate-400" /> ยังไม่เริ่ม ({stats.notStartedCount})
          </span>
        </div>
      </div>

      {/* ==================== ส่วนที่ 4: แสดงเกณฑ์ 8 หมวด และกิจกรรมล่าสุด ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* รายการเกณฑ์ AUN-QA ทั้ง 8 หมวดหลัก */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">เกณฑ์ AUN-QA Version 4.0 ทั้ง 8 หมวด</h2>
              <p className="text-xs font-semibold text-slate-500">มาตรฐานคุณภาพการศึกษาในระดับหลักสูตร</p>
            </div>
            <Link to="/tracking" className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1">
              ดูรายละเอียดทั้งหมด <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { no: '1', title: 'Expected Learning Outcomes', desc: 'ผลการเรียนรู้ที่คาดหวังของหลักสูตร (ELOs)' },
              { no: '2', title: 'Programme Structure and Content', desc: 'โครงสร้างและเนื้อหาหลักสูตร' },
              { no: '3', title: 'Teaching and Learning Approach', desc: 'การจัดการเรียนการสอนแบบเน้นผู้เรียน' },
              { no: '4', title: 'Student Assessment', desc: 'การวัดและประเมินผลผู้เรียน' },
              { no: '5', title: 'Academic Staff', desc: 'คุณภาพและการพัฒนาบุคลากรสายวิชาการ' },
              { no: '6', title: 'Student Support Services', desc: 'การบริการและการสนับสนุนนักศึกษา' },
              { no: '7', title: 'Facilities and Infrastructure', desc: 'ห้องปฏิบัติการคอมพิวเตอร์และสิ่งอำนวยความสะดวก' },
              { no: '8', title: 'Output and Outcomes', desc: 'ผลผลิต ผลลัพธ์ และอัตราการมีงานทำของบัณฑิต' },
            ].map((c) => (
              <div
                key={c.no}
                className="p-3.5 rounded-xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50/80 hover:bg-blue-50/50 transition flex items-start gap-3 group"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-600 group-hover:bg-blue-700 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                  {c.no}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 group-hover:text-blue-900">{c.title}</h4>
                  <p className="text-[11px] font-medium text-slate-600 mt-0.5 leading-snug">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* รายการบันทึกและส่งรายงานล่าสุด */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-base font-black text-slate-900 mb-1">บันทึกล่าสุด</h2>
          <p className="text-xs font-semibold text-slate-500 mb-4">รายการรายงานผลและการแนบหลักฐาน</p>

          <div className="space-y-3">
            {recentRecords.length > 0 ? (
              recentRecords.map((r) => (
                <div key={r._id} className="p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">
                      เกณฑ์ {r.criteria_id?.criteria_no}
                    </span>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="text-xs font-semibold text-slate-700 line-clamp-2">
                    {r.description || 'ยังไม่มีคำอธิบาย'}
                  </p>
                  <div className="text-[11px] font-bold text-slate-500 flex items-center justify-between pt-1.5 border-t border-slate-200">
                    <span>โดย: {r.created_by?.full_name || 'อาจารย์'}</span>
                    <span className="text-blue-700">{r.evidences?.length || 0} หลักฐาน</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-xs font-bold text-slate-400">ยังไม่มีบันทึกข้อมูล</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
