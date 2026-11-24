/**
 * ==============================================================================
 * ไฟล์: client/src/App.jsx
 * หน้าที่: จุดศูนย์รวมเส้นทางหลักของระบบ (Routing & Layout Architecture)
 * รายละเอียดการทำงาน:
 *  1. จัดการ Context Providers: ThemeProvider (ธีมสี) และ AuthProvider (ข้อมูลผู้ใช้และสิทธิ์)
 *  2. กำหนด ProtectedLayout: ตรวจสอบ Token และสิทธิ์การเข้าถึง (allowedRoles) ก่อนเปิดหน้า
 *  3. แยกเส้นทางตามกลุ่มผู้ใช้งาน:
 *     - เส้นทางทั่วไป: /login, /dashboard, /profile
 *     - เส้นทางอาจารย์: /my-records (บันทึกข้อมูลและแนบหลักฐาน)
 *     - เส้นทางผู้รับผิดชอบ AUN-QA: /reviews (ตรวจประเมิน), /tracking (ติดตามเกณฑ์ 8 ด้าน)
 *     - เส้นทางผู้ดูแลระบบ (Admin): /admin/users, /admin/roles, /admin/courses, /admin/criteria, /admin/files, /admin/logs
 * ==============================================================================
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// หน้าระบบทั่วไป (General Pages)
import Login from './pages/Login';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';

// หน้าสำหรับอาจารย์ (Lecturer Pages)
import MyRecords from './pages/lecturer/MyRecords';

// หน้าสำหรับผู้รับผิดชอบ AUN-QA (Reviewer Pages)
import ReviewList from './pages/reviewer/ReviewList';
import TrackingDashboard from './pages/reviewer/TrackingDashboard';

// หน้าสำหรับผู้ดูแลระบบ (Admin Pages)
import UserManagement from './pages/admin/UserManagement';
import RolePermissionManagement from './pages/admin/RolePermissionManagement';
import CourseManagement from './pages/admin/CourseManagement';
import CriteriaManagement from './pages/admin/CriteriaManagement';
import FileManagement from './pages/admin/FileManagement';
import SystemLogs from './pages/admin/SystemLogs';

// -----------------------------------------------------------------------------
// Component ตรวจสอบการเข้าสู่ระบบและสิทธิ์การเข้าถึง (Protected Route Wrapper)
// -----------------------------------------------------------------------------
const ProtectedLayout = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // 1. ระหว่างกำลังโหลดตรวจสอบข้อมูลผู้ใช้จาก Token ใน LocalStorage
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">
        กำลังตรวจสอบสิทธิ์การเข้าถึงระบบ...
      </div>
    );
  }

  // 2. หากยังไม่ได้ล็อกอิน ให้ Redirect ไปยังหน้า Login ทันที
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. หากล็อกอินแล้วแต่ไม่มีสิทธิ์ในหน้านี้ (RBAC Check - รองรับ 1 บัญชีหลายสิทธิ์)
  const userRoles = user?.roles?.length ? user.roles : (user?.role ? [user.role] : []);
  const hasAccess = !allowedRoles || allowedRoles.some(r => userRoles.includes(r));
  if (!hasAccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4 text-center">
        <h1 className="text-xl font-bold text-red-600 mb-2">ไม่มีสิทธิ์เข้าถึงหน้านี้</h1>
        <p className="text-sm text-slate-500 mb-4">
          บทบาทที่คุณได้รับ ({userRoles.join(', ') || 'ไม่มีบทบาท'}) ไม่ได้รับอนุญาตให้เข้าถึงเนื้อหานี้
        </p>
        <a href="/dashboard" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          กลับสู่หน้าหลัก
        </a>
      </div>
    );
  }

  // 4. แสดงผล Layout ปกติ (Navbar + Sidebar + เนื้อหาหลัก)
  return (
    <div className={`min-h-screen ${theme.bg} flex flex-col transition-colors duration-200`}>
      <Navbar
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={mobileMenuOpen}
      />
      <div className="flex-1 flex w-full relative">
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-full min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Main Application Component
// -----------------------------------------------------------------------------
function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* เส้นทางสาธารณะ (ไม่ต้องล็อกอิน) */}
            <Route path="/login" element={<Login />} />

            {/* เส้นทางที่ต้องผ่านการล็อกอิน (Protected Routes) */}
            <Route
              path="/"
              element={
                <ProtectedLayout>
                  <Navigate to="/dashboard" replace />
                </ProtectedLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedLayout>
                  <Dashboard />
                </ProtectedLayout>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedLayout>
                  <Profile />
                </ProtectedLayout>
              }
            />

            {/* กลุ่มเส้นทางของ: อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์ */}
            <Route
              path="/my-records"
              element={
                <ProtectedLayout allowedRoles={['อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์', 'ผู้ดูแลระบบ']}>
                  <MyRecords />
                </ProtectedLayout>
              }
            />

            {/* กลุ่มเส้นทางของ: ผู้รับผิดชอบ AUN-QA */}
            <Route
              path="/reviews"
              element={
                <ProtectedLayout allowedRoles={['ผู้รับผิดชอบ AUN-QA', 'ผู้ดูแลระบบ']}>
                  <ReviewList />
                </ProtectedLayout>
              }
            />
            <Route
              path="/tracking"
              element={
                <ProtectedLayout allowedRoles={['ผู้รับผิดชอบ AUN-QA', 'ผู้ดูแลระบบ', 'อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์']}>
                  <TrackingDashboard />
                </ProtectedLayout>
              }
            />

            {/* กลุ่มเส้นทางของ: ผู้ดูแลระบบ (Admin) */}
            <Route
              path="/admin/users"
              element={
                <ProtectedLayout allowedRoles={['ผู้ดูแลระบบ']}>
                  <UserManagement />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/roles"
              element={
                <ProtectedLayout allowedRoles={['ผู้ดูแลระบบ']}>
                  <RolePermissionManagement />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/courses"
              element={
                <ProtectedLayout allowedRoles={['ผู้ดูแลระบบ']}>
                  <CourseManagement />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/criteria"
              element={
                <ProtectedLayout allowedRoles={['ผู้ดูแลระบบ']}>
                  <CriteriaManagement />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/files"
              element={
                <ProtectedLayout allowedRoles={['ผู้ดูแลระบบ']}>
                  <FileManagement />
                </ProtectedLayout>
              }
            />
            <Route
              path="/admin/logs"
              element={
                <ProtectedLayout allowedRoles={['ผู้ดูแลระบบ']}>
                  <SystemLogs />
                </ProtectedLayout>
              }
            />

            {/* เส้นทางกรณีไม่พบหน้า (Fallback 404 -> กลับ Dashboard) */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
