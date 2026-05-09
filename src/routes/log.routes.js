const express = require('express');
const router = express.Router();
const logController = require('../controllers/log.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/login-logs', logController.getLoginLogs);
router.get('/login-logs/:id', logController.getLoginLogById);
router.delete('/login-logs', authorize('ADMIN'), logController.clearLoginLogs);

router.get('/operation-logs', logController.getOperationLogs);
router.get('/operation-logs/:id', logController.getOperationLogById);
router.delete('/operation-logs', authorize('ADMIN'), logController.clearOperationLogs);

module.exports = router;
