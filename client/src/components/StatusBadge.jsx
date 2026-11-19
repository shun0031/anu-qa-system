/**
 * ==============================================================================
 * ไฟล์: client/src/components/StatusBadge.jsx
 * หน้าที่: Component แสดงป้ายสถานะของการบันทึกข้อมูล AUN-QA (Status Badge)
 * สถานะที่รองรับ:
 *  - confirmed: ยืนยันผลสำเร็จแล้ว (สีเขียว + ไอคอน CheckCircle2)
 *  - submitted: ส่งตรวจแล้ว รอการประเมิน (สีน้ำเงิน + ไอคอน Send)
 *  - returned: กรรมการส่งกลับให้แก้ไขหลักฐาน (สีแดง + ไอคอน AlertTriangle)
 *  - draft: อาจารย์กำลังร่างบันทึก (สีส้ม + ไอคอน Clock)
 * ==============================================================================
 */

import React from 'react';
import { Clock, Send, AlertTriangle, CheckCircle2 } from 'lucide-react';

const StatusBadge = ({ status, showIcon = true, size = 'normal' }) => {
  const sizeClasses = size === 'large'
    ? 'px-3.5 py-1.5 text-sm font-bold gap-2'
    : 'px-2.5 py-1 text-xs font-bold gap-1.5';

  switch (status) {
    case 'confirmed':
      return (
        <span className={`inline-flex items-center rounded-lg shadow-xs bg-emerald-100 text-emerald-900 border-2 border-emerald-500 font-bold ${sizeClasses}`}>
          {showIcon && <CheckCircle2 className="w-4 h-4 text-emerald-700 stroke-[2.5]" />}
          <span>ยืนยันผลสำเร็จ (Confirmed)</span>
        </span>
      );
    case 'submitted':
      return (
        <span className={`inline-flex items-center rounded-lg shadow-xs bg-blue-100 text-blue-950 border-2 border-blue-500 font-bold ${sizeClasses}`}>
          {showIcon && <Send className="w-4 h-4 text-blue-700 stroke-[2.5]" />}
          <span>ส่งตรวจแล้ว (Submitted)</span>
        </span>
      );
    case 'returned':
      return (
        <span className={`inline-flex items-center rounded-lg shadow-xs bg-rose-100 text-rose-950 border-2 border-rose-500 font-bold ${sizeClasses}`}>
          {showIcon && <AlertTriangle className="w-4 h-4 text-rose-700 stroke-[2.5]" />}
          <span>ส่งกลับแก้ไข (Returned)</span>
        </span>
      );
    case 'draft':
    default:
      return (
        <span className={`inline-flex items-center rounded-lg shadow-xs bg-amber-100 text-amber-950 border-2 border-amber-500 font-bold ${sizeClasses}`}>
          {showIcon && <Clock className="w-4 h-4 text-amber-800 stroke-[2.5]" />}
          <span>ฉบับร่าง (Draft)</span>
        </span>
      );
  }
};

export default StatusBadge;
