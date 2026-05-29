const File = require('../models/File');
const path = require('path');
const fs = require('fs');
const { config } = require('../config');
const response = require('../utils/response');

const uploadsDir = path.resolve(config.upload.path);

const safeResolvePath = (filePath) => {
  const resolved = path.resolve(path.join(uploadsDir, filePath));
  if (!resolved.startsWith(uploadsDir + path.sep) && resolved !== uploadsDir) return null;
  return resolved;
};

const getBaseUrl = (req) => `${req.protocol}://${req.get('host')}`;

const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']);

const formatFile = (file, baseUrl) => ({
  id: file._id,
  name: file.name,
  path: file.path,
  length: file.length,
  contentType: file.contentType,
  createUserId: file.createUserId?._id || file.createUserId,
  createTime: file.createdAt,
  url: `${baseUrl}/api/v1/files/preview/${file.path}`,
  thumbnail: IMAGE_TYPES.has(file.contentType) ? `${baseUrl}/api/v1/files/preview/${file.path}` : null,
  downloadUrl: `${baseUrl}/api/v1/files/download/${file.path}`,
  createUsername: file.createUserId?.username || null,
  createNickname: file.createUserId?.nickname || null
});

const getFiles = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, sort = 'createdAt', order = 'desc', name, path: filePath, createNickname } = req.query;

    const query = {};
    if (name) query.name = new RegExp(name, 'i');
    if (filePath) query.path = new RegExp(filePath, 'i');

    const pageNum = parseInt(page, 10);
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const skip = (pageNum - 1) * limitNum;
    const sortFieldMap = { createTime: 'createdAt', updateTime: 'updatedAt' };
    const sortObj = { [sortFieldMap[sort] || sort]: order === 'asc' ? 1 : -1 };

    if (createNickname) {
      const User = require('../models/User');
      const users = await User.find({ nickname: new RegExp(createNickname, 'i') }, '_id').lean();
      query.createUserId = { $in: users.map(u => u._id) };
    }

    let dbQuery = File.find(query).populate('createUserId', 'username nickname').sort(sortObj).skip(skip).limit(limitNum).lean();

    const [list, count] = await Promise.all([dbQuery, File.countDocuments(query)]);
    const baseUrl = getBaseUrl(req);

    return response.success(res, { list: list.map(f => formatFile(f, baseUrl)), count });
  } catch (error) {
    next(error);
  }
};

const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return response.badRequest(res, '请选择要上传的文件');

    const relativePath = path.relative(uploadsDir, req.file.path).replace(/\\/g, '/');
    const file = await File.create({
      name: Buffer.from(req.file.originalname, 'latin1').toString('utf8'),
      path: relativePath,
      length: req.file.size,
      contentType: req.file.mimetype,
      createUserId: req.user._id
    });

    const populated = await File.findById(file._id).populate('createUserId', 'username nickname').lean();
    return response.created(res, formatFile(populated, getBaseUrl(req)), '文件上传成功');
  } catch (error) {
    next(error);
  }
};

const uploadBase64 = async (req, res, next) => {
  try {
    const { base64, name, contentType } = req.body;
    if (!base64 || !name || !contentType) return response.badRequest(res, '缺少必要参数: base64, name, contentType');

    const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
    const data = matches ? matches[2] : base64;
    const buffer = Buffer.from(data, 'base64');

    if (buffer.length > config.upload.maxSize) return response.badRequest(res, '文件超出大小限制');

    const ext = path.extname(name).toLowerCase() || '.bin';
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, buffer);

    const file = await File.create({
      name,
      path: filename,
      length: buffer.length,
      contentType,
      createUserId: req.user._id
    });

    const populated = await File.findById(file._id).populate('createUserId', 'username nickname').lean();
    return response.created(res, formatFile(populated, getBaseUrl(req)), '文件上传成功');
  } catch (error) {
    next(error);
  }
};

const previewFile = async (req, res, next) => {
  try {
    const filePath = safeResolvePath(req.params[0]);
    if (!filePath || !fs.existsSync(filePath)) return response.notFound(res, '文件不存在');
    res.sendFile(filePath);
  } catch (error) {
    next(error);
  }
};

const downloadFile = async (req, res, next) => {
  try {
    const relativePath = req.params[0];
    const filePath = safeResolvePath(relativePath);
    if (!filePath || !fs.existsSync(filePath)) return response.notFound(res, '文件不存在');

    const file = await File.findOne({ path: relativePath }).lean();
    const filename = file ? file.name : path.basename(relativePath);
    res.download(filePath, filename);
  } catch (error) {
    next(error);
  }
};

const deleteFile = async (req, res, next) => {
  try {
    const { id } = req.params;
    const file = await File.findById(id);
    if (!file) return response.notFound(res, '文件不存在');

    const filePath = safeResolvePath(file.path);
    if (!filePath) return response.badRequest(res, '非法文件路径');
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await File.findByIdAndDelete(id);
    return response.success(res, null, '文件删除成功');
  } catch (error) {
    next(error);
  }
};

const batchDeleteFiles = async (req, res, next) => {
  try {
    const ids = req.body;
    if (!Array.isArray(ids) || ids.length === 0) return response.badRequest(res, '请提供要删除的文件ID列表');

    const files = await File.find({ _id: { $in: ids } }).lean();
    for (const file of files) {
      const filePath = safeResolvePath(file.path);
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await File.deleteMany({ _id: { $in: ids } });
    return response.success(res, null, '批量删除成功');
  } catch (error) {
    next(error);
  }
};

module.exports = { getFiles, uploadFile, uploadBase64, previewFile, downloadFile, deleteFile, batchDeleteFiles };
