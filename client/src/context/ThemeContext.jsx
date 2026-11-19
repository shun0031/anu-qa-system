/**
 * ==============================================================================
 * ไฟล์: client/src/context/ThemeContext.jsx
 * หน้าที่: React Context สำหรับบริหารจัดการธีมสีของทั้งระบบ (Dynamic Theme Switcher)
 * รายละเอียดการทำงาน:
 *  - กำหนดชุดสีมาตรฐาน 5 สไตล์:
 *    1. cream: เหลืองครีมอบอุ่น (Warm Cream)
 *    2. blue: ฟ้าสดใสตามภาพร่างต้นฉบับ (Sky & Royal Blue)
 *    3. navy: สีกรมท่าสากล (Modern Navy & Ice White)
 *    4. clean: ขาวคลีนมินิมอล (Minimal Pure White)
 *    5. emerald: เขียวมรกตธรรมชาติ (Emerald & Mint)
 *  - บันทึกการเลือกธีมสีลงใน LocalStorage (app_theme) ทำให้สีที่เลือกคงอยู่แม้รีเฟรชหน้า
 *  - ปรับเปลี่ยนสีพื้นหลัง body และองค์ประกอบต่างๆ แบบ Real-time
 * ==============================================================================
 */

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  cream: {
    id: 'cream',
    name: 'เหลืองครีมอบอุ่น (Warm Cream)',
    color: '#F59E0B',
    bg: 'bg-[#FAF3E0]',
    pageBg: '#FAF3E0',
    sidebar: 'bg-[#F2E5C4] border-r-2 border-[#DFCFAB]',
    sidebarText: 'text-amber-950',
    sidebarHover: 'hover:bg-[#E8D9B2] hover:text-amber-950',
    sidebarActive: 'bg-amber-600 text-white shadow-md',
    navbar: 'bg-[#FFFDF7] border-b-2 border-[#DFCFAB]',
    cardBorder: 'border-2 border-[#DFCFAB]',
    primary: 'bg-amber-600 hover:bg-amber-700 text-white',
    badge: 'bg-amber-100 text-amber-900 border border-amber-300'
  },
  blue: {
    id: 'blue',
    name: 'ฟ้าสดใสตามภาพร่าง (Sky & Royal Blue)',
    color: '#0284C7',
    bg: 'bg-[#F0F7FF]',
    pageBg: '#F0F7FF',
    sidebar: 'bg-[#1E40AF] border-r border-[#1D4ED8]',
    sidebarText: 'text-blue-100',
    sidebarHover: 'hover:bg-blue-800 hover:text-white',
    sidebarActive: 'bg-sky-500 text-white shadow-md',
    navbar: 'bg-white border-b-2 border-blue-200',
    cardBorder: 'border-2 border-blue-200',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    badge: 'bg-blue-100 text-blue-900 border border-blue-300'
  },
  navy: {
    id: 'navy',
    name: 'สีกรมท่าสากล (Modern Navy & Ice White)',
    color: '#0F172A',
    bg: 'bg-slate-100',
    pageBg: '#F1F5F9',
    sidebar: 'bg-slate-900 border-r border-slate-800',
    sidebarText: 'text-slate-300',
    sidebarHover: 'hover:bg-slate-800 hover:text-white',
    sidebarActive: 'bg-blue-600 text-white shadow-md',
    navbar: 'bg-white border-b border-slate-200',
    cardBorder: 'border border-slate-200',
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    badge: 'bg-slate-100 text-slate-800 border border-slate-300'
  },
  clean: {
    id: 'clean',
    name: 'ขาวคลีนมินิมอล (Minimal Pure White)',
    color: '#64748B',
    bg: 'bg-slate-50',
    pageBg: '#F8FAFC',
    sidebar: 'bg-white border-r-2 border-slate-200',
    sidebarText: 'text-slate-700',
    sidebarHover: 'hover:bg-slate-100 hover:text-slate-900',
    sidebarActive: 'bg-slate-900 text-white shadow-md',
    navbar: 'bg-white border-b-2 border-slate-200',
    cardBorder: 'border-2 border-slate-200',
    primary: 'bg-slate-900 hover:bg-slate-800 text-white',
    badge: 'bg-slate-100 text-slate-800 border border-slate-300'
  },
  emerald: {
    id: 'emerald',
    name: 'เขียวมรกตธรรมชาติ (Emerald & Mint)',
    color: '#059669',
    bg: 'bg-[#F2FBF6]',
    pageBg: '#F2FBF6',
    sidebar: 'bg-[#064E3B] border-r border-[#043E2E]',
    sidebarText: 'text-emerald-100',
    sidebarHover: 'hover:bg-[#043E2E] hover:text-white',
    sidebarActive: 'bg-emerald-500 text-white shadow-md',
    navbar: 'bg-white border-b-2 border-emerald-200',
    cardBorder: 'border-2 border-emerald-200',
    primary: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    badge: 'bg-emerald-100 text-emerald-900 border border-emerald-300'
  }
};

export const ThemeProvider = ({ children }) => {
  // ดึงค่าธีมที่เคยบันทึกไว้ใน LocalStorage หรือใช้ 'cream' เป็นค่าเริ่มต้น
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('app_theme') || 'cream';
  });

  // ฟังก์ชันสลับธีมสี
  const setTheme = (themeKey) => {
    if (THEMES[themeKey]) {
      setCurrentTheme(themeKey);
      localStorage.setItem('app_theme', themeKey);
      document.body.style.backgroundColor = THEMES[themeKey].pageBg;
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('app_theme') || 'cream';
    if (THEMES[saved]) {
      document.body.style.backgroundColor = THEMES[saved].pageBg;
    }
  }, []);

  const theme = THEMES[currentTheme] || THEMES.cream;

  return (
    <ThemeContext.Provider value={{ theme, currentTheme, setTheme, THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
