/**
 * ====================================================================================
 * ReviewList.jsx (หน้าตรวจสอบข้อมูลและยืนยันผลประเมินตนเอง สำหรับผู้รับผิดชอบ AUN-QA)
 * ====================================================================================
 * หน้ารับผิดชอบของกรรมการ/ผู้รับผิดชอบ AUN-QA มีหน้าที่สำคัญตามแผนภาพสถาปัตยกรรม:
 * 1. ตารางแสดงรายการรายงานผลที่อาจารย์ส่งเข้ามาตรวจ (Submitted, Draft, Returned, Confirmed)
 * 2. ตัวกรองค้นหาตามข้อเกณฑ์, ชื่อเกณฑ์ หรือชื่ออาจารย์ผู้รับผิดชอบ
 * 3. ตัวกรองแยกตามสถานะการประเมิน
 * 4. หน้าต่าง Modal ตรวจสอบหลักฐานอ้างอิงแต่ละรายการ (เปิดดูไฟล์/รูปภาพ/ลิงก์)
 * 5. การตัดสินใจของกรรมการ AUN-QA:
 *    - ยืนยันผลการบันทึกข้อมูล (Confirm) -> เปลี่ยนสถานะเป็น 'confirmed'
 *    - ส่งกลับเพื่อให้อาจารย์แก้ไขหลักฐานใหม่ (Return) -> เปลี่ยนสถานะเป็น 'returned' พร้อมบังคับระบุความคิดเห็น
 * 6. บันทึกประวัติการพิจารณาลงใน review_history (Audit Trail)
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // Hook ข้อมูลผู้ใช้งานที่เข้าสู่ระบบ
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API
import {
  UserCheck,
  CheckCircle,
  AlertTriangle,
  File,
  Image as ImageIcon,
  Link as LinkIcon,
  Info,
  ExternalLink,
  MessageSquare,
  Search,
  Filter
} from 'lucide-react';
import StatusBadge from '../../components/StatusBadge'; // คอมโพเนนต์ป้ายสถานะ

const ReviewList = () => {
  const { user } = useAuth(); // ข้อมูลกรรมการ AUN-QA ปัจจุบัน
  const [records, setRecords] = useState([]); // รายการข้อมูล SAR ทั้งหมดของปีการศึกษา
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // ตัวกรองสถานะ
  const [search, setSearch] = useState(''); // คำค้นหา

  // State สำหรับจัดการรายการที่กำลังเปิดตรวจสอบใน Modal
  const [activeRecord, setActiveRecord] = useState(null);
  const [reviewComment, setReviewComment] = useState('');
  const [processing, setProcessing] = useState(false);
  const [alertMsg, setAlertMsg] = useState({ type: '', text: '' });

  // ฟังก์ชันดึงข้อมูลรายการ SAR จาก Backend
  const fetchRecords = async () => {
    setLoading(true);
    try {
      const res = await api.get('/records?academic_year=2567');
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load records for review:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // เปิดหน้าต่าง Modal เพื่อดูรายละเอียดและตรวจประเมิน
  const handleOpenReview = (record) => {
    setActiveRecord(record);
    setReviewComment(record.review_comment || '');
    setAlertMsg({ type: '', text: '' });
  };

  // ดำเนินการยืนยันผล (confirmed) หรือส่งกลับแก้ไข (returned)
  const handleReviewAction = async (action) => {
    // หากส่งกลับแก้ไข ต้องบังคับให้อาจารย์ทราบเหตุผลและหลักฐานที่ขาดตกบกพร่อง
    if (action === 'returned' && (!reviewComment || !reviewComment.trim())) {
      setAlertMsg({ type: 'error', text: 'กรุณากรอกความคิดเห็นและระบุหลักฐานที่ต้องการให้อาจารย์แนบเพิ่มเติม' });
      return;
    }

    setProcessing(true);
    setAlertMsg({ type: '', text: '' });

    try {
      const res = await api.put(`/records/${activeRecord._id}/review`, {
        action,
        review_comment: reviewComment
      });

      setAlertMsg({
        type: 'success',
        text: action === 'confirmed'
          ? 'ยืนยันสถานะการบันทึกข้อมูลเรียบร้อยแล้ว'
          : 'ส่งกลับเพื่อให้อาจารย์แก้ไขหลักฐานใหม่เรียบร้อยแล้ว'
      });

      setActiveRecord(res.data.record);
      fetchRecords(); // อัปเดตรายการใหม่
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.response?.data?.message || 'เกิดข้อผิดพลาดในการประเมิน' });
    } finally {
      setProcessing(false);
    }
  };

  // กรองรายการข้อมูลตามคำค้นหาและสถานะที่เลือก
  const filteredRecords = records.filter(r => {
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchSearch =
      !search ||
      r.criteria_id?.criteria_no?.toLowerCase().includes(search.toLowerCase()) ||
      r.criteria_id?.criteria_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.created_by?.full_name?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอและตัวกรองค้นหา ==================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">
            ตรวจสอบข้อมูลและยืนยันสถานะ AUN-QA
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
            พิจารณารายงานผลการดำเนินงาน ตรวจสอบหลักฐานอ้างอิง และยืนยันผลตามเกณฑ์
          </p>
        </div>

        {/* กล่องค้นหาและตัวกรองสถานะ */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="ค้นหาข้อเกณฑ์ / อาจารย์..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-3 py-2 border-2 border-slate-300 rounded-xl text-xs font-bold bg-white text-slate-900 focus:outline-none focus:border-purple-600 w-48 sm:w-60 shadow-xs"
            />
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border-2 border-slate-300 rounded-xl text-xs font-black bg-white text-slate-900 shadow-xs focus:ring-2 focus:ring-purple-500 focus:border-purple-600"
          >
            <option value="all">สถานะทั้งหมด</option>
            <option value="submitted">รอตรวจ (Submitted)</option>
            <option value="returned">ส่งกลับแก้ไข (Returned)</option>
            <option value="confirmed">ยืนยันแล้ว (Confirmed)</option>
            <option value="draft">ฉบับร่าง (Draft)</option>
          </select>
        </div>
      </div>

      {/* ==================== ส่วนที่ 2: ตารางรายการที่ต้องตรวจสอบ ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-purple-600 stroke-[2.5]" />
            <h2 className="text-base font-black text-slate-900">
              รายการที่ต้องตรวจสอบ ({filteredRecords.length} รายการ)
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">กำลังโหลดรายการ...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-sm font-bold text-slate-400">ไม่พบรายการที่ตรงกับเงื่อนไข</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-24">ข้อเกณฑ์</th>
                  <th className="py-3.5 px-4">ชื่อเกณฑ์</th>
                  <th className="py-3.5 px-4">ผู้รายงาน</th>
                  <th className="py-3.5 px-4">หลักฐาน</th>
                  <th className="py-3.5 px-4">สถานะ</th>
                  <th className="py-3.5 px-4 text-right">ดำเนินการ</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-slate-100 text-sm">
                {filteredRecords.map((r) => (
                  <tr key={r._id} className="hover:bg-purple-50/40 transition">
                    <td className="py-3.5 px-4 font-black text-blue-700 whitespace-nowrap">
                      {r.criteria_id?.criteria_no}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {r.criteria_id?.criteria_name}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {r.created_by?.full_name || '-'}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-black bg-blue-100 text-blue-900 border border-blue-300">
                        {r.evidences?.length || 0} ไฟล์/ลิงก์
                      </span>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => handleOpenReview(r)}
                        className="px-4 py-1.5 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition"
                      >
                        ตรวจสอบข้อมูล
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==================== ส่วนที่ 3: Modal ตรวจสอบหลักฐานและพิจารณาผล ==================== */}
      {activeRecord && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border-2 border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col my-auto overflow-hidden">
            {/* ส่วนหัวของ Modal */}
            <div className="p-6 bg-slate-50 border-b-2 border-slate-200 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-black text-xs shadow-xs">
                    ข้อเกณฑ์ {activeRecord.criteria_id?.criteria_no}
                  </span>
                  <StatusBadge status={activeRecord.status} size="large" />
                </div>
                <h2 className="text-lg font-black text-slate-900">
                  {activeRecord.criteria_id?.criteria_name}
                </h2>
                <p className="text-xs font-bold text-slate-600 mt-1">
                  รายงานโดย: {activeRecord.created_by?.full_name} • หลักสูตร: {activeRecord.course_id?.course_name}
                </p>
              </div>

              <button
                onClick={() => setActiveRecord(null)}
                className="text-slate-400 hover:text-slate-700 p-2 rounded-xl hover:bg-slate-200 transition font-black text-lg"
              >
                ✕
              </button>
            </div>

            {/* ส่วนเนื้อหาของ Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
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

              {/* ข้อความรายงานผลการดำเนินงานจากอาจารย์ */}
              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200">
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                  รายงานผลการดำเนินงาน (Description)
                </h3>
                <p className="text-sm font-medium text-slate-900 whitespace-pre-wrap leading-relaxed">
                  {activeRecord.description || 'ไม่มีรายละเอียดผลการดำเนินงาน'}
                </p>
              </div>

              {/* รายการหลักฐานอ้างอิงที่แนบมา ให้กรรมการเปิดตรวจสอบได้ */}
              <div>
                <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-3">
                  หลักฐานอ้างอิงที่แนบ ({activeRecord.evidences?.length || 0} รายการ)
                </h3>

                {activeRecord.evidences?.length > 0 ? (
                  <div className="space-y-2.5">
                    {activeRecord.evidences.map((ev, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 bg-white border-2 border-slate-200 rounded-xl flex items-center justify-between gap-3 text-sm shadow-xs"
                      >
                        <div className="flex items-center gap-3 truncate">
                          {ev.evidence_type === 'file' && <File className="w-5 h-5 text-blue-600 flex-shrink-0 stroke-[2.5]" />}
                          {ev.evidence_type === 'image' && <ImageIcon className="w-5 h-5 text-emerald-600 flex-shrink-0 stroke-[2.5]" />}
                          {ev.evidence_type === 'link' && <LinkIcon className="w-5 h-5 text-purple-600 flex-shrink-0 stroke-[2.5]" />}
                          {ev.evidence_type === 'text' && <Info className="w-5 h-5 text-amber-600 flex-shrink-0 stroke-[2.5]" />}

                          <div className="truncate">
                            <div className="font-black text-slate-900 truncate">
                              {ev.text || ev.url}
                            </div>
                            <div className="text-[11px] font-semibold text-slate-500">
                              ประเภท: {ev.evidence_type.toUpperCase()} • แนบโดย {ev.uploaded_by?.full_name}
                            </div>
                          </div>
                        </div>

                        {ev.url && (
                          <a
                            href={ev.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg text-xs font-black shadow-xs transition"
                          >
                            <span>เปิดดูหลักฐาน</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs font-bold text-rose-700 italic">ข้อเกณฑ์นี้ยังไม่มีการแนบหลักฐานอ้างอิง</p>
                )}
              </div>

              {/* ช่องกรอกความเห็นและข้อเสนอแนะในการประเมิน */}
              <div>
                <label className="block text-sm font-black text-slate-900 mb-1.5">
                  ความเห็นและข้อเสนอแนะของกรรมการ (Review Comment)
                </label>
                <textarea
                  rows={3}
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="ระบุความเห็นการประเมิน หรือระบุสิ่งที่ต้องให้อาจารย์แนบหลักฐานใหม่..."
                  className="w-full p-4 border-2 border-slate-300 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100"
                />
              </div>

              {/* ประวัติการพิจารณาตรวจสอบย้อนหลัง */}
              {activeRecord.review_history?.length > 0 && (
                <div className="pt-2 border-t-2 border-slate-200">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2">
                    ประวัติการตรวจสอบย้อนหลัง
                  </h4>
                  <div className="space-y-1.5">
                    {activeRecord.review_history.map((h, i) => (
                      <div key={i} className="text-xs p-2.5 rounded-xl bg-slate-50 border border-slate-200 font-semibold text-slate-700 flex justify-between">
                        <span><strong>[{h.action.toUpperCase()}]</strong> {h.comment}</span>
                        <span className="text-slate-500 font-mono">{new Date(h.reviewed_date).toLocaleString('th-TH')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ส่วนท้าย Modal ปุ่มตัดสินใจยืนยันผล หรือส่งกลับแก้ไข */}
            <div className="p-4 bg-slate-50 border-t-2 border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setActiveRecord(null)}
                className="px-5 py-2.5 text-xs font-black text-slate-700 hover:bg-slate-200 rounded-xl transition border border-slate-300"
              >
                ปิด
              </button>

              <div className="flex items-center gap-3">
                {/* ปุ่มส่งกลับแก้ไข (Returned) สีแดงกุหลาบ */}
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleReviewAction('returned')}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4 stroke-[2.5]" />
                  <span>ส่งกลับให้อาจารย์แก้ไขหลักฐานใหม่</span>
                </button>

                {/* ปุ่มยืนยันผลประเมิน (Confirmed) สีเขียวมรกต */}
                <button
                  type="button"
                  disabled={processing}
                  onClick={() => handleReviewAction('confirmed')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md transition flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>ยืนยันผลการประเมิน (Confirm)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewList;
