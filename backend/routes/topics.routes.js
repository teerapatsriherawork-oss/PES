const router = require('express').Router();
const auth = require('../middlewares/auth'); 
const ctrl = require('../controllers/topics.controller');

// เปิดดูได้ทุก Role, แต่แก้ได้แค่ Admin
router.get('/',       auth('admin','evaluator','evaluatee'), ctrl.list);
router.get('/:id',    auth('admin'), ctrl.get);
router.post('/',      auth('admin'), ctrl.create);
router.put('/:id',    auth('admin'), ctrl.update);
router.delete('/:id', auth('admin'), ctrl.remove);

module.exports = router;