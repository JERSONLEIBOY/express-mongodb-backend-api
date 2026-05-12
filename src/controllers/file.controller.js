const File = require('../models/File');
const path = require('path');
const fs = require('fs');
const { config } = require('../config');
const response = require('../utils/response');

const uploadsDir = path.resolve(config.upload.path);

const safeResolvePath = (filePath) => {
  const resolved = path.resolve(filePath);
  if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) {
    return null;
  }
  return resolved;
};

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
 *     summary: 获取文件列表
 *     description: 分页获取文件列表，支持按名称模糊搜索和排序
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: 页码
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: 每页记录数（最大 100）
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 文件名模糊搜索
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: uploadTime
 *           enum: [name, size, uploadTime, createdAt]
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 成功获取文件列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         list:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/File'
 *                         pagination:
 *                           $ref: '#/components/schemas/Pagination'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getFiles = async (req, res, next) => {
  try {
    const { page = 1, pageSize = 20, name, sortField = 'uploadTime', sortOrder = 'desc' } = req.query;

    const query = {};

    if (name) query.name = new RegExp(name, 'i');

    const limit = Math.min(parseInt(pageSize, 10) || 20, 100);
    const skip = (parseInt(page, 10) - 1) * limit;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const [list, total] = await Promise.all([
      File.find(query)
        .populate('uploader', 'username name')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      File.countDocuments(query)
    ]);

    return response.paginated(res, { list, total, page, pageSize });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/files/{id}:
 *   get:
 *     tags: [Files]
 *     summary: 获取单个文件信息
 *     description: 根据 ID 获取文件元信息
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 文件 ID
 *     responses:
 *       200:
 *         description: 成功获取文件信息
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/File'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getFileById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id)
      .populate('uploader', 'username name')
      .lean();

    if (!file) {
      return response.notFound(res, '文件不存在');
    }

    return response.success(res, file);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/files/upload:
 *   post:
 *     tags: [Files]
 *     summary: 上传文件
 *     description: |
 *       上传单个文件，仅支持以下类型：
 *       - 图片：jpg、jpeg、png、gif、webp、svg
 *       - 文档：pdf、doc、docx、xls、xlsx、ppt、pptx、txt、csv
 *       - 压缩包：zip、rar
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
 *                 description: 要上传的文件
 *     responses:
 *       201:
 *         description: 文件上传成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/File'
 *                     code:
 *                       type: integer
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: '文件上传成功'
 *       400:
 *         description: 文件类型不支持、超出大小限制或未选择文件
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return response.badRequest(res, '请选择要上传的文件');
    }

    const fileData = {
      name: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploader: req.user._id,
      uploadTime: new Date()
    };

    const file = await File.create(fileData);

    const populatedFile = await File.findById(file._id)
      .populate('uploader', 'username name')
      .lean();

    return response.created(res, populatedFile, '文件上传成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/files/{id}:
 *   delete:
 *     tags: [Files]
 *     summary: 删除文件
 *     description: 删除指定文件及其磁盘存储，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 文件 ID
 *     responses:
 *       200:
 *         description: 文件删除成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       nullable: true
 *                     message:
 *                       type: string
 *                       example: '文件删除成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return response.notFound(res, '文件不存在');
    }

    const filePath = safeResolvePath(file.path);
    if (!filePath) {
      return response.badRequest(res, '非法文件路径');
    }
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await File.findByIdAndDelete(id);

    return response.success(res, null, '文件删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/files/{id}/download:
 *   get:
 *     tags: [Files]
 *     summary: 下载文件
 *     description: 根据 ID 下载文件，浏览器会以原始文件名提示保存
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 文件 ID
 *     responses:
 *       200:
 *         description: 返回文件二进制流
 *         content:
 *           application/octet-stream:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         description: 文件不存在或已丢失
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const downloadFile = async (req, res, next) => {
  try {
    const { id } = req.params;

    const file = await File.findById(id);
    if (!file) {
      return response.notFound(res, '文件不存在');
    }

    const filePath = safeResolvePath(file.path);
    if (!filePath) {
      return response.badRequest(res, '非法文件路径');
    }
    if (!fs.existsSync(filePath)) {
      return response.notFound(res, '文件已丢失');
    }

    res.download(filePath, file.name);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getFiles,
  getFileById,
  uploadFile,
  deleteFile,
  downloadFile
};
