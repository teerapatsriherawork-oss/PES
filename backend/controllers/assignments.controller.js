const db = require("../db/knex");
const TABLE = "assignments";

// Helper จัดรูปแบบข้อมูล
const mapRow = (row) => ({
    id: row.id,
    period_id: row.period_id,
    evaluator_id: row.evaluator_id,
    evaluatee_id: row.evaluatee_id,
    // ดึงชื่อมาแสดงด้วย (ถ้า join ใน query) หรือส่งไปแค่ ID ก็ได้
    // ในที่นี้ส่ง ID ไปก่อน เพื่อความง่าย Frontend จะไปแมพชื่อเอาเอง
});

exports.list = async (req, res, next) => {
  try {
    const items = await db(TABLE).select("*").orderBy("id", "desc");
    res.json({ success: true, items: items.map(mapRow), total: items.length });
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { period_id, evaluator_id, evaluatee_id } = req.body;

    // ตรวจสอบว่ามีข้อมูลครบไหม
    if (!period_id || !evaluator_id || !evaluatee_id) {
      return res.status(400).json({ success: false, message: "ข้อมูลไม่ครบ" });
    }

    // ตรวจสอบว่าจับคู่นี้ไปแล้วหรือยัง (ห้ามซ้ำ)
    const exists = await db(TABLE)
      .where({ period_id, evaluator_id, evaluatee_id })
      .first();
      
    if (exists) {
      return res.status(409).json({ success: false, message: "จับคู่นี้ไปแล้ว" });
    }

    const [id] = await db(TABLE).insert({
      period_id, 
      evaluator_id, 
      evaluatee_id
    });

    res.status(201).json({ success: true, id });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    await db(TABLE).where({ id: req.params.id }).del();
    res.json({ success: true });
  } catch (e) { next(e); }
};