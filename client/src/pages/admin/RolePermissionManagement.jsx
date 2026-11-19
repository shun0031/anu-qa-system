/**
 * ====================================================================================
 * RolePermissionManagement.jsx (หน้ากำหนดสิทธิ์การใช้งาน RBAC และตารางเมทริกซ์สิทธิ์)
 * ====================================================================================
 * หน้าแสดงแผนผังสิทธิ์การใช้งานตามบทบาท 3 กลุ่ม (Admin, Reviewer, Lecturer):
 * 1. การ์ดแสดงบทบาทในระบบ (Roles) และจำนวนสิทธิ์ที่ได้รับ
 * 2. ตารางแมทริกซ์การเข้าถึงฟังก์ชันตามบทบาท (Access Control Matrix)
 *    - อิงตามสถาปัตยกรรมระบบในรูปภาพทั้ง 3 รูปแบบ
 *    - ผู้ดูแลระบบ (Admin): เข้าถึงได้ทุกฟังก์ชัน ทั้งการจัดการผู้ใช้ เกณฑ์ หลักสูตร ไฟล์ และ Log
 *    - ผู้รับผิดชอบ AUN-QA (Reviewer): เข้าถึงฟังก์ชันตรวจสอบ ยืนยันผล และส่งกลับแก้ไข
 *    - อาจารย์ในสาขา (Lecturer): เข้าถึงฟังก์ชันบันทึกรายงาน SAR และแนบหลักฐาน
 * ====================================================================================
 */

import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Axios instance สำหรับเรียก REST API
import { ShieldCheck, Shield, Check, Lock, Info } from 'lucide-react';

const RolePermissionManagement = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลบทบาทและสิทธิ์จาก API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await api.get('/users/meta/roles-departments');
        setRoles(res.data.roles);
      } catch (err) {
        console.error('Error fetching roles:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
  }, []);

  // แผนผังสิทธิ์การเข้าถึงแต่ละฟังก์ชันตามแผนภาพระบบ (RBAC Matrix)
  const featureMatrix = [
    { name: 'เข้าใช้งานและดูแดชบอร์ดภาพรวม (Dashboard)', admin: true, reviewer: true, lecturer: true },
    { name: 'แก้ไขข้อมูลส่วนบุคคลและเปลี่ยนรหัสผ่าน (Profile)', admin: true, reviewer: true, lecturer: true },
    { name: 'บันทึกข้อมูลและแนบหลักฐานอ้างอิง AUN-QA (Documents, Images, Links)', admin: true, reviewer: false, lecturer: true },
    { name: 'ส่งรายงานประเมินเพื่อขอรับการตรวจ (Submit SAR)', admin: true, reviewer: false, lecturer: true },
    { name: 'ตรวจสอบรายงานและหลักฐานอ้างอิงของหลักสูตร (Review)', admin: true, reviewer: true, lecturer: false },
    { name: 'สั่งส่งกลับเพื่อให้อาจารย์แก้ไขหลักฐานใหม่ (Return for revision)', admin: true, reviewer: true, lecturer: false },
    { name: 'ยืนยันสถานะการบันทึกข้อมูลตามเกณฑ์ AUN-QA (Confirm)', admin: true, reviewer: true, lecturer: false },
    { name: 'ติดตามการบันทึกข้อมูลและรายงานความก้าวหน้า (Tracking Dashboard)', admin: true, reviewer: true, lecturer: false },
    { name: 'จัดการผู้ใช้งานและรีเซ็ตรหัสผ่าน (User Management)', admin: true, reviewer: false, lecturer: false },
    { name: 'กำหนดสิทธิ์การใช้งานตามบทบาท (RBAC)', admin: true, reviewer: false, lecturer: false },
    { name: 'จัดการหลักสูตรและสาขาวิชา (Courses & Departments)', admin: true, reviewer: false, lecturer: false },
    { name: 'แก้ไขเกณฑ์ AUN-QA แต่ละปีการศึกษา (Criteria Management)', admin: true, reviewer: false, lecturer: false },
    { name: 'ตรวจสอบและจัดการไฟล์ทั้งหมดในระบบ (File Storage Management)', admin: true, reviewer: false, lecturer: false },
    { name: 'ตรวจสอบประวัติการใช้งานระบบ (System Audit Logs)', admin: true, reviewer: false, lecturer: false },
  ];

  return (
    <div className="space-y-6">
      {/* ==================== ส่วนที่ 1: ส่วนหัวหน้าจอ ==================== */}
      <div>
        <h1 className="text-2xl font-black text-slate-900">
          กำหนดสิทธิ์การใช้งาน (Roles & Permissions / RBAC)
        </h1>
        <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
          แผนผังการกำหนดสิทธิ์ตามโครงสร้างระบบและบทบาทผู้ใช้งาน 3 กลุ่ม
        </p>
      </div>

      {/* ==================== ส่วนที่ 2: การ์ดแสดงบทบาททั้งหมดในระบบ ==================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {roles.map((r) => (
          <div key={r._id} className="bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-base font-black text-slate-900">{r.role_name}</h3>
              <p className="text-xs font-bold text-slate-500 mt-1">
                จำนวนสิทธิ์ที่กำหนด: {r.permission_ids?.length || 0} สิทธิ์
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                สถานะ: ใช้งานในระบบ
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ==================== ส่วนที่ 3: ตารางเมทริกซ์สิทธิ์การเข้าถึงฟังก์ชัน ==================== */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 bg-slate-50 border-b-2 border-slate-200">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            ตารางการเข้าถึงฟังก์ชันตามบทบาท (Access Control Matrix)
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 border-b-2 border-slate-200 text-xs font-black text-slate-700 uppercase">
                <th className="py-3.5 px-5">ฟังก์ชันและโมดูลการทำงาน</th>
                <th className="py-3.5 px-4 text-center">ผู้ดูแลระบบ<br/>(Admin)</th>
                <th className="py-3.5 px-4 text-center">ผู้รับผิดชอบ AUN-QA<br/>(Committee)</th>
                <th className="py-3.5 px-4 text-center">อาจารย์ในสาขา<br/>(Lecturer)</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-slate-100 text-sm">
              {featureMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-5 text-slate-800 font-bold">{item.name}</td>
                  <td className="py-3 px-4 text-center">
                    {item.admin ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </span>
                    ) : (
                      <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-400 items-center justify-center">
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.reviewer ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </span>
                    ) : (
                      <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-400 items-center justify-center">
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {item.lecturer ? (
                      <span className="inline-flex w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-3" />
                      </span>
                    ) : (
                      <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-400 items-center justify-center">
                        -
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolePermissionManagement;
