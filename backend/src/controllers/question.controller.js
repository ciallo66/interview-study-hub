const Question = require('../models/question.model');
const { success, fail } = require('../utils/response');

const questionController = {
  // POST /api/questions
  async create(req, res, next) {
    const { title, content, difficulty, source, tagIds } = req.body;
    const questionId = await Question.create(
      req.userId,
      { title, content, difficulty, source },
      tagIds || []
    );
    const question = await Question.findById(questionId, req.userId);
    res.status(201).json(success(question, '创建成功'));
  },

  // GET /api/questions
  async list(req, res, next) {
    const { page, pageSize, difficulty, tagId, isMistake } = req.query;
    const result = await Question.findAll(req.userId, {
      page,
      pageSize,
      difficulty,
      tagId,
      isMistake,
    });
    res.json(success(result));
  },

  // GET /api/questions/search
  async search(req, res, next) {
    const { keyword, page, pageSize, tagId } = req.query;
    if (!keyword) {
      return res.json(success({ list: [], pagination: { total: 0 } }));
    }
    const result = await Question.search(req.userId, keyword, { page, pageSize, tagId });
    res.json(success(result));
  },

  // GET /api/questions/:id
  async detail(req, res, next) {
    const question = await Question.findById(req.params.id, req.userId);
    if (!question) {
      return res.status(404).json(fail('题目不存在', 404));
    }
    res.json(success(question));
  },

  // PUT /api/questions/:id
  async update(req, res, next) {
    const { title, content, difficulty, source, tagIds } = req.body;
    const affected = await Question.update(
          req.params.id,
          req.userId,
          req.userRole,
          { title, content, difficulty, source },
          tagIds || []
        );
    if (affected === 0) {
      return res.status(404).json(fail('题目不存在或无权修改', 404));
    }
    const question = await Question.findById(req.params.id, req.userId);
    res.json(success(question, '更新成功'));
  },

  // DELETE /api/questions/:id
  async remove(req, res, next) {
    const affected = await Question.delete(req.params.id, req.userId, req.userRole);
    if (affected === 0) {
      return res.status(404).json(fail('题目不存在或无权删除', 404));
    }
    res.json(success(null, '删除成功'));
  },

    // PATCH /api/questions/:id/toggle-mistake
  async toggleMistake(req, res, next) {
    // 先确认题目存在
    const exists = await Question.findById(req.params.id);
    if (!exists) {
      return res.status(404).json(fail('题目不存在', 404));
    }
    await Question.toggleMistake(req.params.id, req.userId);
    const question = await Question.findById(req.params.id, req.userId);
    res.json(success(question, question.is_mistake ? '已收藏' : '已取消收藏'));
  },
};

module.exports = questionController;

