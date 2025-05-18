# Hackathon 项目后端

本项目是一个区块链 Hackathon 后端服务，用于连接区块链与数据库，提供 API 服务并监听智能合约事件。

## 项目技术栈

- Node.js
- Express.js
- Supabase (PostgreSQL)
- Ethers.js (区块链交互)

## 主要功能

1. 提供 RESTful API 接口，用于队伍和成员管理
2. 监听智能合约事件并同步到数据库
3. 处理队伍创建、成员加入、修改信息等操作

## 项目结构

```
├── Abi/                  # 智能合约 ABI 文件
├── src/
│   ├── routes/           # API 路由定义
│   ├── controllers/      # 业务逻辑控制器
│   ├── middleware/       # 中间件
│   ├── utils/            # 工具函数
│   ├── server.js         # Express 服务器启动文件
│   └── eventListener.js  # 区块链事件监听器
├── .env                  # 环境变量配置 (需要自行创建)
└── package.json          # 项目依赖
```

## 运行指南

### 环境要求

- Node.js v14 或更高版本
- npm 或 yarn
- Supabase 账户和 API 密钥

### 安装依赖

```bash
npm install
```

### 配置环境变量

创建一个 `.env` 文件，并添加以下配置：

```
# Supabase 配置
SUPABASE_KEY=your_supabase_key_here

# 区块链配置
RPC_URL=your_rpc_url_here
FACTORY_ADDRESS=your_factory_contract_address_here
```

### 启动后端服务

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动。

### 启动区块链事件监听器

```bash
npm run listen
```

监听器将连接到指定的区块链网络，并开始监听智能合约事件，将其同步到数据库。

## API 文档

### 队伍管理

- `GET /api/teams` - 获取所有队伍
- `GET /api/teams/:id` - 获取指定队伍详情
- `GET /api/teams/captain/:address` - 获取指定地址的队长信息

### 成员管理

- `GET /api/teams/:teamId/members` - 获取队伍成员列表
- `GET /api/members/:id` - 获取成员详情
- `GET /api/members/check/:address` - 检查地址是否已经是成员

### 入队申请管理

- `POST /api/join-requests` - 创建入队申请
- `GET /api/teams/:teamId/join-requests` - 获取队伍所有申请
- `GET /api/teams/:teamId/join-requests/pending` - 获取队伍待处理申请
- `PUT /api/join-requests/:id/handle` - 处理入队申请

## 状态码说明

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突(例如申请人已是队员)
- `500`: 服务器内部错误
