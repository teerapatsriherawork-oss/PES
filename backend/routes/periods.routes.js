// backend/routes/periods.routes.js
const router = require('express').Router();
const auth = require('../middlewares/auth'); 
const ctrl = require('../controllers/periods.controller');

// List & Get (Read)
router.get('/',       auth('admin','evaluator','evaluatee'), ctrl.list);
router.get('/:id',    auth('admin'), ctrl.get); // 👈 บรรทัดนี้สำคัญสำหรับปุ่ม Edit

// Create, Update, Delete (Write - Admin only)
router.post('/',      auth('admin'), ctrl.create);
router.put('/:id',    auth('admin'), ctrl.update); // 👈 บรรทัดนี้สำหรับกด Save
router.delete('/:id', auth('admin'), ctrl.remove);

module.exports = router;