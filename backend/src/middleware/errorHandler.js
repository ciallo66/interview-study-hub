const { error } = require('../utils/response');

function errorHandler(err, req, res, next) {
  console.error('[Error]', err.message || err);
  const statusCode = err.status || 500;
  res.status(statusCode).json(error(err.message || '服务器内部错误'));
}

module.exports = errorHandler;
