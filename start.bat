@echo off
chcp 65001 > nul
rem ======================================================================
rem ไฟล์: start.bat
rem หน้าที่: สคริปต์สำหรับเริ่มการทำงานของระบบทั้งหมดในคลิกเดียว (One-click Startup)
rem การทำงาน:
rem   1. เปิดหน้าต่างคำสั่งใหม่เพื่อรันเซิร์ฟเวอร์ Backend API (Port 5001)
rem   2. รอ 3 วินาทีเพื่อให้ฐานข้อมูลและ Backend พร้อมทำงาน
rem   3. เปิดหน้าต่างคำสั่งใหม่เพื่อรันเซิร์ฟเวอร์ Frontend Vite Client (Port 3000)
rem   4. แสดงข้อมูล URL และบัญชีผู้ใช้เริ่มต้นสำหรับทดสอบระบบ
rem ======================================================================

title ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิง AUN-QA Version 4.0
echo ======================================================================
echo    ระบบจัดเก็บข้อมูลและหลักฐานอ้างอิงสำหรับรายงานประเมินตนเอง
echo                    ตามเกณฑ์ AUN-QA Version 4.0
echo ======================================================================
echo กำลังเริ่มต้นระบบ...
echo.

rem 1. สตาร์ท Backend API Server (Node.js + Express) ที่ Port 5001
start "AUN-QA Backend Server" cmd /k "cd server && npm start"

rem หน่วงเวลา 3 วินาที
timeout /t 3 /nobreak > nul

rem 2. สตาร์ท Frontend Client (React + Vite) ที่ Port 3000
start "AUN-QA Frontend Client" cmd /k "cd client && npm run dev"

echo.
echo ระบบเริ่มทำงานเรียบร้อยแล้ว:
echo - เปิดบนเครื่องนี้: http://localhost:3000
echo - เปิดจากมือถือ/เครื่องอื่น (Wi-Fi เดียวกัน): http://192.168.1.84:3000
echo - หากต้องการส่งลิงก์ให้อาจารย์ที่อยู่นอกบ้าน: ดับเบิ้ลคลิกไฟล์ start-online.bat หรือ share-link.bat
echo - Backend API: http://localhost:5001/api
echo.
echo บัญชีผู้ใช้งานสำหรับทดสอบ:
echo 1) อาจารย์:   user: lecturer / pass: lecturer123
echo 2) ผู้รับผิดชอบ: user: reviewer / pass: reviewer123
echo 3) แอดมิน:     user: admin    / pass: admin123
echo ======================================================================
pause
