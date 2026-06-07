const router = require('express').Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { z } = require('zod');
const tagController = require('../controllers/tag.controller');

// 所有路由都需要登录
router.use(auth);

// GET    /api/tags      — 全部标签
router.get('/', tagController.list);

// POST   /api/tags      — 创建标签
router.post(
  '/',
  validate({
    name: z.string().min(1).max(50),
  }),
  tagController.create
);

// DELETE /api/tags/:id  — 删除标签
router.delete('/:id', tagController.remove);

module.exports = router;
