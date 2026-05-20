const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { config } = require('../config');
const fileController = require('../controllers/file.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain', 'text/csv',
  'application/zip', 'application/x-rar-compressed'
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.rar'
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, config.upload.path),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({
  storage,
  limits: { fileSize: config.upload.maxSize },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME_TYPES.has(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true);
    } else {
      const err = new Error('不支持的文件类型');
      err.statusCode = 400;
      cb(err, false);
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Files
 *   description: 文件管理接口
 */

/**
 * @swagger
 * /api/v1/files:
 *   get:
 *     tags: [Files]
 *     summary: 分页查询文件上传记录
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: name
 *         schema: { type: string }
 *         description: 文件名称（模糊搜索）
 *       - in: query
 *         name: path
 *         schema: { type: string }
 *         description: 文件存储路径（模糊搜索）
 *       - in: query
 *         name: createNickname
 *         schema: { type: string }
 *         description: 上传人名称（模糊搜索）
 *     responses:
 *       200:
 *         description: 查询成功
 */

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     tags: [Files]
 *     summary: 上传文件（multipart/form-data）
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [file]
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 上传成功
 */

/**
 * @swagger
 * /api/v1/files/upload/base64:
 *   post:
 *     tags: [Files]
 *     summary: 上传 base64 文件
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [base64, name, contentType]
 *             properties:
 *               base64:
 *                 type: string
 *                 description: base64 编码的文件内容（可含 data URI 前缀）
 *               name:
 *                 type: string
 *                 description: 文件名称
 *               contentType:
 *                 type: string
 *                 description: 文件 MIME 类型
 *     responses:
 *       200:
 *         description: 上传成功
 */

/**
 * @swagger
 * /api/v1/files/{id}:
 *   delete:
 *     tags: [Files]
 *     summary: 删除文件
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 删除成功
 */

/**
 * @swagger
 * /api/v1/files/batch-delete:
 *   delete:
 *     tags: [Files]
 *     summary: 批量删除文件
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items: { type: string }
 *             example: ["id1", "id2"]
 *     responses:
 *       200:
 *         description: 批量删除成功
 */

router.get('/preview/*', fileController.previewFile);
router.get('/download/*', fileController.downloadFile);

router.use(authenticate);

router.get('/', fileController.getFiles);
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.post('/upload/base64', fileController.uploadBase64);
router.delete('/batch-delete', authorize('ADMIN'), fileController.batchDeleteFiles);
router.delete('/:id', authorize('ADMIN'), fileController.deleteFile);

/**
 * @swagger
 * /api/v1/files:
 *   get:
 *     tags: [Files]
 *     summary: 接口列表
 *     responses:
 *       200:
 *         description: 接口列表
 */
router.get('/endpoints', (req, res) => {
  res.json({
    endpoints: [
      { method: 'GET',    path: '/api/v1/files',               description: '分页查询文件上传记录' },
      { method: 'POST',   path: '/api/v1/files/upload',         description: '上传文件（multipart）' },
      { method: 'POST',   path: '/api/v1/files/upload/base64',  description: '上传 base64 文件' },
      { method: 'GET',    path: '/api/v1/files/preview/*',      description: '预览/访问文件' },
      { method: 'GET',    path: '/api/v1/files/download/*',     description: '下载文件' },
      { method: 'DELETE', path: '/api/v1/files/:id',            description: '删除文件' },
      { method: 'DELETE', path: '/api/v1/files/batch-delete',   description: '批量删除文件' }
    ]
  });
});

module.exports = router;
