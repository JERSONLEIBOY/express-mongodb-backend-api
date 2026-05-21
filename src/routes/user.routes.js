const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

/**
 * @swagger
 * /api/v1/users/page:
 *   get:
 *     tags: [Users]
 *     summary: 分页查询用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *       - in: query
 *         name: nickname
 *         schema: { type: string }
 *       - in: query
 *         name: sex
 *         schema: { type: string }
 *       - in: query
 *         name: phone
 *         schema: { type: string }
 *       - in: query
 *         name: email
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: integer, enum: [0, 1] }
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *       - in: query
 *         name: createTimeStart
 *         schema: { type: string, format: date-time }
 *       - in: query
 *         name: createTimeEnd
 *         schema: { type: string, format: date-time }
 *     responses:
 *       200:
 *         description: 成功
 */
/**
 * @swagger
 * /api/v1/users/password:
 *   put:
 *     tags: [Users]
 *     summary: 修改当前登录用户密码
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password, oldPassword]
 *             properties:
 *               oldPassword: { type: string, description: 原始密码 }
 *               password: { type: string, minLength: 6, description: 新密码 }
 *     responses:
 *       200:
 *         description: 成功
 */
/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: 修改当前登录用户个人信息
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: { type: string }
 *               avatar: { type: string }
 *               sex: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               birthday: { type: string }
 *               introduction: { type: string }
 *               address: { type: string }
 *               tellPre: { type: string }
 *               tell: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/profile', userController.updateCurrentProfile);

router.put('/password', userController.updateCurrentPassword);

router.get('/page', userController.getUsersPage);

/**
 * @swagger
 * /api/v1/users/existence:
 *   get:
 *     tags: [Users]
 *     summary: 检查用户字段是否存在
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: field
 *         required: true
 *         schema: { type: string, enum: [username, phone, email] }
 *       - in: query
 *         name: value
 *         required: true
 *         schema: { type: string }
 *       - in: query
 *         name: id
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 可用
 *       400:
 *         description: 已存在
 */
router.get('/existence', userController.checkExistence);

/**
 * @swagger
 * /api/v1/users:
 *   get:
 *     tags: [Users]
 *     summary: 查询用户列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: username
 *         schema: { type: string }
 *       - in: query
 *         name: nickname
 *         schema: { type: string }
 *       - in: query
 *         name: sex
 *         schema: { type: string }
 *       - in: query
 *         name: phone
 *         schema: { type: string }
 *       - in: query
 *         name: status
 *         schema: { type: integer }
 *       - in: query
 *         name: organizationId
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/', userController.getUsers);

/**
 * @swagger
 * /api/v1/users:
 *   post:
 *     tags: [Users]
 *     summary: 添加用户
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, password]
 *             properties:
 *               username: { type: string }
 *               nickname: { type: string }
 *               password: { type: string }
 *               sex: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               birthday: { type: string }
 *               organizationId: { type: string }
 *               roles: { type: array, items: { type: string } }
 *               status: { type: integer, enum: [0, 1] }
 *               comments: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/', authorize('ADMIN'), userController.createUser);

/**
 * @swagger
 * /api/v1/users/import:
 *   post:
 *     tags: [Users]
 *     summary: 导入用户
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 成功
 */
router.post('/import', authorize('ADMIN'), upload.single('file'), userController.importUsers);

/**
 * @swagger
 * /api/v1/users/batch:
 *   delete:
 *     tags: [Users]
 *     summary: 批量删除用户
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/batch', authorize('ADMIN'), userController.deleteUserBatch);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: 根据id查询用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
router.get('/:id', userController.getUserById);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   put:
 *     tags: [Users]
 *     summary: 修改用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nickname: { type: string }
 *               sex: { type: string }
 *               phone: { type: string }
 *               email: { type: string }
 *               birthday: { type: string }
 *               organizationId: { type: string }
 *               roles: { type: array, items: { type: string } }
 *               status: { type: integer }
 *               comments: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/:id', authorize('ADMIN'), userController.updateUser);

/**
 * @swagger
 * /api/v1/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: 删除用户
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 成功
 */
router.delete('/:id', authorize('ADMIN'), userController.deleteUser);

/**
 * @swagger
 * /api/v1/users/{id}/status:
 *   put:
 *     tags: [Users]
 *     summary: 修改用户状态
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status: { type: integer, enum: [0, 1] }
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/:id/status', authorize('ADMIN'), userController.updateUserStatus);

/**
 * @swagger
 * /api/v1/users/{id}/password:
 *   put:
 *     tags: [Users]
 *     summary: 重置用户密码
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               password: { type: string, minLength: 6 }
 *     responses:
 *       200:
 *         description: 成功
 */
router.put('/:id/password', authorize('ADMIN'), userController.resetUserPassword);

module.exports = router;
