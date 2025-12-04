const router = require('express').Router();
const auth = require('../middlewares/auth');
const ctrl = require('../controllers/assignments.controller');

router.get('/',       auth('admin'), ctrl.list);
router.post('/',      auth('admin'), ctrl.create);
router.delete('/:id', auth('admin'), ctrl.remove);

module.exports = router;