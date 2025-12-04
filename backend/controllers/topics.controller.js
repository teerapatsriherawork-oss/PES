const db = require("../db/knex");
const TABLE = "evaluation_topics";

// Helper เลือกฟิลด์ที่จำเป็น
const pickPublic = (row) =>
  row && {
    id: row.id,
    code: row.code,
    title_th: row.title_th,
    description: row.description,
    weight: Number(row.weight), // แปลงเป็นตัวเลข
    active: !!row.active,       // แปลง 1/0 เป็น true/false
  };

// 1. List: ดูทั้งหมด
exports.list = async (req, res, next) => {
  try {
    const items = await db(TABLE).select("*").orderBy("id", "asc");
    res.json({ success: true, items: items.map(pickPublic), total: items.length });
  } catch (e) { next(e); }
};

// 2. Get One: ดูรายละเอียด (สำหรับ Edit)
exports.get = async (req, res, next) => {
  try {
    const row = await db(TABLE).where({ id: req.params.id }).first();
    if (!row) return res.status(404).json({ success: false, message: "Not found" });
    res.json(pickPublic(row));
  } catch (e) { next(e); }
};

// 3. Create: สร้างใหม่
exports.create = async (req, res, next) => {
  try {
    const { code, title_th, description, weight, active } = req.body;
    
    // ตรวจสอบรหัสซ้ำ
    const exists = await db(TABLE).where({ code }).first();
    if (exists) return res.status(409).json({ success: false, message: "รหัสหัวข้อซ้ำ" });

    const [id] = await db(TABLE).insert({
      code, 
      title_th, 
      description, 
      weight: Number(weight), 
      active: active ? 1 : 0
    });
    
    const created = await db(TABLE).where({ id }).first();
    res.status(201).json({ success: true, data: pickPublic(created) });
  } catch (e) { next(e); }
};

// 4. Update: แก้ไข
exports.update = async (req, res, next) => {
  try {
    const { code, title_th, description, weight, active } = req.body;
    await db(TABLE).where({ id: req.params.id }).update({
      code, 
      title_th, 
      description, 
      weight: Number(weight), 
      active: active ? 1 : 0
    });
    res.json({ success: true });
  } catch (e) { next(e); }
};

// 5. Delete: ลบ
exports.remove = async (req, res, next) => {
  try {
    await db(TABLE).where({ id: req.params.id }).del();
    res.json({ success: true });
  } catch (e) { next(e); }
};