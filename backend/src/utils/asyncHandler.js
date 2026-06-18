/**
 * 统一包装异步控制器，自动捕获错误并传递给 errorHandler
 *
 * 用法：
 *   const asyncHandler = require('../utils/asyncHandler');
 *   router.get('/xxx', asyncHandler(async (req, res, next) => { ... }));
 *
 * 原理：捕获 async 函数返回的 Promise rejection，调用 next(err)
 *       让 Express 的全局错误中间件统一处理。
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;