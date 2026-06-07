const { z } = require('zod');

/**
 * Zod 校验中间件工厂（中文错误提示）
 *
 * 用法：
 *   validate({ title: z.string().min(1).max(200) })
 *   validate({ difficulty: z.enum(['easy', 'medium', 'hard']) })
 *   validate({ tagIds: z.array(z.number()).optional() })
 *
 * @param {Object} schema - Zod 对象模式
 * @returns {Function} Express 中间件
 */
function validate(schema) {
  // 自定义中文错误消息
  const customizedSchema = {};
  for (const [key, rule] of Object.entries(schema)) {
    customizedSchema[key] = rule
      .or(z.literal('').transform(() => undefined)) // 空字符串转 undefined
      .describe(key);
  }

  const zodSchema = z.object(customizedSchema);

  return (req, res, next) => {
    // 先做存在性检查
    for (const [field, rule] of Object.entries(schema)) {
      const isRequired = !rule.isOptional?.();
      if (isRequired && (req.body[field] === undefined || req.body[field] === null || req.body[field] === '')) {
        return res.status(400).json({ code: 400, message: `${field} 不能为空`, data: null });
      }
    }

    const result = zodSchema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.issues.map((issue) => {
        const field = issue.path.join('.');
        switch (issue.code) {
          case 'too_small':
            return issue.minimum === 1
              ? `${field} 不能为空`
              : `${field} 长度不能少于 ${issue.minimum}`;
          case 'too_big':
            return `${field} 长度不能超过 ${issue.maximum}`;
          case 'invalid_type':
            if (issue.received === 'undefined') return `${field} 不能为空`;
            return `${field} 格式不正确`;
          case 'invalid_enum_value':
            return `${field} 只能为 ${issue.options.join(' / ')}`;
          default:
            return issue.message;
        }
      });
      return res.status(400).json({ code: 400, message: messages.join('; '), data: null });
    }
    req.body = result.data;
    next();
  };
}

module.exports = { validate };
