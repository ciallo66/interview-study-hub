const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { z } = require('zod');
const tagController = require('../controllers/tag.controller');

// GET    /api/tags      — 全部标签
router.get('/', asyncHandler(tagController.list));

// 所有路由都需要登录
router.use(auth);

// POST   /api/tags      — 创建标签
router.post(
  '/',
  validate({
    name: z.string().min(1).max(50),
  }),
  asyncHandler(tagController.create)
);

// DELETE /api/tags/:id  — 删除标签
router.delete('/:id', asyncHandler(tagController.remove));

module.exports = router;
