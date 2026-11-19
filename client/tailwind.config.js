/**
 * ==============================================================================
 * ไฟล์: client/tailwind.config.js
 * หน้าที่: การกำหนดค่า Tailwind CSS สำหรับจัดแต่งหน้าจอของระบบ (Styling & Responsive UI)
 * รายละเอียด:
 *  - content: สแกนหาไฟล์ .jsx, .html เพื่อสร้าง Utility CSS เฉพาะที่ใช้งานจริง
 *  - theme.extend.colors: กำหนด Palette สีเฉพาะของระบบ เช่น สีประจำบทบาท (lecturer, reviewer, admin)
 *  - theme.extend.boxShadow: กำหนดเงาแบบ Soft shadow เพื่อให้การ์ดดูมีมิติ
 * ==============================================================================
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ชุดสีหลักของแบรนด์ (Brand Blue)
        brand: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc5fb',
          400: '#36a7f7',
          500: '#0c8de9',
          600: '#026fc7',
          700: '#0358a1',
          800: '#074b85',
          900: '#0c3f6e',
          950: '#082849',
        },
        // สีประจำบทบาท: อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์ (Lecturer)
        lecturer: {
          light: '#eff6ff',
          border: '#93c5fd',
          text: '#1e40af',
          primary: '#2563eb'
        },
        // สีประจำบทบาท: ผู้รับผิดชอบ AUN-QA (Committee / Reviewer)
        reviewer: {
          light: '#f5f3ff',
          border: '#c4b5fd',
          text: '#5b21b6',
          primary: '#7c3aed'
        },
        // สีประจำบทบาท: ผู้ดูแลระบบ (Admin)
        admin: {
          light: '#f0fdf4',
          border: '#86efac',
          text: '#166534',
          primary: '#16a34a'
        }
      },
      boxShadow: {
        'card': '0 2px 8px -1px rgba(0, 0, 0, 0.08), 0 1px 4px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 8px 20px -2px rgba(0, 0, 0, 0.12), 0 3px 6px -2px rgba(0, 0, 0, 0.06)',
      }
    },
  },
  plugins: [],
}
