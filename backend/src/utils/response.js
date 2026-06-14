/**
 * 统一 API 响应格式
 *   success:   成功响应
 *   fail:      业务错误（参数、逻辑）
 *   error:     服务端错误
 */

function success(data = null, message = 'ok') {
  return { code: 200, message, data };
}

function fail(message = '请求参数错误', code = 400) {
  return { code, message, data: null };
}

function error(message = '服务器内部错误') {
  return { code: 500, message, data: null };
}

module.exports = { success, fail, error };
