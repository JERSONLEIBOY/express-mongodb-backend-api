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
