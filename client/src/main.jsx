/**
 * ==============================================================================
 * ไฟล์: client/src/main.jsx
 * หน้าที่: จุดเริ่มต้นหลักของแอปพลิเคชัน React (Vite Client Entry Point)
 * รายละเอียด:
 *  - ทำการ Mount Component <App /> เข้าสู่ DOM element id="root" ใน index.html
 *  - โหลด index.css (Tailwind CSS, Web Fonts, และ Global Styles)
 * ==============================================================================
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
