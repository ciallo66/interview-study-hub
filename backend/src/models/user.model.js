const pool = require('../config/db');

//业务逻辑全用参数化查询(数据库预处理)
const User = {
  // 查找用户名
  async findByUsername(username) {
    const [rows] = await pool.execute(
      'SELECT id, username, password_hash,role, created_at FROM users WHERE username = ?',
      [username]
    );
    return rows[0] || null;
  },

  // 查找ID 
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT id, username,role, created_at FROM users WHERE id = ?',
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

  async findByrole(role){
    const [rows] = await pool.execute(
      'SELECT id, username, role, created_at FROM users WHERE role = ?',
      [role]
    );
    //role有很多相同的，需要返回一个数组
    return rows;
  }
};

module.exports = User;
