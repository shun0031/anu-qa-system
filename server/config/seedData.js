/**
 * ==============================================================================
 * ไฟล์: server/config/seedData.js
 * หน้าที่: การเตรียมข้อมูลเริ่มต้น (Data Seeding) เข้าสู่ฐานข้อมูล
 * ข้อมูลที่ถูกสร้างเมื่อเริ่มระบบครั้งแรก:
 *  1. สาขาวิชา: "สาขาเทคโนโลยีคอมพิวเตอร์" (ตามภาพที่ 1)
 *  2. หลักสูตร: "วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล"
 *  3. รายการสิทธิ์การใช้งาน (Permissions) ทั้งหมด 12 รายการ
 *  4. บทบาทผู้ใช้ (Roles) ทั้ง 3 บทบาท:
 *     - ผู้ดูแลระบบ (Admin)
 *     - อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์ (Lecturer)
 *     - ผู้รับผิดชอบ AUN-QA (Committee / Reviewer)
 *  5. บัญชีผู้ใช้งานเริ่มต้น 3 บัญชี (admin/admin123, lecturer/lecturer123, reviewer/reviewer123)
 *  6. เกณฑ์ AUN-QA Version 4.0 ครบทั้ง 8 หมวด (17 ข้อย่อย) ปีการศึกษา 2567
 *  7. ตัวอย่างบันทึก AunqaRecord ครบทั้ง 4 สถานะ (confirmed, submitted, returned, draft)
 * ==============================================================================
 */

const bcrypt = require('bcryptjs');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Permission = require('../models/Permission');
const Role = require('../models/Role');
const User = require('../models/User');
const Criteria = require('../models/Criteria');
const AunqaRecord = require('../models/AunqaRecord');

const seedInitialData = async () => {
  try {
    // ตรวจสอบว่าในฐานข้อมูลมีข้อมูลผู้ใช้อยู่แล้วหรือไม่ หากมีแล้วให้ข้ามการสร้างซ้ำ
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already has data. Skipping initial seeding.');
      return;
    }

    console.log('Seeding initial data for AUN-QA System...');

    // 1. สร้างสาขาวิชา (Department)
    const dept = await Department.create({
      department_name: 'สาขาเทคโนโลยีคอมพิวเตอร์'
    });

    // 2. สร้างหลักสูตร (Course)
    const course = await Course.create({
      course_name: 'วิทยาศาสตรบัณฑิต สาขาวิชาเทคโนโลยีคอมพิวเตอร์และดิจิทัล',
      department_id: dept._id,
      status: 'active'
    });

    // 3. สร้างสิทธิ์การใช้งานระบบ (Permissions)
    const permissionNames = [
      'view_dashboard',        // ดูภาพรวมระบบ
      'edit_profile',          // แก้ไขข้อมูลส่วนตัว
      'manage_users',          // จัดการผู้ใช้งาน
      'manage_roles',          // กำหนดสิทธิ์ RBAC
      'manage_courses',        // จัดการหลักสูตร
      'manage_criteria',       // แก้ไขเกณฑ์ AUN-QA
      'manage_files',          // ตรวจสอบจัดการไฟล์
      'view_system_logs',      // ดูประวัติการใช้งาน
      'submit_aunqa_record',   // บันทึกและส่ง SAR
      'review_aunqa_record',   // ตรวจรายงาน SAR
      'confirm_aunqa_record',  // ยืนยันผลการประเมิน
      'track_aunqa_progress'   // ติดตามความคืบหน้ารายเกณฑ์
    ];

    const permissions = await Permission.insertMany(
      permissionNames.map(name => ({ permission_name: name }))
    );
    const permMap = permissions.reduce((acc, p) => {
      acc[p.permission_name] = p._id;
      return acc;
    }, {});

    // 4. สร้างบทบาทผู้ใช้ (Roles) พร้อมผูกรายการสิทธิ์ตามภาพที่ 1 และ 3
    const adminRole = await Role.create({
      role_name: 'ผู้ดูแลระบบ',
      permission_ids: permissions.map(p => p._id) // แอดมินได้ทุกสิทธิ์
    });

    const lecturerRole = await Role.create({
      role_name: 'อาจารย์ในสาขาเทคโนโลยีคอมพิวเตอร์',
      permission_ids: [
        permMap['view_dashboard'],
        permMap['edit_profile'],
        permMap['submit_aunqa_record']
      ]
    });

    const reviewerRole = await Role.create({
      role_name: 'ผู้รับผิดชอบ AUN-QA',
      permission_ids: [
        permMap['view_dashboard'],
        permMap['edit_profile'],
        permMap['review_aunqa_record'],
        permMap['confirm_aunqa_record'],
        permMap['track_aunqa_progress']
      ]
    });

    // 5. สร้างรหัสผ่านที่เข้ารหัสด้วย bcrypt
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('admin123', salt);
    const lecturerPass = await bcrypt.hash('lecturer123', salt);
    const reviewerPass = await bcrypt.hash('reviewer123', salt);

    // สร้างบัญชีผู้ใช้งาน 3 บทบาท
    const adminUser = await User.create({
      username: 'admin',
      password_hash: adminPass,
      full_name: 'ผู้ดูแลระบบสูงสุด',
      email: 'admin@university.ac.th',
      phone: '081-111-2222',
      line_id: 'admin_aunqa',
      role_id: adminRole._id,
      department_id: dept._id,
      status: 'active'
    });

    const lecturerUser = await User.create({
      username: 'lecturer',
      password_hash: lecturerPass,
      full_name: 'อาจารย์ ดร.สมชาย ใจดี',
      email: 'somchai.j@university.ac.th',
      phone: '089-333-4444',
      line_id: 'somchai_tech',
      role_id: lecturerRole._id,
      department_id: dept._id,
      status: 'active'
    });

    const reviewerUser = await User.create({
      username: 'reviewer',
      password_hash: reviewerPass,
      full_name: 'ผศ.ดร.วิภาดา วิชาการ',
      email: 'wipada.w@university.ac.th',
      phone: '086-555-6666',
      line_id: 'wipada_qa',
      role_id: reviewerRole._id,
      department_id: dept._id,
      status: 'active'
    });

    // 6. สร้างเกณฑ์ AUN-QA Version 4.0 ทั้ง 8 หมวด
    const currentYear = '2567';
    const criteriaList = [
      // หมวดที่ 1: ผลการเรียนรู้ที่คาดหวัง (Expected Learning Outcomes)
      {
        criteria_no: '1.1',
        criteria_name: 'ผลการเรียนรู้ที่คาดหวังของหลักสูตร (ELOs) มีความชัดเจน สอดคล้องกับวิสัยทัศน์ พันธกิจ',
        description: 'วัตถุประสงค์ของหลักสูตรและผลการเรียนรู้ที่คาดหวังได้รับการกำหนดอย่างชัดเจนและสอดคล้องกับวิสัยทัศน์ พันธกิจ และเป้าหมายเชิงยุทธศาสตร์ของมหาวิทยาลัย'
      },
      {
        criteria_no: '1.2',
        criteria_name: 'ELOs ครอบคลุมทั้ง Generic Skills และ Subject-specific Skills',
        description: 'ผลการเรียนรู้ที่คาดหวังของหลักสูตรครอบคลุมทั้งทักษะทั่วไป (ความรอบรู้ ทักษะทางปัญญา ทักษะดิจิทัล) และทักษะเฉพาะทางวิชาชีพด้านคอมพิวเตอร์'
      },
      {
        criteria_no: '1.3',
        criteria_name: 'การสื่อสารและเผยแพร่ ELOs สู่ผู้มีส่วนได้ส่วนเสีย',
        description: 'ผลการเรียนรู้ที่คาดหวังของหลักสูตรได้รับการสื่อสาร ถ่ายทอด และรับรู้โดยนักศึกษา คณาจารย์ บุคลากร และผู้มีส่วนได้ส่วนเสียภายนอก'
      },
      // หมวดที่ 2: โครงสร้างและเนื้อหาหลักสูตร (Programme Structure and Content)
      {
        criteria_no: '2.1',
        criteria_name: 'โครงสร้างหลักสูตรและแผนการศึกษามีความทันสมัย',
        description: 'โครงสร้างหลักสูตรมีการออกแบบให้เนื้อหาวิชาการมีความทันสมัย มีลำดับการเรียนรู้ตามแผนการศึกษา และส่งเสริมการบรรลุ ELOs'
      },
      {
        criteria_no: '2.2',
        criteria_name: 'การบูรณาการหลักสูตรกับความต้องการของตลาดแรงงานดิจิทัล',
        description: 'หลักสูตรมีการบูรณาการความรู้เทคโนโลยีคอมพิวเตอร์ที่ตอบสนองความต้องการของภาคอุตสาหกรรมและมาตรฐานวิชาชีพ'
      },
      // หมวดที่ 3: กลยุทธ์การจัดการเรียนการสอน (Teaching and Learning Approach)
      {
        criteria_no: '3.1',
        criteria_name: 'ปรัชญาการจัดการเรียนการสอนแบบเน้นผู้เรียนเป็นสำคัญ (Student-Centered Learning)',
        description: 'หลักสูตรนำรูปแบบการสอน Active Learning, Problem-based Learning, และ Project-based Learning มาใช้อย่างเหมาะสม'
      },
      {
        criteria_no: '3.2',
        criteria_name: 'การส่งเสริมทักษะการเรียนรู้ตลอดชีวิตและการคิดเชิงนวัตกรรม',
        description: 'กิจกรรมการเรียนรู้ส่งเสริมให้นักศึกษาค้นคว้าด้วยตนเอง มีทักษะการแก้ปัญหา และพัฒนาโครงงานนวัตกรรม'
      },
      // หมวดที่ 4: การประเมินผลผู้เรียน (Student Assessment)
      {
        criteria_no: '4.1',
        criteria_name: 'ระบบและเกณฑ์การประเมินผลผู้เรียนมีความสอดคล้องกับ ELOs',
        description: 'การวัดและประเมินผลผู้เรียนในแต่ละรายวิชาใช้เกณฑ์ Rubrics ที่ชัดเจน และสามารถสะท้อนผลสัมฤทธิ์ของ ELOs ได้'
      },
      {
        criteria_no: '4.2',
        criteria_name: 'การให้ข้อมูลย้อนกลับ (Constructive Feedback) แก่นักศึกษาอย่างทันเวลา',
        description: 'อาจารย์ผู้สอนมีกระบวนการให้ข้อเสนอแนะและสะท้อนผลการประเมินเพื่อการพัฒนาแก่นักศึกษาอย่างสม่ำเสมอ'
      },
      // หมวดที่ 5: คุณภาพบุคลากรสายวิชาการ (Academic Staff)
      {
        criteria_no: '5.1',
        criteria_name: 'การวางแผนและการบริหารจัดการอาจารย์ผู้สอน',
        description: 'อัตราส่วนอาจารย์ต่อนักศึกษา ความเชี่ยวชาญ และภาระงานมีความเหมาะสมต่อการจัดการเรียนการสอน'
      },
      {
        criteria_no: '5.2',
        criteria_name: 'การส่งเสริมและพัฒนาศักยภาพอาจารย์ (Faculty Development)',
        description: 'อาจารย์ได้รับการส่งเสริมให้เข้าอบรมทางวิชาการ การพัฒนาทักษะด้านเทคโนโลยี และการขอตำแหน่งทางวิชาการ'
      },
      // หมวดที่ 6: การบริการและการสนับสนุนนักศึกษา (Student Support Services)
      {
        criteria_no: '6.1',
        criteria_name: 'ระบบการให้คำปรึกษาทางวิชาการและแนะแนวการทำงาน',
        description: 'มีระบบอาจารย์ที่ปรึกษา การจัดกิจกรรมติว การเตรียมความพร้อมทางวิชาการ และการฝึกงาน/สหกิจศึกษา'
      },
      {
        criteria_no: '6.2',
        criteria_name: 'การดูแลสวัสดิการ สุขภาวะ และกิจกรรมพัฒนานักศึกษา',
        description: 'บริการด้านทุนการศึกษา สุขอนามัย การให้คำปรึกษาด้านสุขภาพจิต และกิจกรรมเสริมทักษะนอกห้องเรียน'
      },
      // หมวดที่ 7: สิ่งอำนวยความสะดวกและโครงสร้างพื้นฐาน (Facilities and Infrastructure)
      {
        criteria_no: '7.1',
        criteria_name: 'สิ่งอำนวยความสะดวก ห้องปฏิบัติการ และระบบคอมพิวเตอร์',
        description: 'มีห้องปฏิบัติการคอมพิวเตอร์ อุปกรณ์ฮาร์ดแวร์ ซอฟต์แวร์ลิขสิทธิ์ และระบบเครือข่ายอินเทอร์เน็ตความเร็วสูงที่พร้อมใช้งาน'
      },
      {
        criteria_no: '7.2',
        criteria_name: 'แหล่งทรัพยากรการเรียนรู้และห้องสมุดดิจิทัล',
        description: 'การเข้าถึงฐานข้อมูลงานวิจัย หนังสืออิเล็กทรอนิกส์ (e-Books) และเครื่องมือดิจิทัลสำหรับการเรียนการสอน'
      },
      // หมวดที่ 8: ผลผลิตและผลลัพธ์ (Output and Outcomes)
      {
        criteria_no: '8.1',
        criteria_name: 'อัตราการคงอยู่และการสำเร็จการศึกษาตามระยะเวลา',
        description: 'การติดตามและวิเคราะห์ข้อมูลอัตราการคงอยู่ของนักศึกษา อัตราการตกออก และอัตราการสำเร็จการศึกษา'
      },
      {
        criteria_no: '8.2',
        criteria_name: 'อัตราการได้งานทำและความพึงพอใจของผู้ใช้บัณฑิต',
        description: 'การสำรวจภาวะการมีงานทำ เงินเดือนเฉลี่ยเริ่มต้น และการประเมินความพึงพอใจของนายจ้างต่อสมรรถนะของบัณฑิต'
      }
    ];

    const createdCriteria = await Criteria.insertMany(
      criteriaList.map(item => ({
        course_id: course._id,
        academic_year: currentYear,
        criteria_no: item.criteria_no,
        criteria_name: item.criteria_name,
        description: item.description
      }))
    );

    // 7. สร้างตัวอย่างบันทึก AunqaRecord ในแต่ละสถานะ (Confirmed, Submitted, Returned, Draft)
    // ตัวอย่างที่ 1: สถานะ confirmed (ยืนยันแล้ว มีหลักฐานครบ)
    await AunqaRecord.create({
      criteria_id: createdCriteria[0]._id,
      course_id: course._id,
      academic_year: currentYear,
      description: 'หลักสูตรได้ดำเนินการทบทวน ELOs ร่วมกับคณะกรรมการบริหารหลักสูตรและผู้ทรงคุณวุฒิภายนอก เมื่อวันที่ 15 พฤษภาคม 2567 โดยสอดคล้องกับแผนยุทธศาสตร์คณะวิทยาศาสตร์และเทคโนโลยี และได้เผยแพร่ผ่านเว็บไซต์หลักสูตรและคู่มือนักศึกษาใหม่',
      status: 'confirmed',
      created_by: {
        user_id: lecturerUser._id,
        full_name: lecturerUser.full_name
      },
      review_comment: 'ข้อมูลการทบทวน ELOs และหลักฐานรายงานการประชุมครบถ้วน ชัดเจน ตรงตามเกณฑ์ AUN-QA 1.1 ยืนยันผลการประเมิน',
      reviewed_by: {
        user_id: reviewerUser._id,
        full_name: reviewerUser.full_name
      },
      reviewed_date: new Date(Date.now() - 2 * 86400000),
      confirmed_by: {
        user_id: reviewerUser._id,
        full_name: reviewerUser.full_name
      },
      confirmed_date: new Date(Date.now() - 2 * 86400000),
      review_history: [
        {
          action: 'submitted',
          comment: 'ส่งรายงานผลการดำเนินงานข้อ 1.1 พร้อมแนบรายงานการประชุมและรูปภาพการสัมมนา',
          reviewed_by: { user_id: lecturerUser._id, full_name: lecturerUser.full_name },
          reviewed_date: new Date(Date.now() - 4 * 86400000)
        },
        {
          action: 'confirmed',
          comment: 'หลักฐานสมบูรณ์ ครบถ้วนตามเกณฑ์',
          reviewed_by: { user_id: reviewerUser._id, full_name: reviewerUser.full_name },
          reviewed_date: new Date(Date.now() - 2 * 86400000)
        }
      ],
      evidences: [
        {
          evidence_id: 'ev-101',
          evidence_type: 'text',
          text: 'มติที่ประชุมกรรมการหลักสูตร ครั้งที่ 2/2567 เรื่อง การกำหนดรายละเอียดผลลัพธ์การเรียนรู้ระดับหลักสูตร (PLOs/ELOs)',
          uploaded_by: { user_id: lecturerUser._id, full_name: lecturerUser.full_name },
          uploaded_date: new Date()
        },
        {
          evidence_id: 'ev-102',
          evidence_type: 'link',
          url: 'https://computerscience.university.ac.th/curriculum/elo-v4',
          text: 'หน้าเว็บเผยแพร่ ELOs สู่สาธารณะและนักศึกษา',
          uploaded_by: { user_id: lecturerUser._id, full_name: lecturerUser.full_name },
          uploaded_date: new Date()
        }
      ]
    });

    // ตัวอย่างที่ 2: สถานะ submitted (อาจารย์ส่งแล้ว รอการตรวจ)
    await AunqaRecord.create({
      criteria_id: createdCriteria[3]._id,
      course_id: course._id,
      academic_year: currentYear,
      description: 'หลักสูตรได้ปรับปรุงเนื้อหารายวิชาหมวดเทคโนโลยี AI, Cloud Computing, และ Web Architecture ให้ทันสมัย มีแผนการศึกษา 4 ปีที่ระบุวิชาบังคับก่อนชัดเจน เพื่อให้นักศึกษาสามารถเรียนรู้ตามลำดับขั้นได้มีประสิทธิภาพ',
      status: 'submitted',
      created_by: {
        user_id: lecturerUser._id,
        full_name: lecturerUser.full_name
      },
      review_history: [
        {
          action: 'submitted',
          comment: 'ส่งรายงานข้อ 2.1 พร้อมแผนการศึกษา มคอ.2 รอคณะกรรมการตรวจสอบ',
          reviewed_by: { user_id: lecturerUser._id, full_name: lecturerUser.full_name },
          reviewed_date: new Date(Date.now() - 86400000)
        }
      ],
      evidences: [
        {
          evidence_id: 'ev-201',
          evidence_type: 'text',
          text: 'ตารางวิเคราะห์ความสอดคล้องระหว่างรายวิชาในหลักสูตร (Curriculum Mapping) กับ ELOs 1-5',
          uploaded_by: { user_id: lecturerUser._id, full_name: lecturerUser.full_name },
          uploaded_date: new Date()
        }
      ]
    });

    // ตัวอย่างที่ 3: สถานะ returned (กรรมการส่งกลับให้อาจารย์แนบหลักฐานใหม่ ตามภาพที่ 3)
    await AunqaRecord.create({
      criteria_id: createdCriteria[5]._id,
      course_id: course._id,
      academic_year: currentYear,
      description: 'มีการใช้การจัดการเรียนการสอนแบบ Active Learning ในรายวิชาการพัฒนาเว็บแอปพลิเคชันและวิศวกรรมซอฟต์แวร์ โดยมอบหมายโปรเจกต์จริงให้แก่นักศึกษา',
      status: 'returned',
      created_by: {
        user_id: lecturerUser._id,
        full_name: lecturerUser.full_name
      },
      review_comment: 'ขอให้แนบหลักฐานภาพถ่ายการจัดกิจกรรมการเรียนรู้ หรือไฟล์ มคอ.3 ที่ระบุกิจกรรม Project-based Learning เพิ่มเติม เพื่อความชัดเจนในการประเมิน',
      reviewed_by: {
        user_id: reviewerUser._id,
        full_name: reviewerUser.full_name
      },
      reviewed_date: new Date(Date.now() - 12 * 3600000),
      review_history: [
        {
          action: 'submitted',
          comment: 'ส่งรายงานข้อ 3.1',
          reviewed_by: { user_id: lecturerUser._id, full_name: lecturerUser.full_name },
          reviewed_date: new Date(Date.now() - 24 * 3600000)
        },
        {
          action: 'returned',
          comment: 'ขอให้แนบหลักฐานภาพถ่ายการจัดกิจกรรมการเรียนรู้ หรือไฟล์ มคอ.3 ที่ระบุกิจกรรม Project-based Learning เพิ่มเติม เพื่อความชัดเจนในการประเมิน',
          reviewed_by: { user_id: reviewerUser._id, full_name: reviewerUser.full_name },
          reviewed_date: new Date(Date.now() - 12 * 3600000)
        }
      ],
      evidences: [
        {
          evidence_id: 'ev-301',
          evidence_type: 'text',
          text: 'รายชื่อ 5 รายวิชาที่ใช้ Active Learning ประจำภาคการศึกษาที่ 1/2567',
          uploaded_by: { user_id: lecturerUser._id, full_name: lecturerUser.full_name },
          uploaded_date: new Date()
        }
      ]
    });

    // ตัวอย่างที่ 4: สถานะ draft (อาจารย์กำลังร่าง)
    await AunqaRecord.create({
      criteria_id: createdCriteria[7]._id,
      course_id: course._id,
      academic_year: currentYear,
      description: 'อยู่ระหว่างรวบรวมเกณฑ์การประเมิน (Rubrics) ของรายวิชาโครงงานคอมพิวเตอร์',
      status: 'draft',
      created_by: {
        user_id: lecturerUser._id,
        full_name: lecturerUser.full_name
      },
      evidences: []
    });

    console.log('Seed completed successfully!');
    console.log('Initial accounts created:');
    console.log(' - Admin: admin / admin123');
    console.log(' - Lecturer: lecturer / lecturer123');
    console.log(' - Reviewer: reviewer / reviewer123');
  } catch (err) {
    console.error('Error during data seeding:', err);
  }
};

module.exports = seedInitialData;
