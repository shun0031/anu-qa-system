/**
 * ==============================================================================
 * ไฟล์: server/middleware/rbac.js
 * หน้าที่: Middleware สำหรับควบคุมสิทธิ์การเข้าถึงตามบทบาท (Role-Based Access Control - RBAC)
 * อ้างอิงตามภาพที่ 1 และ 3:
 *  - ผู้ดูแลระบบ (Admin)
 *  - อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์ (Lecturer)
 *  - ผู้รับผิดชอบ AUN-QA (Committee / Reviewer)
 * ==============================================================================
 */

// ฟังก์ชันรับรายชื่อบทบาทที่อนุญาต เช่น allowRoles('ผู้ดูแลระบบ', 'ผู้รับผิดชอบ AUN-QA')
const allowRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // 1. ตรวจสอบว่าผู้ใช้ผ่านการตรวจสอบ JWT มาแล้วหรือไม่
    if (!req.user || !req.userRole) {
      return res.status(401).json({ message: 'ยังไม่ได้เข้าสู่ระบบ' });
    }

    // 2. ตรวจสอบว่าบทบาทปัจจุบันตรงกับหนึ่งในรายชื่อที่อนุญาตหรือไม่ (Case-insensitive)
    const userRole = req.userRole.toLowerCase();
    const hasRole = allowedRoles.some(r => r.toLowerCase() === userRole);

    if (!hasRole) {
      return res.status(403).json({
        message: `คุณไม่มีสิทธิ์ในการเข้าถึงส่วนนี้ (สิทธิ์ปัจจุบันของคุณ: ${req.userRole})`
      });
    }

    next(); // ได้รับสิทธิ์ อนุญาตให้ทำรายการต่อ
  };
};

module.exports = { allowRoles };
