/**
 * ==============================================================================
 * ไฟล์: ecosystem.config.cjs
 * หน้าที่: ไฟล์ตั้งค่า PM2 Process Manager สำหรับรัน Backend บนเซิร์ฟเวอร์คณะ/มหาลัย
 * ประโยชน์:
 *  - ให้เซิร์ฟเวอร์รันอยู่เบื้องหลัง (Background Service) ตลอด 24 ชม.
 *  - รีสตาร์ทอัตโนมัติหากเกิด Error หรือเมื่อเซิร์ฟเวอร์ของมหาวิทยาลัยถูกรีบูต
 * ==============================================================================
 */

module.exports = {
  apps: [
    {
      name: 'aun-qa-backend',
      script: 'server.js',
      cwd: './server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    }
  ]
};
