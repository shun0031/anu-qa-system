/**
 * ====================================================================================
 * MyRecords.jsx (หน้าบันทึกข้อมูลรายงานประเมินตนเองและแนบหลักฐานอ้างอิงสำหรับอาจารย์)
 * ====================================================================================
 * หน้าการทำงานหลักของอาจารย์ประจำสาขาเทคโนโลยีคอมพิวเตอร์และดิจิทัล มีฟังก์ชันครอบคลุม:
 * 1. ตัวกรองเลือกหลักสูตร (Course) และปีการศึกษา (Academic Year)
 * 2. ตารางแสดงรายการเกณฑ์ประเมิน AUN-QA V4.0 พร้อมป้ายสถานะ (Draft, Submitted, Returned, Confirmed)
 * 3. หน้าต่าง Modal สำหรับบันทึกเนื้อหารายงานผลการดำเนินงาน (Description)
 * 4. ระบบแนบหลักฐานอ้างอิง 4 รูปแบบตามสถาปัตยกรรมระบบ:
 *    - ไฟล์เอกสาร (PDF, Word, Excel, PPT, ZIP) ผ่าน Multer Upload
 *    - รูปภาพ (JPG, PNG) ผ่าน Multer Upload
 *    - ลิงก์ภายนอก / Google Drive (Link URL)
 *    - ข้อความสรุปเชิงประจักษ์ (Text)
 * 5. การแจ้งเตือนข้อเสนอแนะกรณีถูกส่งกลับแก้ไข (Returned) พร้อมแสดงประวัติการตรวจ (Audit Trail)
 * 6. การกดบันทึกฉบับร่าง (Draft) หรือส่งให้คณะกรรมการตรวจประเมิน (Submit)
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Hook ดึงข้อมูลผู้ใช้งานที่เข้าสู่ระบบ
import api from '../../api/axios'; // Axios instance สำหรับเรียก Backend API
import {
  FileText,
  UploadCloud,
  Link as LinkIcon,
  Image as ImageIcon,
  File,
  CheckCircle,
  AlertTriangle,
  Clock,
  Send,
  Plus,
  Trash2,
  ExternalLink,
  Download,
  Info,
  History,
  FileDown
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge'; // คอมโพเนนต์ป้ายสถานะ

const MyRecords = () => {
  const { user } = useAuth(); // ข้อมูลอาจารย์ปัจจุบัน

  // State จัดการตัวเลือกหลักสูตรและปีการศึกษา
  const [courses, setCourses] = useState([]);
  const [years, setYears] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedYear, setSelectedYear] = useState('2567');

  // State ข้อมูลเกณฑ์และข้อมูลการบันทึก
  const [criteriaList, setCriteriaList] = useState([]); // รายการเกณฑ์ AUN-QA
  const [recordsMap, setRecordsMap] = useState({});     // แผนผังข้อมูลบันทึกตาม criteria_id
  const [loading, setLoading] = useState(true);

  // State สำหรับหน้าต่าง Modal จัดการเกณฑ์ที่เลือก
  const [activeCriteria, setActiveCriteria] = useState(null);
  const [currentRecord, setCurrentRecord] = useState({
    description: '',
    evidences: [],
    status: 'draft'
  });

  // State สำหรับการกรอกและแนบหลักฐานอ้างอิงแต่ละประเภท
  const [evidenceType, setEvidenceType] = useState('file'); // ชนิดหลักฐาน: 'file', 'image', 'text', 'link'
  const [evidenceText, setEvidenceText] = useState('');     // ข้อความหลักฐาน
  const [evidenceUrl, setEvidenceUrl] = useState('');       // ลิงก์หลักฐาน
  const [uploadingFile, setUploadingFile] = useState(false);// สถานะกำลังอัปโหลดไฟล์

  // State แจ้งสถานะการบันทึกและข้อความแจ้งเตือน
  const [saving, setSaving] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // โหลดรายการหลักสูตรและปีการศึกษาเริ่มต้นเมื่อเข้าสู่หน้าเว็บ
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [cRes, yRes] = await Promise.all([
          api.get('/courses'),
          api.get('/criteria/years')
        ]);
        setCourses(cRes.data);
        if (cRes.data.length > 0) {
          setSelectedCourse(cRes.data[0]._id);
        }
        if (yRes.data.length > 0) {
          setYears(yRes.data);
          setSelectedYear(yRes.data[0]);
        } else {
          setYears(['2567', '2566']);
        }
      } catch (err) {
        console.error('Failed to load courses/years:', err);
      }
    };

    fetchMetadata();
  }, []);

  // โหลดรายการเกณฑ์และประวัติการบันทึกเมื่อมีการเปลี่ยนหลักสูตรหรือปีการศึกษา
  useEffect(() => {
    if (!selectedCourse || !selectedYear) return;

    const fetchCriteriaAndRecords = async () => {
      setLoading(true);
      try {
        const [critRes, recRes] = await Promise.all([
          api.get(`/criteria?course_id=${selectedCourse}&academic_year=${selectedYear}`),
          api.get(`/records?course_id=${selectedCourse}&academic_year=${selectedYear}`)
        ]);

        setCriteriaList(critRes.data);

        // นำข้อมูลบันทึกมาทำ Key-Value Map เพื่อให้ค้นหาด้วย criteria_id ได้สะดวก
        const map = {};
        recRes.data.forEach((r) => {
          const cId = r.criteria_id?._id || r.criteria_id;
          map[cId] = r;
        });
        setRecordsMap(map);
      } catch (err) {
        console.error('Failed to load criteria and records:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCriteriaAndRecords();
  }, [selectedCourse, selectedYear]);

  // ฟังก์ชันเปิด Modal แก้ไข/บันทึกเกณฑ์ข้อที่เลือก
  const handleOpenCriteria = (crit) => {
    setActiveCriteria(crit);
    const existing = recordsMap[crit._id];
    if (existing) {
      setCurrentRecord({
        _id: existing._id,
        description: existing.description || '',
        evidences: existing.evidences || [],
        status: existing.status || 'draft',
        review_comment: existing.review_comment || '',
        review_history: existing.review_history || []
      });
    } else {
      setCurrentRecord({
        description: '',
        evidences: [],
        status: 'draft',
        review_comment: '',
        review_history: []
      });
    }
    setAlertMsg({ type: '', text: '' });
  };

  // ฟังก์ชันอัปโหลดไฟล์เอกสารหรือรูปภาพไปยัง Server ผ่าน API /files/upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingFile(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const uploadedFileRecord = res.data.file;

      // สร้าง Evidence Object ตาม Schema ของ AUN-QA Record
      const newEv = {
        evidence_id: 'ev-' + Date.now(),
        evidence_type: uploadedFileRecord.file_type === 'image' ? 'image' : 'file',
        file_id: uploadedFileRecord,
        text: uploadedFileRecord.original_name,
        url: `/uploads/${uploadedFileRecord.file_name}`,
        uploaded_by: { user_id: user.id, full_name: user.full_name },
        uploaded_date: new Date()
      };

      setCurrentRecord(prev => ({
        ...prev,
        evidences: [...prev.evidences, newEv]
      }));

      setAlertMsg({ type: 'success', text: `อัปโหลดไฟล์ "${file.name}" เรียบร้อยแล้ว` });
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถอัปโหลดไฟล์ได้' });
    } finally {
      setUploadingFile(false);
      e.target.value = null;
    }
  };

  // ฟังก์ชันเพิ่มหลักฐานประเภทข้อความ (Text) หรือลิงก์ภายนอก (Link)
  const handleAddTextOrLink = () => {
    if (evidenceType === 'link' && !evidenceUrl) {
      setAlertMsg({ type: 'error', text: 'กรุณากรอก URL ลิงก์หลักฐาน' });
      return;
    }
    if (evidenceType === 'text' && !evidenceText) {
      setAlertMsg({ type: 'error', text: 'กรุณากรอกข้อความหลักฐาน' });
      return;
    }

    const newEv = {
      evidence_id: 'ev-' + Date.now(),
      evidence_type: evidenceType,
      text: evidenceText || evidenceUrl,
      url: evidenceType === 'link' ? evidenceUrl : '',
      uploaded_by: { user_id: user.id, full_name: user.full_name },
      uploaded_date: new Date()
    };

    setCurrentRecord(prev => ({
      ...prev,
      evidences: [...prev.evidences, newEv]
    }));

    setEvidenceText('');
    setEvidenceUrl('');
    setAlertMsg({ type: 'success', text: 'เพิ่มหลักฐานเรียบร้อยแล้ว' });
  };

  // ฟังก์ชันลบหลักฐานออกจากรายการในฟอร์ม
  const handleRemoveEvidence = (evidenceId) => {
    setCurrentRecord(prev => ({
      ...prev,
      evidences: prev.evidences.filter(e => e.evidence_id !== evidenceId)
    }));
  };

  // ฟังก์ชันบันทึกข้อมูล (ส่งค่า submitStatus เป็น 'draft' หรือ 'submitted')
  const handleSave = async (submitStatus) => {
    setSaving(true);
    setAlertMsg({ type: '', text: '' });

    try {
      const payload = {
        criteria_id: activeCriteria._id,
        course_id: selectedCourse,
        academic_year: selectedYear,
        description: currentRecord.description,
        status: submitStatus,
        evidences: currentRecord.evidences.map(e => ({
          evidence_id: e.evidence_id,
          evidence_type: e.evidence_type,
          file_id: e.file_id?._id || e.file_id || null,
          text: e.text,
          url: e.url,
          uploaded_by: e.uploaded_by,
          uploaded_date: e.uploaded_date
        }))
      };

      const res = await api.post('/records', payload);
      const saved = res.data.record;

      setRecordsMap(prev => ({ ...prev, [activeCriteria._id]: saved }));
      setCurrentRecord(saved);

      setAlertMsg({
        type: 'success',
        text: submitStatus === 'submitted'
          ? 'ส่งรายงานและหลักฐานเพื่อขอรับการประเมินเรียบร้อยแล้ว'
          : 'บันทึกฉบับร่างเรียบร้อยแล้ว'
      });
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'ไม่สามารถบันทึกได้' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอและตัวกรองปีการศึกษา/หลักสูตร ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            บันทึกข้อมูลและแนบหลักฐานอ้างอิง AUN-QA
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            รายงานผลการดำเนินงานและแนบไฟล์หลักฐานตามเกณฑ์มาตรฐาน AUN-QA Version 4.0
          </p>
        </div>

        {/* กล่องตัวเลือกเลือกปีการศึกษาและหลักสูตร */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-600"
          >
            {years.map(y => (
              <option key={y} value={y}>ปีการศึกษา {y}</option>
            ))}
          </select>

          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500 focus:border-blue-600 max-w-xs truncate"
          >
            {courses.map(c => (
              <option key={c._id} value={c._id}>{c.course_name}</option>
            ))}
          </select>

          {/* ปุ่มส่งออกรายงาน SAR เป็น PDF */}
          <button
            onClick={() => {
              const prev = document.title;
              document.title = `รายงานSAR_AUN-QA_V4_${selectedYear}_เทคโนโลยีคอมพิวเตอร์`;
              window.print();
              setTimeout(() => { document.title = prev; }, 1000);
            }}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-xs flex items-center gap-1.5 transition hover:scale-102"
            title="ส่งออกรายงานประเมินตนเอง (SAR) เป็นไฟล์ PDF"
          >
            <FileDown className="w-4 h-4 stroke-[2.5]" />
            <span>ส่งออก SAR เป็น PDF</span>
          </button>
        </div>
      </div>

      {/* ==================== ส่วนที่ 2: ตารางรายการเกณฑ์ AUN-QA ทั้งหมด ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 stroke-[2.5]" />
            <h2 className="text-base font-black text-slate-900">
              รายการเกณฑ์ประเมิน AUN-QA Version 4.0 ({criteriaList.length} ข้อ)
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-500">
            คลิกที่แต่ละข้อเพื่อเปิดกรอกข้อมูลและแนบหลักฐาน
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดเกณฑ์ประเมิน...</div>
        ) : (
          <div className="divide-y-2 divide-slate-100">
            {criteriaList.map((crit) => {
              const record = recordsMap[crit._id];
              const status = record?.status || 'not_started';
              const evidenceCount = record?.evidences?.length || 0;

              return (
                <div
                  key={crit._id}
                  onClick={() => handleOpenCriteria(crit)}
                  className={`p-4 sm:p-5 hover:bg-blue-50/40 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    activeCriteria?._id === crit._id ? 'bg-blue-50 border-l-6 border-blue-600' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="w-12 h-10 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                      {crit.criteria_no}
                    </span>
                    <div>
                      <h3 className="text-sm font-black text-slate-900 leading-tight">
                        {crit.criteria_name}
                      </h3>
                      <p className="text-xs font-medium text-slate-600 mt-1 line-clamp-2">
                        {crit.description}
                      </p>

                      {/* กล่องแจ้งเตือนเหตุผลกรณีที่กรรมการส่งกลับแก้ไข */}
                      {record?.review_comment && status === 'returned' && (
                        <div className="mt-2.5 text-xs text-rose-950 bg-rose-100 border-2 border-rose-400 p-2.5 rounded-xl flex items-center gap-2 shadow-xs">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-700 stroke-[2.5]" />
                          <span><strong>เหตุผลที่ส่งกลับ:</strong> {record.review_comment}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0 self-end md:self-center">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-300">
                      {evidenceCount} หลักฐาน
                    </span>
                    {status === 'not_started' ? (
                      <span className="text-xs font-bold px-3 py-1 rounded-lg bg-slate-200 text-slate-700 border border-slate-300">
                        ยังไม่เริ่ม
                      </span>
                    ) : (
                      <StatusBadge status={status} />
                    )}
                    <button className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition">
                      บันทึก / ดูหลักฐาน
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================== ส่วนที่ 3: Modal กรอกข้อมูล SAR และแนบหลักฐาน ==================== */}
      {activeCriteria && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden">
            {/* ส่วนหัวของ Modal */}
            <div className="p-6 bg-slate-50 border-b-2 border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-black text-xs shadow-xs">
                    ข้อเกณฑ์ {activeCriteria.criteria_no}
                  </span>
                  <StatusBadge status={currentRecord.status} size="large" />
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {activeCriteria.criteria_name}
                </h2>
                <p className="text-xs font-medium text-slate-600 mt-1">
                  {activeCriteria.description}
                </p>
              </div>

              <button
                onClick={() => setActiveCriteria(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition font-black text-lg"
              >
                ✕
              </button>
            </div>

            {/* ส่วนเนื้อหาของ Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* ข้อความแจ้งเตือนผลการบันทึก */}
              {alertMsg.text && (
                <div
                  className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 border-2 ${
                    alertMsg.type === 'success'
                      ? 'bg-emerald-100 text-emerald-950 border-emerald-500'
                      : 'bg-rose-100 text-rose-950 border-rose-500'
                  }`}
                >
                  {alertMsg.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0 text-emerald-700" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0 text-rose-700" />}
                  <span>{alertMsg.text}</span>
                </div>
              )}

              {/* กล่องแจ้งเตือนความเห็นกรณีถูกส่งกลับแก้ไข (Returned) */}
              {currentRecord.status === 'returned' && currentRecord.review_comment && (
                <div className="bg-rose-100 border-2 border-rose-400 rounded-2xl p-4 text-sm text-rose-950 space-y-1 shadow-xs">
                  <div className="font-black flex items-center gap-2 text-rose-900">
                    <AlertTriangle className="w-5 h-5 text-rose-700 stroke-[2.5]" />
                    <span>แจ้งเตือน: กรรมการส่งกลับเพื่อให้แก้ไขหรือแนบหลักฐานใหม่</span>
                  </div>
                  <p className="text-xs font-bold text-rose-800 pl-7">
                    "{currentRecord.review_comment}"
                  </p>
                </div>
              )}

              {/* ฟอร์มกรอกรายงานผลการดำเนินงาน (Description) */}
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">
                  รายงานผลการดำเนินงานตามเกณฑ์ (Description) <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={4}
                  value={currentRecord.description}
                  onChange={(e) => setCurrentRecord({ ...currentRecord, description: e.target.value })}
                  placeholder="อธิบายกระบวนการดำเนินงาน กลยุทธ์ การดำเนินกิจกรรม และผลลัพธ์ที่เกิดขึ้นตามเกณฑ์ข้อนี้อย่างเป็นรูปธรรม..."
                  className="w-full p-4 border-2 border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-inner"
                />
              </div>

              {/* ส่วนจัดการหลักฐานอ้างอิง (Evidences Section) */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-slate-200 pb-2">
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                    หลักฐานอ้างอิงที่แนบ ({currentRecord.evidences.length} รายการ)
                  </h3>
                </div>

                {/* รายการหลักฐานที่ได้แนบไว้แล้ว */}
                {currentRecord.evidences.length > 0 ? (
                  <div className="space-y-2">
                    {currentRecord.evidences.map((ev) => (
                      <div
                        key={ev.evidence_id}
                        className="p-3.5 bg-slate-50 border-2 border-slate-200 rounded-xl flex items-center justify-between gap-3 text-sm shadow-xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          {ev.evidence_type === 'file' && <File className="w-5 h-5 text-blue-600 flex-shrink-0 stroke-[2.5]" />}
                          {ev.evidence_type === 'image' && <ImageIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 stroke-[2.5]" />}
                          {ev.evidence_type === 'link' && <LinkIcon className="w-5 h-5 text-sky-600 flex-shrink-0 stroke-[2.5]" />}
                          {ev.evidence_type === 'text' && <Info className="w-5 h-5 text-amber-600 flex-shrink-0 stroke-[2.5]" />}

                          <div className="truncate">
                            <div className="font-bold text-slate-900 truncate">
                              {ev.text || ev.url || 'หลักฐานอ้างอิง'}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              ประเภท: {ev.evidence_type.toUpperCase()} • แนบโดย {ev.uploaded_by?.full_name || 'ผู้ใช้งาน'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {ev.url && (
                            <a
                              href={ev.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-2 text-blue-700 bg-blue-100 hover:bg-blue-200 border border-blue-400 rounded-lg transition"
                              title="เปิดดู / ดาวน์โหลด"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveEvidence(ev.evidence_id)}
                            className="p-2 text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-400 rounded-lg transition"
                            title="ลบหลักฐาน"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-slate-400 italic">ยังไม่มีการแนบหลักฐานอ้างอิงในข้อนี้</p>
                )}

                {/* เครื่องมือแนบหลักฐาน 4 รูปแบบ (File, Image, Link, Text) */}
                <div className="p-5 bg-slate-50 border-2 border-slate-300 rounded-2xl space-y-3">
                  <div className="text-xs font-black text-slate-900 uppercase tracking-wide">
                    ➕ เลือกประเภทหลักฐานที่ต้องการแนบ:
                  </div>

                  {/* ปุ่มสลับชนิดหลักฐาน 4 แบบ */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setEvidenceType('file')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition border-2 ${
                        evidenceType === 'file'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm'
                          : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      <File className="w-4 h-4 stroke-[2.5]" />
                      ไฟล์เอกสาร (PDF/Word/Excel)
                    </button>

                    <button
                      type="button"
                      onClick={() => setEvidenceType('image')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition border-2 ${
                        evidenceType === 'image'
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 stroke-[2.5]" />
                      รูปภาพ (JPG/PNG)
                    </button>

                    <button
                      type="button"
                      onClick={() => setEvidenceType('link')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition border-2 ${
                        evidenceType === 'link'
                          ? 'bg-purple-600 text-white border-purple-700 shadow-sm'
                          : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      <LinkIcon className="w-4 h-4 stroke-[2.5]" />
                      ลิงก์ภายนอก / Google Drive
                    </button>

                    <button
                      type="button"
                      onClick={() => setEvidenceType('text')}
                      className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition border-2 ${
                        evidenceType === 'text'
                          ? 'bg-amber-600 text-white border-amber-700 shadow-sm'
                          : 'bg-white text-slate-800 hover:bg-slate-100 border-slate-300'
                      }`}
                    >
                      <Info className="w-4 h-4 stroke-[2.5]" />
                      ข้อความสรุป
                    </button>
                  </div>

                  {/* กล่องอัปโหลดไฟล์/รูปภาพ */}
                  {(evidenceType === 'file' || evidenceType === 'image') && (
                    <div className="pt-2">
                      <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-blue-400 rounded-xl bg-white hover:bg-blue-50/50 cursor-pointer transition shadow-xs">
                        <UploadCloud className="w-9 h-9 text-blue-600 mb-1.5" />
                        <span className="text-xs font-black text-blue-900">
                          {uploadingFile ? 'กำลังอัปโหลด...' : `คลิกเพื่อเลือก${evidenceType === 'image' ? 'รูปภาพ (JPG, PNG)' : 'ไฟล์เอกสาร (PDF, DOCX, XLSX)'} จากเครื่อง`}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-500 mt-0.5">
                          รองรับขนาดไฟล์สูงสุด 50MB
                        </span>
                        <input
                          type="file"
                          accept={evidenceType === 'image' ? 'image/*' : '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip'}
                          onChange={handleFileUpload}
                          disabled={uploadingFile}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {/* กล่องกรอกลิงก์ภายนอก */}
                  {evidenceType === 'link' && (
                    <div className="pt-2 flex gap-2">
                      <input
                        type="url"
                        placeholder="https://drive.google.com/... หรือ ลิงก์ระบบสารสนเทศภายนอก"
                        value={evidenceUrl}
                        onChange={(e) => setEvidenceUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-purple-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddTextOrLink}
                        className="px-5 py-2.5 bg-purple-600 text-white rounded-xl text-xs font-black hover:bg-purple-700 shadow-xs"
                      >
                        เพิ่มลิงก์
                      </button>
                    </div>
                  )}

                  {/* กล่องกรอกข้อความสรุป */}
                  {evidenceType === 'text' && (
                    <div className="pt-2 flex gap-2">
                      <input
                        type="text"
                        placeholder="ระบุข้อความอธิบาย หรือข้อมูลสรุปเป็นหลักฐาน..."
                        value={evidenceText}
                        onChange={(e) => setEvidenceText(e.target.value)}
                        className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white focus:outline-none focus:border-amber-600"
                      />
                      <button
                        type="button"
                        onClick={handleAddTextOrLink}
                        className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-black hover:bg-amber-700 shadow-xs"
                      >
                        เพิ่มข้อความ
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ส่วนประวัติการตรวจและส่งงาน (Review History / Audit Trail) */}
              {currentRecord.review_history?.length > 0 && (
                <div className="border-t-2 border-slate-200 pt-4">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <History className="w-4 h-4 stroke-[2.5]" />
                    ประวัติการตรวจและส่งงาน (Audit Trail)
                  </h4>
                  <div className="space-y-1.5">
                    {currentRecord.review_history.map((hist, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-start justify-between">
                        <div>
                          <span className="font-black text-blue-900">[{hist.action.toUpperCase()}]</span> {hist.comment}
                          <div className="text-[10px] text-slate-500 mt-0.5">โดย: {hist.reviewed_by?.full_name}</div>
                        </div>
                        <span className="text-[10px] text-slate-500 whitespace-nowrap font-mono">
                          {new Date(hist.reviewed_date).toLocaleString('th-TH')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ส่วนท้าย Modal ปุ่มบันทึกฉบับร่าง หรือส่งตรวจ */}
            <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveCriteria(null)}
                className="px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200 rounded-xl transition border border-slate-300"
              >
                ปิดหน้าต่าง
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('draft')}
                  className="px-4 py-2.5 bg-white border-2 border-slate-300 hover:bg-slate-100 text-slate-900 font-black rounded-xl text-xs shadow-xs transition"
                >
                  {saving ? 'กำลังบันทึก...' : 'บันทึกแบบร่าง (Draft)'}
                </button>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => handleSave('submitted')}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                  {saving ? 'กำลังส่ง...' : 'ส่งรายงานเพื่อขอรับการประเมิน (Submit)'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRecords;
