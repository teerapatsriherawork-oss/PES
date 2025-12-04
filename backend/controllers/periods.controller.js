// backend/controllers/periods.controller.js
const db = require("../db/knex");
const TABLE = "evaluation_periods";

// Helper เลือกฟิลด์ (เพื่อความปลอดภัยและจัดการ format)
const pickPublic = (row) => {
  if (!row) return null;
  return {
    ...row,
    is_active: !!row.is_active, // แปลง 1/0 เป็น true/false
    // แปลงวันที่เป็น string YYYY-MM-DD เพื่อให้ frontend ใช้ง่าย
    start_date: row.start_date ? new Date(row.start_date).toISOString().split('T')[0] : null,
    end_date: row.end_date ? new Date(row.end_date).toISOString().split('T')[0] : null,
  };
};

// 1. List: ดูรายการทั้งหมด
exports.list = async (req, res, next) => {
  try {
    const items = await db(TABLE)
      .select("*")
      .orderBy("buddhist_year", "desc")
      .orderBy("id", "desc");
    res.json({ success: true, items: items.map(pickPublic), total: items.length });
  } catch (e) { next(e); }
};

// 2. Get One: ดูรายละเอียด 1 รายการ (ใช้ตอนกด Edit) 🌟
exports.get = async (req, res, next) => {
  try {
    const row = await db(TABLE).where({ id: req.params.id }).first();
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.json(pickPublic(row)); // ส่งข้อมูลกลับไปให้ฟอร์ม
  } catch (e) { next(e); }
};

// 3. Create: สร้างใหม่
exports.create = async (req, res, next) => {
  try {
    const { code, name_th, buddhist_year, start_date, end_date, is_active } = req.body;
    // ตรวจสอบ code ซ้ำ
    const exists = await db(TABLE).where({ code }).first();
    if (exists) return res.status(409).json({ success:false, message: 'รหัสรอบการประเมินซ้ำ' });

    const [id] = await db(TABLE).insert({
      code, name_th, 
      buddhist_year: Number(buddhist_year),
      start_date, end_date,
      is_active: is_active ? 1 : 0
    });
    const created = await db(TABLE).where({ id }).first();
    res.status(201).json({ success: true, data: pickPublic(created) });
  } catch (e) { next(e); }
};

// 4. Update: บันทึกแก้ไข 🌟
exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    const { code, name_th, buddhist_year, start_date, end_date, is_active } = req.body;
    
    // เช็คว่ามีข้อมูลนี้จริงไหม
    const row = await db(TABLE).where({ id }).first();
    if (!row) return res.status(404).json({ success:false, message: 'ไม่พบข้อมูล' });

    // อัปเดต
    await db(TABLE).where({ id }).update({
      code, name_th, 
      buddhist_year: Number(buddhist_year),
      start_date, end_date,
      is_active: is_active ? 1 : 0
    });

    const updated = await db(TABLE).where({ id }).first();
    res.json({ success: true, data: pickPublic(updated) });
  } catch (e) { next(e); }
};

// 5. Delete: ลบ
exports.remove = async (req, res, next) => {
  try {
    const affected = await db(TABLE).where({ id: req.params.id }).del();
    if (!affected) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) { next(e); }
};