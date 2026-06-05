const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json(fail('未登录，请先登录', 401));
  }

  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;   // 后续路由通过 req.userId 获取当前用户
    next();
  } catch (err) {
    return res.status(401).json(fail('登录已过期，请重新登录', 401));
  }
}

module.exports = auth;
