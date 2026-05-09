const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { config } = require('../config');
const fileController = require('../controllers/file.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.upload.path);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxSize
  }
});

router.use(authenticate);

router.get('/', fileController.getFiles);
router.get('/:id', fileController.getFileById);
router.post('/upload', upload.single('file'), fileController.uploadFile);
router.delete('/:id', authorize('ADMIN'), fileController.deleteFile);
router.get('/:id/download', fileController.downloadFile);

module.exports = router;
