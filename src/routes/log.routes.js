const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// 登录日志
router.get('/login-logs/page', logController.getLoginLogsPage);
router.get('/login-logs', logController.getLoginLogs);
router.delete('/login-logs', authorize('ADMIN'), logController.clearLoginLogs);

// 操作日志
router.get('/operation-logs/page', logController.getOperationLogsPage);
router.get('/operation-logs', logController.getOperationLogs);
router.delete('/operation-logs', authorize('ADMIN'), logController.clearOperationLogs);

module.exports = router;
