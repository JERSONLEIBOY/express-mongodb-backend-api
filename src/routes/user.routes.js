const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.post('/', authorize('ADMIN'), userController.createUser);
router.put('/:id', authorize('ADMIN'), userController.updateUser);
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);
router.put('/:id/status', authorize('ADMIN'), userController.updateUserStatus);
router.put('/:id/password', userController.updateUserPassword);

module.exports = router;
