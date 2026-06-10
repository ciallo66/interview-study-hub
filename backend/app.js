require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');

const authRoutes = require('./src/routes/auth.routes');
const questionRoutes = require('./src/routes/question.routes');
const tagRoutes = require('./src/routes/tag.routes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// ---- 全局中间件 ----
app.use(compression());
app.use(cors());
app.use(express.json());

// ---- 路由挂载 ----
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/tags', tagRoutes);

// ---- 健康检查 ----
app.get('/api/health', (req, res) => {
  res.json({ code: 200, message: 'ok' });
});

// ---- 全局错误处理（必须放最后） ----
app.use(errorHandler);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

