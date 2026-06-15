const jwt = require('jsonwebtoken');
const { fail } = require('../utils/response');

// 强制认证——没 token 直接 401
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json(fail('未登录，请先登录', 401));
  }

  const token = header.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json(fail('登录已过期，请重新登录', 401));
  }
}

// 可选认证——有 token 就解析用户，没有就当游客
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    req.userId = decoded.id;
  } catch (err) {
    // token 无效，忽略，当游客处理
  }

  next();
}

module.exports = auth;
module.exports.optionalAuth = optionalAuth;

