const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// 公开接口
router.post('/register', authController.register);
router.post('/login', authController.login);

// 需要登录的接口（测试用）
router.get('/me', auth, authController.me);

module.exports = router;
