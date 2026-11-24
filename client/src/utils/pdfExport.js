import html2pdf from 'html2pdf.js';

/**
 * ==============================================================================
 * ฟังก์ชันดาวน์โหลดรายงานเป็นไฟล์ PDF ลงในเครื่องคอมพิวเตอร์หรือโทรศัพท์มือถือทันที
 * ==============================================================================
 * - ทำงานฝั่ง Client-Side 100% ไม่ต้องส่งไฟล์ไปแปลงบนเซิร์ฟเวอร์
 * - รองรับฟอนต์ไทย Sarabun และ Prompt คมชัด ไม่เพี้ยน
 * - ดาวน์โหลดลงในโฟลเดอร์ Downloads อัตโนมัติทันที
 * ==============================================================================
 * @param {HTMLElement|string} target - DOM Element หรือ element ID ที่ต้องการแปลงเป็น PDF
 * @param {string} filename - ชื่อไฟล์ PDF ที่ต้องการ (ไม่ต้องพิมพ์ .pdf)
 * @param {object} customOptions - ตัวเลือกเพิ่มเติม
 */
export const downloadElementAsPDF = async (target, filename = 'รายงาน_AUN-QA', customOptions = {}) => {
  const element = typeof target === 'string' ? document.getElementById(target) : target;
  if (!element) {
    console.warn('Target element not found for PDF export, falling back to print');
    window.print();
    return;
  }

  // ตัวเลือกมาตรฐานสำหรับเอกสารรายงาน A4
  const defaultOptions = {
    margin: [10, 12, 12, 12], // ขอบกระดาษเป็นมิลลิเมตร (บน, ขวา, ล่าง, ซ้าย)
    filename: `${filename}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2, // สเกลภาพ 2 เท่า เพื่อให้ตัวหนังสือคมชัดสูง ไม่แตก
      useCORS: true,
      letterRendering: true,
      logging: false,
      backgroundColor: '#FFFFFF',
      windowWidth: 1200 // ความกว้างจำลองเพื่อจัดเลย์เอาต์เอกสาร A4 สวยงาม
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy']
    }
  };

  const options = { ...defaultOptions, ...customOptions };

  try {
    await html2pdf().set(options).from(element).save();
    return true;
  } catch (error) {
    console.error('html2pdf generation error, using fallback:', error);
    const prevTitle = document.title;
    document.title = filename;
    window.print();
    setTimeout(() => {
      document.title = prevTitle;
    }, 1000);
    return false;
  }
};
