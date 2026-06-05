const pool = require('../config/db');

const User = {
  // 按用户名查找
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash, created_at FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  // 按 ID 查找
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // 创建用户
  async create(username, passwordHash) {
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, passwordHash]
    );
    return result.insertId;
  },
};

module.exports = User;
