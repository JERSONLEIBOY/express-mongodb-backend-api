const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { config } = require('../config');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { code: 429, message: '登录尝试过于频繁，请 15 分钟后再试', data: null },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env !== 'production'
});

router.post('/login', loginLimiter, authController.login);

router.post('/logout', authenticate, authController.logout);

router.get('/current-user', authenticate, authController.getCurrentUser);

router.post('/refresh', authenticate, authController.refreshToken);

module.exports = router;
