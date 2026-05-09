const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', menuController.getMenus);
router.get('/:id', menuController.getMenuById);
router.post('/', authorize('ADMIN'), menuController.createMenu);
router.put('/:id', authorize('ADMIN'), menuController.updateMenu);
router.delete('/:id', authorize('ADMIN'), menuController.deleteMenu);

module.exports = router;
