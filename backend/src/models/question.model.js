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
  q.source, q.mistake_count,
  q.created_at, q.updated_at
`;

// ─────────────────────────────────────
// 辅助：构建 WHERE
// ─────────────────────────────────────

function buildWhereClause(filters = {}, favJoin = '') {
  const conditions = [];
  const params = [];

  // 只有明确传了 creatorId 时才按创建者过滤
  if (filters.creatorId) {
    conditions.push('q.user_id = ?');
    params.push(filters.creatorId);
  }

  if (filters.difficulty) {
    conditions.push('q.difficulty = ?');
    params.push(filters.difficulty);
  }
  if (filters.isMistake === 'true' || filters.isMistake === '1') {
    // 筛选收藏时，必须有 favJoin 才能引用 uf 表
    conditions.push('uf.user_id IS NOT NULL');
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
    // is_mistake 来自左连 user_favorites 的结果：有记录则为 true
    is_mistake: Boolean(row.uf_user_id),
    tags: row.tag_ids
      ? row.tag_ids.split(',').map((id, i) => ({
          id: Number(id),
          name: row.tag_names.split(',')[i],
        }))
      : [],
    tag_ids: undefined,
    tag_names: undefined,
    uf_user_id: undefined,
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
  async findAll(currentUserId, filters = {}) {
    const page = Math.max(1, Number(filters.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(filters.pageSize) || 20));
    const offset = (page - 1) * pageSize;

            // 先构建 favJoin，因为 buildWhereClause 里的 isMistake 筛选需要用到 uf 表
    // 注意：当 currentUserId 为 null（游客）时，即使传了 isMistake 也不会筛选到任何结果
    const hasUser = !!currentUserId;

    // 游客传 isMistake 筛选时，直接返回空结果
    if (!hasUser && (filters.isMistake === 'true' || filters.isMistake === '1')) {
      return { list: [], pagination: { page, pageSize, total: 0, totalPages: 0 } };
    }

    const favJoin = hasUser
      ? `LEFT JOIN user_favorites uf ON uf.question_id = q.id AND uf.user_id = ${Number(currentUserId)}`
      : '';

    const ufSelect = hasUser
      ? 'ANY_VALUE(uf.user_id) AS uf_user_id'
      : 'NULL AS uf_user_id';

    const { whereClause, params } = buildWhereClause(filters, favJoin);

    const baseFrom = `FROM questions q
       LEFT JOIN question_tags qt ON q.id = qt.question_id
       LEFT JOIN tags t ON qt.tag_id = t.id
       ${favJoin}`;

    // 计数
    const [countRows] = await pool.execute(
      `SELECT COUNT(DISTINCT q.id) AS total ${baseFrom} ${whereClause}`,
      params
    );
    const total = countRows[0].total;

    // 数据
    const [rows] = await pool.execute(
      `SELECT ${QUESTION_FIELDS},
              ${ufSelect},
              ${TAG_SELECT}
       ${baseFrom}
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

  // 单个题目详情（含标签 + 当前用户收藏状态）
  async findById(id, currentUserId) {
    // 没传 currentUserId（游客）时，跳过左连，is_mistake 直接为 false
    if (!currentUserId) {
      const [rows] = await pool.execute(
        `SELECT ${QUESTION_FIELDS},
                NULL AS uf_user_id,
                ${TAG_SELECT}
         FROM questions q
         LEFT JOIN question_tags qt ON q.id = qt.question_id
         LEFT JOIN tags t ON qt.tag_id = t.id
         WHERE q.id = ?
         GROUP BY q.id`,
        [id]
      );
      return rows.length > 0 ? parseTags(rows[0]) : null;
    }

    const [rows] = await pool.execute(
      `SELECT ${QUESTION_FIELDS},
              ANY_VALUE(uf.user_id) AS uf_user_id,
              ${TAG_SELECT}
       FROM questions q
       LEFT JOIN question_tags qt ON q.id = qt.question_id
       LEFT JOIN tags t ON qt.tag_id = t.id
       LEFT JOIN user_favorites uf ON uf.question_id = q.id AND uf.user_id = ?
       WHERE q.id = ?
       GROUP BY q.id`,
      [currentUserId, id]
    );
    return rows.length > 0 ? parseTags(rows[0]) : null;
  },

  // 更新题目 + 标签（事务）
    async update(id, userId, userRole, { title, content, difficulty, source }, tagIds = []) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let sql, params;
      if (userRole === 'admin') {
        sql = `UPDATE questions
               SET title = ?, content = ?, difficulty = ?, source = ?
               WHERE id = ?`;
        params = [title, content || '', difficulty || 'medium', source || '', id];
      } else {
        sql = `UPDATE questions
               SET title = ?, content = ?, difficulty = ?, source = ?
               WHERE id = ? AND user_id = ?`;
        params = [title, content || '', difficulty || 'medium', source || '', id, userId];
      }

      const [result] = await conn.execute(sql, params);

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
    async delete(id, userId, userRole) {
    let sql, params;
    if (userRole === 'admin') {
      sql = `DELETE FROM questions WHERE id = ?`;
      params = [id];
    } else {
      sql = `DELETE FROM questions WHERE id = ? AND user_id = ?`;
      params = [id, userId];
    }
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  },

  // 切换收藏（基于 user_favorites 关联表）
  async toggleMistake(id, userId) {
    // 先查是否已收藏
    const [existing] = await pool.execute(
      `SELECT 1 FROM user_favorites WHERE user_id = ? AND question_id = ?`,
      [userId, id]
    );

    if (existing.length > 0) {
      // 已收藏 → 取消收藏
      await pool.execute(
        `DELETE FROM user_favorites WHERE user_id = ? AND question_id = ?`,
        [userId, id]
      );
    } else {
      // 未收藏 → 添加收藏
      await pool.execute(
        `INSERT INTO user_favorites (user_id, question_id) VALUES (?, ?)`,
        [userId, id]
      );
    }

    return 1; // 始终返回 1 表示操作成功（因为题目存在即可操作）
  },

  // 全文搜索（独立接口，其实也可以合并到 findAll）
  async search(userId, keyword, filters = {}) {
    if (!keyword) return { list: [], pagination: { total: 0 } };
    return Question.findAll(userId, { ...filters, keyword });
  },
};

module.exports = Question;
