



const router = require('express').Router();
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { optionalAuth } = require('../middleware/auth');
const { z } = require('zod');
const { validate } = require('../middleware/validate');
const questionController = require('../controllers/question.controller');

// ── 公开路由（游客可访问，但如果有 token 也解析用户身份）──
router.get('/search', optionalAuth, asyncHandler(questionController.search));
router.get('/', optionalAuth, asyncHandler(questionController.list));
router.get('/:id', optionalAuth, asyncHandler(questionController.detail));

// ── 以下需要登录 ──
router.use(auth);

router.post(
  '/',
  validate({
    title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
    content: z.string().max(50000).optional().default(''),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
    source: z.string().max(100).optional().default(''),
    tagIds: z.array(z.number()).optional().default([]),
  }),
  asyncHandler(questionController.create)
);

router.put(
  '/:id',
  validate({
    title: z.string().min(1, '标题不能为空').max(200, '标题不能超过200个字符'),
    content: z.string().max(50000).optional().default(''),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('easy'),
    source: z.string().max(100).optional().default(''),
    tagIds: z.array(z.number()).optional().default([]),
  }),
  asyncHandler(questionController.update)
);

router.delete('/:id', asyncHandler(questionController.remove));
router.patch('/:id/toggle-mistake', asyncHandler(questionController.toggleMistake));

module.exports = router;
