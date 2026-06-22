//导入包
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//导入其他文件数据
const User = require('../models/user.model');
const { success, fail } = require('../utils/response');
//初始化盐的轮数
const SALT_ROUNDS = 10;

//核心逻辑，两个函数
const authController = {
  // 注册
  async register(req, res, next) {
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

        // 加密密码并保存，新用户默认角色为 user
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const role = 'user';
    const userId = await User.create(username, passwordHash, role);

    // 签发 token
    const token = jwt.sign(
      { id: userId, username, role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json(success({ token, userId, username, role }, '注册成功'));
  },

  // 登录
  async login(req, res, next) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json(fail('用户名和密码不能为空'));
    }

    //检测有误对应账号
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(400).json(fail('用户名或密码错误'));
    }
    
    //bcrypt验证数据库的密文和登录时输入的明文是否对应
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json(fail('用户名或密码错误'));
    }

    //以上都没问题签发token返回
    const token = jwt.sign(
      { id: user.id, username: user.username ,role: user.role},
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    res.json(success({ token, userId: user.id, username: user.username, role:user.role}, '登录成功'));
  },

  // 获取当前用户信息（测试 token 是否有效）
  async me(req, res, next) {
    const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json(fail('用户不存在'));
      }
      res.json(success({ id: user.id, username: user.username }));
  },

};

module.exports = authController;
