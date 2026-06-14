const pool = require('../config/db');

// ─────────────────────────────────────
// 基础查询（带标签聚合）
// ─────────────────────────────────────

const TAG_SELECT = `
  COALESCE(
    GROUP_CONCAT(DISTINCT t.name ORDER BY t.name SEPARATOR ','),
    ''
  ) AS tag_names,
  COALESCE(
    GROUP_CONCAT(DISTINCT t.id ORDER BY t.name SEPARATOR ','),
    ''
  ) AS tag_ids
`;

const QUESTION_FIELDS = `
  q.id, q.user_id, q.title, q.content, q.difficulty,
  q.source, q.is_mistake, q.mistake_count,
  q.created_at, q.updated_at
`;

// ─────────────────────────────────────
// 辅助：构建 WHERE
// ─────────────────────────────────────

function buildWhereClause(userId, filters = {}) {
  const conditions = [];
  const params = [];

  if (userId != null) {
    conditions.push('q.user_id = ?');
    params.push(userId);
  }

  if (filters.difficulty) {
    conditions.push('q.difficulty = ?');
    params.push(filters.difficulty);
  }
  if (filters.isMistake === 'true' || filters.isMistake === '1') {
    conditions.push('q.is_mistake = TRUE');
  }
  if (filters.tagId) {
    conditions.push('EXISTS (SELECT 1 FROM question_tags qt2 WHERE qt2.question_id = q.id AND qt2.tag_id = ?)');
    params.push(Number(filters.tagId));
  }
  if (filters.keyword) {
    conditions.push('MATCH(q.title, q.content) AGAINST(? IN BOOLEAN MODE)');
    params.push(`+${filters.keyword}*`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return { whereClause, params };
}

// ─────────────────────────────────────
// 辅助：解析 tag_ids 字符串 → 数组
// ─────────────────────────────────────

function parseTags(row) {
  return {
    ...row,
    is_mistake: Boolean(row.is_mistake),
    tags: row.tag_ids
      ? row.tag_ids.split(',').map((id, i) => ({
          id: Number(id),
          name: row.tag_names.split(',')[i],
        }))
      : [],
    tag_ids: undefined,
    tag_names: undefined,
  };
}

// ─────────────────────────────────────
// 公开方法
// ─────────────────────────────────────

const Question = {
  // 创建题目 + 标签关联（事务）
  async create(userId, { title, content, difficulty, source }, tagIds = []) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `INSERT INTO questions (user_id, title, content, difficulty, source)
         VALUES (?, ?, ?, ?, ?)`,
        [userId, title, content || '', difficulty || 'medium', source || '']
      );
      const questionId = result.insertId;

      if (tagIds.length > 0) {
        const values = tagIds.map((tagId) => [questionId, tagId]);
        await conn.query(
          `INSERT INTO question_tags (question_id, tag_id) VALUES ?`,
          [values]
        );
      }

      await conn.commit();
      return questionId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // 分页列表（含标签 + 筛选）
  async findAll(userId, filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
    const offset = (page - 1) * pageSize;

    const { whereClause, params } = buildWhereClause(userId, filters);

    // 计数
    const [countRows] = await pool.execute(
      `SELECT COUNT(DISTINCT q.id) AS total
       FROM questions q
       LEFT JOIN question_tags qt ON q.id = qt.question_id
       LEFT JOIN tags t ON qt.tag_id = t.id
       ${whereClause}`,
             params
           );
           const total = countRows[0].total;

           // 数据
           const [rows] = await pool.execute(
             `SELECT ${QUESTION_FIELDS}, ${TAG_SELECT}
              FROM questions q
              LEFT JOIN question_tags qt ON q.id = qt.question_id
              LEFT JOIN tags t ON qt.tag_id = t.id
              ${whereClause}
       GROUP BY q.id
       ORDER BY q.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, String(pageSize), String(offset)]
    );

    return {
      list: rows.map(parseTags),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  // 单个题目详情（含标签）
  async findById(id, userId) {
    const conditions = ['q.id = ?'];
    const params = [id];

    if (userId != null) {
      conditions.push('q.user_id = ?');
      params.push(userId);
    }

    const [rows] = await pool.execute(
      `SELECT ${QUESTION_FIELDS}, ${TAG_SELECT}
       FROM questions q
       LEFT JOIN question_tags qt ON q.id = qt.question_id
       LEFT JOIN tags t ON qt.tag_id = t.id
       WHERE ${conditions.join(' AND ')}
       GROUP BY q.id`,
      params
    );
    return rows.length > 0 ? parseTags(rows[0]) : null;
  },

  // 更新题目 + 标签（事务）
  async update(id, userId, { title, content, difficulty, source }, tagIds = []) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.execute(
        `UPDATE questions
         SET title = ?, content = ?, difficulty = ?, source = ?
         WHERE id = ? AND user_id = ?`,
        [title, content || '', difficulty || 'medium', source || '', id, userId]
      );

      if (result.affectedRows === 0) {
        await conn.rollback();
        return 0;
      }

      // 标签：先删后插
      await conn.execute(`DELETE FROM question_tags WHERE question_id = ?`, [id]);
      if (tagIds.length > 0) {
        const values = tagIds.map((tagId) => [id, tagId]);
        await conn.query(`INSERT INTO question_tags (question_id, tag_id) VALUES ?`, [values]);
      }

      await conn.commit();
      return result.affectedRows;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  },

  // 删除题目
  async delete(id, userId) {
    const [result] = await pool.execute(
      `DELETE FROM questions WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return result.affectedRows;
  },

  // 切换错题标记
  async toggleMistake(id, userId) {
    const [result] = await pool.execute(
      `UPDATE questions
       SET is_mistake = NOT is_mistake,
           mistake_count = mistake_count + 1
       WHERE id = ? AND user_id = ?`,
      [id, userId]
    );
    return result.affectedRows;
  },

  // 全文搜索（独立接口，其实也可以合并到 findAll）
  async search(userId, keyword, filters = {}) {
    if (!keyword) return { list: [], pagination: { total: 0 } };
    return Question.findAll(userId, { ...filters, keyword });
  },
};

module.exports = Question;
