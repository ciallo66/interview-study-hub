//链式调用直接引入express，创建express身上的router实例
const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');

const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');

// 公开接口
router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// 需要登录的接口
router.get('/me', auth, asyncHandler(authController.me));

module.exports = router;
