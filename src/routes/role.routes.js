const express = require('express');
const router = express.Router();
const roleController = require('../controllers/role.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', roleController.getRoles);
router.get('/:id', roleController.getRoleById);
router.post('/', authorize('ADMIN'), roleController.createRole);
router.put('/:id', authorize('ADMIN'), roleController.updateRole);
router.delete('/:id', authorize('ADMIN'), roleController.deleteRole);
router.put('/:id/permissions', authorize('ADMIN'), roleController.updateRolePermissions);

module.exports = router;
