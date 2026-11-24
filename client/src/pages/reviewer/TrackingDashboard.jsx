/**
 * ====================================================================================
 * TrackingDashboard.jsx (หน้าติดตามความก้าวหน้าและรายงานสรุปผลการประเมิน AUN-QA V4.0)
 * ====================================================================================
 * หน้าจอสำหรับผู้รับผิดชอบ AUN-QA, อาจารย์ประจำหลักสูตร และผู้บริหาร:
 * 1. ตัวกรองเลือกดูตามปีการศึกษาและหลักสูตร
 * 2. การ์ดตัวชี้วัดสถิติ 5 มิติ (เกณฑ์ทั้งหมด, ยืนยันผลสำเร็จ, ส่งตรวจ, ส่งกลับแก้ไข, ฉบับร่าง)
 * 3. แถบเปอร์เซ็นต์ความก้าวหน้าภาพรวม (Completion Rate Progress Bar)
 * 4. *** บทสรุปรายงานผลการประเมินตนเองภาพรวม (Executive Summary Report) ***
 *    - สรุปผลความพร้อมการประเมินของหลักสูตร
 *    - ตารางสรุปผลการประเมินเปรียบเทียบครบทั้ง 8 หมวดของเกณฑ์ AUN-QA V4.0
 *    - จุดเด่นและด้านที่ควรปรับปรุงพัฒนา
 * 5. ตารางเมทริกซ์แจกแจงสถานะละเอียดครบทุกข้อเกณฑ์ พร้อมตัวหนังสืออ่านง่าย คมชัด
 * 6. หัวเอกสารและช่องลงนามสำหรับพิมพ์รายงานอย่างเป็นทางการ (Print View)
 * ====================================================================================
 */

import React, { useState, useEffect, useMemo } from 'react';
import api from '../../api/axios';
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
  CheckCircle,
  BarChart3,
  BookOpen,
  CheckSquare,
  FileText,
  ShieldCheck,
  Building2,
  Users,
  GraduationCap,
  FileDown,
  ChevronDown,
  Download
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import logoImg from '../../assets/logo.png';
import { downloadElementAsPDF } from '../../utils/pdfExport';

// รายชื่อหมวดเกณฑ์มาตรฐาน AUN-QA Version 4.0 ทั้ง 8 หมวด
const AUN_QA_CATEGORIES = [
  { no: 1, name: 'ผลลัพธ์การเรียนรู้ที่คาดหวัง (Expected Learning Outcomes)', short: 'ELOs' },
  { no: 2, name: 'โครงสร้างและเนื้อหาหลักสูตร (Programme Structure & Content)', short: 'โครงสร้างหลักสูตร' },
  { no: 3, name: 'กลยุทธ์การจัดการเรียนการสอน (Teaching & Learning Approach)', short: 'การเรียนการสอน' },
  { no: 4, name: 'การประเมินผลผู้เรียน (Student Assessment)', short: 'การประเมินผู้เรียน' },
  { no: 5, name: 'คุณภาพบุคลากรสายวิชาการ (Academic Staff)', short: 'อาจารย์ผู้สอน' },
  { no: 6, name: 'การบริการและการสนับสนุนนักศึกษา (Student Support Services)', short: 'การสนับสนุนนักศึกษา' },
  { no: 7, name: 'สิ่งอำนวยความสะดวกและโครงสร้างพื้นฐาน (Facilities & Infrastructure)', short: 'สิ่งอำนวยความสะดวก' },
  { no: 8, name: 'ผลลัพธ์และการปรับปรุงคุณภาพอย่างต่อเนื่อง (Output & Outcomes)', short: 'ผลลัพธ์และการพัฒนา' }
];

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

  // แท็บมุมมอง: 'all' = ดูทั้งหมด, 'summary' = เฉพาะบทสรุปรายงาน, 'table' = เฉพาะตารางรายเกณฑ์
  const [activeTab, setActiveTab] = useState('all');

  // ควบคุมเมนู Dropdown ส่งออก PDF
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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

  // คำนวณสรุปผลการประเมินแยกตามรายหมวด AUN-QA 8 หมวด
  const categoryStats = useMemo(() => {
    return AUN_QA_CATEGORIES.map(cat => {
      // ค้นหาเกณฑ์ที่ขึ้นต้นด้วยเลขหมวด เช่น "1.1", "1.2"
      const items = criteriaList.filter(c => c.criteria_no && c.criteria_no.startsWith(`${cat.no}.`));
      const total = items.length;
      let confirmed = 0;
      let submitted = 0;
      let draft = 0;
      let returned = 0;
      let notStarted = 0;
      let totalEvidences = 0;

      items.forEach(c => {
        const rec = recordsMap[c._id];
        const st = rec?.status || 'not_started';
        if (st === 'confirmed') confirmed++;
        else if (st === 'submitted') submitted++;
        else if (st === 'returned') returned++;
        else if (st === 'draft') draft++;
        else notStarted++;

        if (rec?.evidences) {
          totalEvidences += rec.evidences.length;
        }
      });

      const completionPercent = total > 0 ? Math.round((confirmed / total) * 100) : 0;
      const progressPercent = total > 0 ? Math.round(((confirmed + submitted) / total) * 100) : 0;

      return {
        ...cat,
        total,
        confirmed,
        submitted,
        draft,
        returned,
        notStarted,
        totalEvidences,
        completionPercent,
        progressPercent
      };
    });
  }, [criteriaList, recordsMap]);

  // ข้อมูลหลักสูตรปัจจุบันที่เลือก
  const currentCourse = useMemo(() => {
    return courses.find(c => c._id === selectedCourse) || {
      course_name: 'วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล'
    };
  }, [courses, selectedCourse]);

  // วันที่ปัจจุบันสำหรับรายงาน
  const currentDateFormatted = useMemo(() => {
    const d = new Date();
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear() + 543}`;
  }, []);

  // ฟังก์ชันดาวน์โหลดไฟล์ PDF ตรงลงเครื่องคอมพิวเตอร์หรือโทรศัพท์มือถือทันที
  const handleDirectDownloadPDF = async (mode = 'all') => {
    setShowExportMenu(false);
    setDownloadingPDF(true);

    const modeName =
      mode === 'summary' ? 'บทสรุปผู้บริหาร_8หมวด' : mode === 'table' ? 'ตารางรายเกณฑ์' : 'รายงานฉบับสมบูรณ์';
    const cleanCourse = currentCourse.course_name ? currentCourse.course_name.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '_') : 'หลักสูตร';
    const filename = `รายงาน_AUN-QA_V4_${selectedYear}_${modeName}_${cleanCourse}`;

    // ปรับแท็บให้แสดงเฉพาะส่วนที่เลือกชั่วคราวขณะสร้าง PDF
    const prevTab = activeTab;
    if (mode !== 'all') {
      setActiveTab(mode);
    }

    // หน่วงเวลาเล็กน้อยเพื่อให้ DOM เรนเดอร์เสร็จสมบูรณ์
    await new Promise(r => setTimeout(r, 250));

    try {
      await downloadElementAsPDF('aun-qa-report-content', filename);
    } finally {
      setActiveTab(prevTab);
      setDownloadingPDF(false);
    }
  };

  // ฟังก์ชันสั่งพิมพ์และส่งออกรายงานเป็น PDF ผ่าน Browser Print
  const handleExportPDF = (mode = 'all') => {
    setShowExportMenu(false);
    const prevTitle = document.title;
    const modeName =
      mode === 'summary' ? 'บทสรุปผู้บริหาร_8หมวด' : mode === 'table' ? 'ตารางรายเกณฑ์' : 'รายงานฉบับสมบูรณ์';
    const cleanCourse = currentCourse.course_name ? currentCourse.course_name.replace(/[^\u0E00-\u0E7Fa-zA-Z0-9]/g, '_') : 'หลักสูตร';
    
    // กำหนดชื่อไฟล์เริ่มต้นเมื่อผู้ใช้กดบันทึกเป็น PDF ในเบราว์เซอร์
    document.title = `รายงาน_AUN-QA_V4_${selectedYear}_${modeName}_${cleanCourse}`;

    const prevTab = activeTab;
    if (mode !== 'all') {
      setActiveTab(mode);
    }

    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.title = prevTitle;
        setActiveTab(prevTab);
      }, 1000);
    }, 150);
  };

  const handlePrint = () => {
    handleExportPDF('all');
  };

  // ระดับความพร้อมของหลักสูตร
  const readinessLevel = useMemo(() => {
    const rate = stats.completionRate || 0;
    if (rate >= 80) return { text: 'ความพร้อมระดับสูง (พร้อมรับการตรวจประเมิน)', color: 'text-emerald-700 bg-emerald-100 border-emerald-400' };
    if (rate >= 50) return { text: 'ความพร้อมระดับปานกลาง (อยู่ระหว่างการประเมินและปรับปรุง)', color: 'text-blue-700 bg-blue-100 border-blue-400' };
    if (rate >= 20) return { text: 'ความพร้อมระดับเริ่มต้น (อยู่ระหว่างรวบรวมหลักฐาน)', color: 'text-amber-700 bg-amber-100 border-amber-400' };
    return { text: 'ยังไม่พร้อม (เริ่มกระบวนการจัดทำรายงาน)', color: 'text-rose-700 bg-rose-100 border-rose-400' };
  }, [stats.completionRate]);

  return (
    <div className="space-y-6 w-full">
      {/* ==================== หัวเอกสารสำหรับสั่งพิมพ์รายงานอย่างเป็นทางการ (Print-Only) ==================== */}
      <div className="hidden print:block pb-6 mb-6 border-b-2 border-slate-900 text-slate-900">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img src={logoImg} alt="โลโก้" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                รายงานผลการประเมินตนเองตามเกณฑ์ AUN-QA Version 4.0 (Executive Summary)
              </h1>
              <p className="text-sm font-semibold text-slate-700 mt-1">
                {currentCourse.course_name} • สาขาเทคโนโลยีคอมพิวเตอร์ คณะวิทยาศาสตร์และเทคโนโลยี
              </p>
            </div>
          </div>
          <div className="text-right text-xs font-semibold text-slate-600">
            <div>ปีการศึกษา: <strong>{selectedYear}</strong></div>
            <div>วันที่ออกรายงาน: <strong>{currentDateFormatted}</strong></div>
          </div>
        </div>
      </div>

      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ ตัวกรอง และปุ่มพิมพ์รายงาน ==================== */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 no-print bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300">
              AUN-QA Version 4.0
            </span>
            <span className="text-xs font-bold text-slate-500">ปีการศึกษา {selectedYear}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            รายงานและติดตามสถานะการประเมินตนเอง (QA Report)
          </h1>
          <p className="text-sm sm:text-base font-medium text-slate-700 mt-1">
            สรุปผลการประเมินความก้าวหน้าทั้ง 8 หมวด และตรวจสอบความพร้อมสำหรับรายงานประเมินตนเอง (SAR)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* ตัวเลือกปีการศึกษา */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">ปี:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3.5 py-2 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500"
            >
              {years.map(y => (
                <option key={y} value={y}>ปีการศึกษา {y}</option>
              ))}
            </select>
          </div>

          {/* ตัวเลือกหลักสูตร */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-600">หลักสูตร:</span>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="px-3.5 py-2 border-2 border-slate-300 rounded-xl text-sm font-bold bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 max-w-xs truncate"
            >
              {courses.map(c => (
                <option key={c._id} value={c._id}>{c.course_name}</option>
              ))}
            </select>
          </div>

          {/* ปุ่มดาวน์โหลดไฟล์ PDF ตรงลงเครื่องคอม/มือถือ พร้อมตัวเลือก */}
          <div className="relative">
            <div className="inline-flex rounded-xl shadow-md overflow-hidden">
              <button
                onClick={() => handleDirectDownloadPDF('all')}
                disabled={downloadingPDF}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-sm font-extrabold flex items-center gap-2 transition"
                title="คลิกเพื่อดาวน์โหลดไฟล์ PDF ลงเครื่องคอมหรือมือถือทันที"
              >
                {downloadingPDF ? (
                  <Clock className="w-4 h-4 animate-spin" />
                ) : (
                  <FileDown className="w-4 h-4 stroke-[2.5]" />
                )}
                <span>{downloadingPDF ? 'กำลังสร้างไฟล์ PDF...' : 'ดาวน์โหลดไฟล์ PDF'}</span>
              </button>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={downloadingPDF}
                className="px-2.5 py-2.5 bg-rose-700 hover:bg-rose-800 disabled:bg-rose-500 text-white border-l border-rose-500 transition"
                title="เลือกรูปแบบรายงาน PDF ที่ต้องการดาวน์โหลด"
              >
                <ChevronDown className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* เมนู Dropdown เลือกรูปแบบรายงาน PDF */}
            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-3.5 py-1.5 text-xs font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  เลือกรูปแบบไฟล์ PDF สำหรับดาวน์โหลด
                </div>
                <button
                  onClick={() => handleDirectDownloadPDF('all')}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-3 transition"
                >
                  <FileDown className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <div>
                    <div className="font-extrabold">ดาวน์โหลดรายงานฉบับสมบูรณ์ (PDF)</div>
                    <div className="text-xs text-slate-500 font-normal">บทสรุป 8 หมวด + ตารางเกณฑ์ละเอียดครบทุกข้อ</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDirectDownloadPDF('summary')}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-3 transition"
                >
                  <BarChart3 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div>
                    <div className="font-extrabold">ดาวน์โหลดเฉพาะบทสรุป 8 หมวด (PDF)</div>
                    <div className="text-xs text-slate-500 font-normal">ตารางสรุป 8 หมวด + การวิเคราะห์ความพร้อม</div>
                  </div>
                </button>
                <button
                  onClick={() => handleDirectDownloadPDF('table')}
                  className="w-full text-left px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition"
                >
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div>
                    <div className="font-extrabold">ดาวน์โหลดเฉพาะตารางรายเกณฑ์ (PDF)</div>
                    <div className="text-xs text-slate-500 font-normal">สถานะและจำนวนหลักฐานย่อยทั้งหมด</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* ปุ่มพิมพ์รายงาน */}
          <button
            onClick={() => handleExportPDF('all')}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm flex items-center gap-2 transition hover:scale-102"
            title="พิมพ์รายงานออกเครื่องพิมพ์หรือบันทึกผ่านเบราว์เซอร์"
          >
            <Printer className="w-4 h-4 stroke-[2.5]" />
            พิมพ์รายงาน
          </button>
        </div>
      </div>

      {/* ==================== แถบเลือกสลับมุมมองหน้าจอ (Tabs) ==================== */}
      <div className="flex items-center gap-2 no-print border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          แสดงภาพรวมทั้งหมด
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'summary'
              ? 'bg-purple-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          บทสรุปรายงานผล 8 หมวด
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
            activeTab === 'table'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          ตารางแจกแจงเกณฑ์ละเอียด
        </button>
      </div>

      {/* ==================== ส่วนที่ 2: การ์ดตัวชี้วัดสถิติ 5 มิติ ==================== */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-white p-4.5 rounded-2xl border-2 border-slate-300 text-center shadow-xs">
          <div className="text-xs font-extrabold text-slate-600 uppercase tracking-wide">เกณฑ์ทั้งหมด</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-1">{stats.totalCriteria}</div>
          <div className="text-xs text-slate-500 font-semibold mt-0.5">8 หมวดเกณฑ์</div>
        </div>

        <div className="bg-emerald-50 p-4.5 rounded-2xl border-2 border-emerald-400 text-center shadow-xs">
          <div className="text-xs font-extrabold text-emerald-800 uppercase tracking-wide">ยืนยันผลสำเร็จ</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-700 mt-1">{stats.confirmedCount}</div>
          <div className="text-xs text-emerald-700 font-bold mt-0.5">
            {stats.totalCriteria ? Math.round((stats.confirmedCount / stats.totalCriteria) * 100) : 0}% ของเกณฑ์
          </div>
        </div>

        <div className="bg-blue-50 p-4.5 rounded-2xl border-2 border-blue-400 text-center shadow-xs">
          <div className="text-xs font-extrabold text-blue-900 uppercase tracking-wide">ส่งตรวจแล้ว (รอตรวจ)</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-blue-700 mt-1">{stats.submittedCount}</div>
          <div className="text-xs text-blue-700 font-bold mt-0.5">รอคณะกรรมการยืนยัน</div>
        </div>

        <div className="bg-rose-50 p-4.5 rounded-2xl border-2 border-rose-400 text-center shadow-xs">
          <div className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">ส่งกลับให้แก้ไข</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-rose-700 mt-1">{stats.returnedCount}</div>
          <div className="text-xs text-rose-700 font-bold mt-0.5">ต้องปรับปรุงข้อมูล/หลักฐาน</div>
        </div>

        <div className="bg-amber-50 p-4.5 rounded-2xl border-2 border-amber-400 text-center col-span-2 sm:col-span-1 shadow-xs">
          <div className="text-xs font-extrabold text-amber-900 uppercase tracking-wide">ฉบับร่าง (ยังไม่ส่ง)</div>
          <div className="text-3xl sm:text-4xl font-extrabold text-amber-600 mt-1">{stats.draftCount}</div>
          <div className="text-xs text-amber-700 font-bold mt-0.5">อาจารย์กำลังจัดทำ</div>
        </div>
      </div>

      {/* ==================== ส่วนที่ 3: แถบแสดงอัตราความก้าวหน้าภาพรวม ==================== */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 stroke-[2.5]" />
            <span className="text-base font-extrabold text-slate-900">อัตราความสำเร็จการจัดทำรายงานประเมินตนเอง</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${readinessLevel.color}`}>
              {readinessLevel.text}
            </span>
            <span className="text-xl font-extrabold text-emerald-700">{stats.completionRate}%</span>
          </div>
        </div>

        <div className="w-full bg-slate-200 rounded-full h-4 overflow-hidden flex border border-slate-300">
          <div
            style={{ width: `${stats.totalCriteria ? (stats.confirmedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`ยืนยันผลแล้ว ${stats.confirmedCount} ข้อ`}
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.submittedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-blue-600 transition-all duration-500"
            title={`ส่งตรวจแล้ว ${stats.submittedCount} ข้อ`}
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.returnedCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-rose-500 transition-all duration-500"
            title={`ส่งกลับแก้ไข ${stats.returnedCount} ข้อ`}
          />
          <div
            style={{ width: `${stats.totalCriteria ? (stats.draftCount / stats.totalCriteria) * 100 : 0}%` }}
            className="bg-amber-400 transition-all duration-500"
            title={`ฉบับร่าง ${stats.draftCount} ข้อ`}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between text-xs font-semibold text-slate-600 mt-3 pt-2 border-t border-slate-100 gap-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> ยืนยันผลสำเร็จ ({stats.confirmedCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-600"></span> ส่งตรวจแล้ว ({stats.submittedCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500"></span> ส่งกลับแก้ไข ({stats.returnedCount})</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> ฉบับร่าง ({stats.draftCount})</span>
          </div>
          <span className="text-slate-500">ความก้าวหน้าคำนวณจากเกณฑ์ที่ได้รับการยืนยันผลสำเร็จ</span>
        </div>
      </div>

      {/* ==================================================================================== */}
      {/* ส่วนที่ 4: *** บทสรุปรายงานผลการประเมินตนเองภาพรวม 8 หมวด (Executive Summary) *** */}
      {/* ==================================================================================== */}
      {(activeTab === 'all' || activeTab === 'summary') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-purple-700 stroke-[2.5]" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  บทสรุปผลการประเมินตนเองตามเกณฑ์ AUN-QA Version 4.0 ครบทั้ง 8 หมวด
                </h2>
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                ตารางสรุปสถานะความพร้อมและการดำเนินงานรายหมวดสำหรับนำเสนอต่อคณะกรรมการประกันคุณภาพ
              </p>
            </div>
            <span className="bg-purple-700 text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs self-start sm:self-auto">
              สรุปผลผู้บริหาร (Executive Summary)
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-16 text-center">หมวด</th>
                  <th className="py-3.5 px-4 min-w-[280px]">ชื่อหมวดเกณฑ์ AUN-QA V4.0</th>
                  <th className="py-3.5 px-3 text-center">จำนวนเกณฑ์</th>
                  <th className="py-3.5 px-3 text-center text-emerald-800">ยืนยันแล้ว</th>
                  <th className="py-3.5 px-3 text-center text-blue-800">ส่งตรวจ</th>
                  <th className="py-3.5 px-3 text-center text-amber-800">ร่าง/แก้ไข</th>
                  <th className="py-3.5 px-3 text-center">หลักฐานแนบ</th>
                  <th className="py-3.5 px-4 min-w-[180px]">อัตราสำเร็จ (%)</th>
                  <th className="py-3.5 px-4 text-center">สถานะความพร้อม</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {categoryStats.map((cat) => (
                  <tr key={cat.no} className="hover:bg-purple-50/30 transition">
                    <td className="py-3.5 px-4 text-center font-extrabold text-purple-800 bg-purple-50/50">
                      {cat.no}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 text-sm sm:text-base">
                        {cat.name}
                      </div>
                      <div className="text-xs text-slate-600 font-semibold mt-0.5">
                        คำสำคัญ: {cat.short}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-center font-extrabold text-slate-900">
                      {cat.total}
                    </td>
                    <td className="py-3.5 px-3 text-center font-extrabold text-emerald-700 bg-emerald-50/40">
                      {cat.confirmed}
                    </td>
                    <td className="py-3.5 px-3 text-center font-extrabold text-blue-700 bg-blue-50/40">
                      {cat.submitted}
                    </td>
                    <td className="py-3.5 px-3 text-center font-extrabold text-amber-700 bg-amber-50/40">
                      {cat.draft + cat.returned}
                    </td>
                    <td className="py-3.5 px-3 text-center font-bold text-slate-700">
                      {cat.totalEvidences > 0 ? (
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-bold text-slate-800">
                          {cat.totalEvidences} ไฟล์
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div
                            style={{ width: `${cat.completionPercent}%` }}
                            className={`h-full ${
                              cat.completionPercent === 100
                                ? 'bg-emerald-500'
                                : cat.completionPercent > 0
                                ? 'bg-blue-600'
                                : 'bg-slate-300'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-800 w-10 text-right">
                          {cat.completionPercent}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {cat.completionPercent === 100 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle className="w-3.5 h-3.5" />
                          สมบูรณ์ 100%
                        </span>
                      ) : cat.progressPercent > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
                          <Clock className="w-3.5 h-3.5" />
                          กำลังดำเนินการ
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-black bg-slate-100 text-slate-600 border border-slate-300">
                          ยังไม่เริ่ม
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* สรุปจุดเด่นและข้อเสนอแนะในการปรับปรุง */}
          <div className="p-5 bg-slate-50 border-t-2 border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border-2 border-emerald-300">
              <h3 className="text-sm font-extrabold text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                จุดเด่นและหมวดที่มีผลการดำเนินงานสำเร็จครบถ้วน:
              </h3>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm font-semibold text-emerald-950 list-disc list-inside">
                {categoryStats.filter(c => c.completionPercent === 100).length > 0 ? (
                  categoryStats
                    .filter(c => c.completionPercent === 100)
                    .map(c => (
                      <li key={c.no}>
                        หมวดที่ {c.no}: {c.name} (ยืนยันผลแล้วครบ 100%)
                      </li>
                    ))
                ) : (
                  <li className="text-slate-600 list-none">
                    - ยังไม่มีหมวดที่ยืนยันผลสำเร็จครบ 100% (กำลังอยู่ในขั้นตอนการรวบรวมและส่งตรวจ)
                  </li>
                )}
              </ul>
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300">
              <h3 className="text-sm font-extrabold text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                หมวดที่ควรเร่งรัดติดตามการจัดทำข้อมูลและหลักฐาน:
              </h3>
              <ul className="mt-2 space-y-1 text-xs sm:text-sm font-semibold text-amber-950 list-disc list-inside">
                {categoryStats.filter(c => c.completionPercent < 100).slice(0, 3).map(c => (
                  <li key={c.no}>
                    หมวดที่ {c.no}: {c.short} (สำเร็จแล้ว {c.completionPercent}%, รอส่งตรวจ/แก้ไข {c.total - c.confirmed} ข้อ)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================================== */}
      {/* ส่วนที่ 5: ตารางเมทริกซ์แจกแจงสถานะรายข้อเกณฑ์ AUN-QA V4.0 ละเอียด */}
      {/* ==================================================================================== */}
      {(activeTab === 'all' || activeTab === 'table') && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-blue-600 stroke-[2.5]" />
                <h2 className="text-lg font-extrabold text-slate-900">
                  ตารางแจกแจงสถานะรายข้อเกณฑ์ AUN-QA Version 4.0 อย่างละเอียด
                </h2>
              </div>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">
                รายการข้อเกณฑ์ย่อยทั้งหมด {criteriaList.length} ข้อ พร้อมสถานะและหลักฐานอ้างอิง
              </p>
            </div>
            <span className="text-xs font-bold text-slate-600 bg-white px-3 py-1 rounded-lg border border-slate-300 self-start sm:self-auto">
              ปีการศึกษา {selectedYear}
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-base font-bold text-slate-500">
              กำลังโหลดข้อมูลตารางรายงาน...
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                    <th className="py-3.5 px-4 w-20 text-center">เกณฑ์ข้อ</th>
                    <th className="py-3.5 px-4 min-w-[320px]">ชื่อข้อเกณฑ์และสาระสำคัญ</th>
                    <th className="py-3.5 px-4 w-40 text-center">สถานะประเมิน</th>
                    <th className="py-3.5 px-4 w-32 text-center">หลักฐานแนบ</th>
                    <th className="py-3.5 px-4 min-w-[180px]">ผู้รับผิดชอบ / ผู้ตรวจ</th>
                    <th className="py-3.5 px-4 min-w-[220px]">ข้อคิดเห็น / คำอธิบายล่าสุด</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-slate-100 text-sm">
                  {criteriaList.map((crit) => {
                    const record = recordsMap[crit._id];
                    const status = record?.status || 'not_started';
                    const evidenceCount = record?.evidences?.length || 0;

                    return (
                      <tr key={crit._id} className="hover:bg-slate-50 transition">
                        <td className="py-4 px-4 font-black text-blue-700 text-center whitespace-nowrap bg-blue-50/30">
                          {crit.criteria_no}
                        </td>
                        <td className="py-4 px-4">
                          <div className="font-extrabold text-slate-900 text-sm sm:text-base leading-snug">
                            {crit.criteria_name}
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-slate-700 mt-1 leading-relaxed">
                            {crit.description}
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {status === 'not_started' ? (
                            <span className="text-xs px-2.5 py-1 rounded-md bg-slate-200 text-slate-700 font-extrabold border border-slate-300">
                              ยังไม่เริ่มบันทึก
                            </span>
                          ) : (
                            <StatusBadge status={status} />
                          )}
                        </td>
                        <td className="py-4 px-4 text-center whitespace-nowrap">
                          {evidenceCount > 0 ? (
                            <span className="font-extrabold text-blue-800 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200 text-xs">
                              {evidenceCount} รายการ
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs font-semibold text-slate-800">
                          {record?.created_by?.full_name ? (
                            <div>
                              <div>ผู้จัดทำ: <strong>{record.created_by.full_name}</strong></div>
                              {record.reviewed_by?.full_name && (
                                <div className="text-purple-700 font-bold mt-1">
                                  ผู้ตรวจ: {record.reviewed_by.full_name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs sm:text-sm font-medium text-slate-700">
                          {record?.review_comment ? (
                            <div className="p-2 bg-rose-50 border border-rose-300 rounded-lg text-rose-900 font-semibold">
                              {record.review_comment}
                            </div>
                          ) : record?.description ? (
                            <div className="line-clamp-2 text-slate-800">
                              {record.description}
                            </div>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ==================== ส่วนช่องลงนามรับรองผลรายงาน (สำหรับสั่งพิมพ์ Print-Only) ==================== */}
      <div className="hidden print:block pt-12 mt-8 border-t-2 border-slate-300 page-break">
        <h3 className="text-base font-extrabold text-slate-900 text-center mb-8">
          การรับรองผลการประเมินตนเองตามเกณฑ์ AUN-QA Version 4.0
        </h3>
        <div className="grid grid-cols-3 gap-6 text-center text-xs font-semibold text-slate-800">
          <div>
            <div className="h-16 border-b border-dotted border-slate-400 mb-2"></div>
            <div>( .............................................................. )</div>
            <div className="font-bold mt-1">ประธานกรรมการตรวจประเมิน</div>
            <div className="text-slate-500">วันที่ ......../......../............</div>
          </div>
          <div>
            <div className="h-16 border-b border-dotted border-slate-400 mb-2"></div>
            <div>( .............................................................. )</div>
            <div className="font-bold mt-1">อาจารย์ผู้รับผิดชอบหลักสูตร</div>
            <div className="text-slate-500">วันที่ ......../......../............</div>
          </div>
          <div>
            <div className="h-16 border-b border-dotted border-slate-400 mb-2"></div>
            <div>( .............................................................. )</div>
            <div className="font-bold mt-1">คณบดีคณะวิทยาศาสตร์และเทคโนโลยี</div>
            <div className="text-slate-500">วันที่ ......../......../............</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackingDashboard;
