/**
 * ==============================================================================
 * ไฟล์: client/src/components/ThemeSelector.jsx
 * หน้าที่: Component ปุ่มกดและ Dropdown เมนูสำหรับสลับธีมสีของระบบ (Theme Selector)
 * รายละเอียดการทำงาน:
 *  - แสดงปุ่ม 🎨 โทนสี ตรงมุมขวาบน
 *  - มี Dropdown ให้คลิกเลือก 5 โทนสีมาตรฐานพร้อมจุดสีพรีวิว
 *  - ปิด Dropdown อัตโนมัติเมื่อคลิกพื้นที่ภายนอก (Click Outside Detection)
 * ==============================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Palette, Check } from 'lucide-react';

const ThemeSelector = () => {
  const { currentTheme, setTheme, THEMES } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ตรวจจับการคลิกนอกพื้นที่ Dropdown เพื่อปิดเมนู
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-xs"
        title="เปลี่ยนโทนสีของระบบ"
      >
        <Palette className="w-4 h-4 text-amber-500" />
        <span className="hidden sm:inline">โทนสี: {THEMES[currentTheme]?.name.split(' ')[0]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border-2 border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-xs font-black text-slate-800 px-2 py-1 mb-2 border-b border-slate-100 flex items-center justify-between">
            <span>🎨 เลือกโทนสีที่ชอบ</span>
            <span className="text-[10px] text-slate-400 font-normal">คลิกเพื่อเปลี่ยนทันที</span>
          </div>

          <div className="space-y-1.5">
            {Object.values(THEMES).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs font-bold transition ${
                  currentTheme === t.id
                    ? 'bg-slate-100 text-slate-900 border-2 border-blue-500'
                    : 'text-slate-700 hover:bg-slate-50 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-4 h-4 rounded-full border border-black/20 shadow-xs flex-shrink-0"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>{t.name}</span>
                </div>
                {currentTheme === t.id && (
                  <Check className="w-4 h-4 text-blue-600 stroke-[3]" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;
