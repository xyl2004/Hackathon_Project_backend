const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { testConnection } = require('./supabase');

// 路由模块
const teamsRouter = require('./routes/teams');
const membersRouter = require('./routes/members');
const joinRequestsRouter = require('./routes/joinRequests');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/teams', teamsRouter);
app.use('/api/members', membersRouter);
app.use('/api/join-requests', joinRequestsRouter);

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: '服务运行正常',
    timestamp: new Date().toISOString()
  });
});

// 主页
app.get('/', (req, res) => {
  res.status(200).json({
    message: '欢迎使用团队管理API',
    documentation: '/api-docs',
    version: '1.0.0'
  });
});

// 错误处理中间件
app.use((req, res, next) => {
  res.status(404).json({
    status: 'error',
    message: '请求的资源不存在'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试Supabase连接
    const dbConnected = await testConnection();
    
    if (!dbConnected) {
      console.error('❌ 无法连接到Supabase数据库，请检查您的凭据和网络连接');
      process.exit(1);
    }
    
    app.listen(PORT, () => {
      console.log(`
🚀 服务器已启动并运行在: http://localhost:${PORT}
📚 API接口:
   - GET     /api/teams               获取所有团队
   - GET     /api/teams/:id           获取特定团队
   - GET     /api/teams/captain/:addr 获取队长的团队
   - GET     /api/teams/:id/requests  获取团队的所有入队申请
   - GET     /api/teams/:id/pending-count  获取团队待处理申请数量
   
   - GET     /api/members             获取所有成员
   - GET     /api/members/team/:id    获取团队成员
   - GET     /api/members/:id         获取特定成员
   - GET     /api/members/address/:addr 获取钱包地址的成员
   
   - GET     /api/join-requests       获取所有申请
   - GET     /api/join-requests/team/:id 获取团队申请
   - GET     /api/join-requests/team/:id/stats 获取团队申请统计(待处理/已批准/已拒绝)
   - GET     /api/join-requests/team/:id/count 获取团队特定状态申请数量
   - GET     /api/join-requests/applicant/:addr 获取用户申请
   - POST    /api/join-requests       创建入队申请
   - PATCH   /api/join-requests/:id   处理入队申请
      `);
    });
  } catch (error) {
    console.error('❌ 服务器启动失败:', error);
    process.exit(1);
  }
};

startServer(); 