const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');
const { success, fail } = require('../utils/response');

const SALT_ROUNDS = 10;

const authController = {
  // 注册
  async register(req, res, next) {
    try {
      const { username, password } = req.body;

      // 参数校验
      if (!username || !password) {
        return res.status(400).json(fail('用户名和密码不能为空'));
      }
      if (username.length < 3 || username.length > 20) {
        return res.status(400).json(fail('用户名长度需在 3-20 之间'));
      }
      if (password.length < 6) {
        return res.status(400).json(fail('密码长度至少 6 位'));
      }

      // 检查用户名是否已存在
      const existingUser = await User.findByUsername(username);
      if (existingUser) {
        return res.status(400).json(fail('用户名已存在'));
      }

      // 加密密码并保存
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
      const userId = await User.create(username, passwordHash);

      // 签发 token
      console.log('--- 此时此刻我的 JWT_SECRET 是：', process.env.JWT_SECRET);
      const token = jwt.sign(
        { id: userId, username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json(success({ token, userId, username }, '注册成功'));
    } catch (err) {
      next(err);
    }
  },

  // 登录
  async login(req, res, next) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json(fail('用户名和密码不能为空'));
      }

      const user = await User.findByUsername(username);
      if (!user) {
        return res.status(400).json(fail('用户名或密码错误'));
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(400).json(fail('用户名或密码错误'));
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      res.json(success({ token, userId: user.id, username: user.username }, '登录成功'));
    } catch (err) {
      next(err);
    }
  },

  // 获取当前用户信息（测试 token 是否有效）
  async me(req, res, next) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json(fail('用户不存在'));
      }
      res.json(success({ id: user.id, username: user.username }));
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
