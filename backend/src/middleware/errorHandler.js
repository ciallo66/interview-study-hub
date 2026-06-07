const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err);
  const statusCode = err.status || 500;
  const message = err.message || err || '服务器内部错误';
  res.status(statusCode).json(error(message));
}

module.exports = errorHandler;
