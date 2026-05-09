const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.post('/login', authController.login);

router.post('/logout', authenticate, authController.logout);

router.get('/current-user', authenticate, authController.getCurrentUser);

router.post('/refresh', authenticate, authController.refreshToken);

module.exports = router;
