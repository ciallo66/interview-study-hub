const router = require('express').Router();
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { z } = require('zod');
const questionController = require('../controllers/question.controller');

// 所有路由都需要登录
router.use(auth);

// GET  /api/questions         — 列表
// GET  /api/questions/search  — 全文搜索
router.get('/search', questionController.search);
router.get('/', questionController.list);

// POST /api/questions         — 创建
router.post(
  '/',
  validate({
    title: z.string().min(1).max(200),
    content: z.string().max(50000).optional().default(''),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    source: z.string().max(100).optional().default(''),
    tagIds: z.array(z.number()).optional().default([]),
  }),
  questionController.create
);

// GET  /api/questions/:id     — 详情
router.get('/:id', questionController.detail);

// PUT  /api/questions/:id     — 更新
router.put(
  '/:id',
  validate({
    title: z.string().min(1).max(200),
    content: z.string().max(50000).optional().default(''),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    source: z.string().max(100).optional().default(''),
    tagIds: z.array(z.number()).optional().default([]),
  }),
  questionController.update
);

// DELETE /api/questions/:id   — 删除
router.delete('/:id', questionController.remove);

// PATCH  /api/questions/:id/toggle-mistake — 切换错题
router.patch('/:id/toggle-mistake', questionController.toggleMistake);

module.exports = router;
