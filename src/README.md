# Supabase团队管理API

这是一个基于Supabase数据库的团队管理API服务。该服务提供了团队、成员和入队申请的管理功能。

## 功能特点

- 团队管理：创建、查询团队
- 成员管理：添加、查询成员
- 入队申请：申请入队、处理申请

## 开始使用

### 前提条件

- Node.js 14.x 或更高版本
- npm 或 yarn
- Supabase账户和项目

### 安装

1. 克隆此仓库
2. 安装依赖包

```bash
npm install
```

### 配置

在项目根目录创建一个`.env`文件，包含以下环境变量：

```
# Supabase配置
SUPABASE_KEY=your_supabase_key_here

# 服务器配置
PORT=3000
```

### 运行服务

开发模式运行：

```bash
npm run dev
```

生产模式运行：

```bash
npm start
```

## API接口

### 团队相关

- `GET /api/teams` - 获取所有团队
- `GET /api/teams/:id` - 获取特定团队详情
- `GET /api/teams/captain/:address` - 获取队长的团队
  - 返回格式: `{ "status": "success", "isCaptain": true, "team": {...} }`
- `GET /api/teams/:id/pending-count` - 获取队伍待处理申请数量
  - 返回格式: `{ "status": "success", "count": 5 }`

### 成员相关

- `GET /api/members` - 获取所有成员
- `GET /api/members/team/:teamId` - 获取特定团队的所有成员
- `GET /api/members/:id` - 获取特定成员详情
- `GET /api/members/address/:address` - 获取指定地址的成员

### 入队申请

- `GET /api/join-requests` - 获取所有入队申请
  - 可选参数：`?status=PENDING|APPROVED|REJECTED`
- `GET /api/join-requests/team/:teamId` - 获取特定团队的所有入队申请
  - 可选参数：`?status=PENDING|APPROVED|REJECTED`
- `GET /api/join-requests/team/:teamId/count` - 获取特定团队的申请数量
  - 可选参数：`?status=PENDING|APPROVED|REJECTED`（默认为PENDING）
  - 返回格式: `{ "status": "success", "team_id": "0", "request_status": "PENDING", "count": 3 }`
- `GET /api/join-requests/applicant/:address` - 获取特定用户的所有入队申请
  - 可选参数：`?status=PENDING|APPROVED|REJECTED`
- `POST /api/join-requests` - 创建入队申请
  - 请求体：`{ "applicant": "0x...", "team_id": 0, "name": "张三", "role": 3 }`
  - 注意：字段名使用下划线命名法（team_id）与数据库字段保持一致
- `PATCH /api/join-requests/:id` - 处理入队申请
  - 请求体：`{ "status": "APPROVED" }` 或 `{ "status": "REJECTED" }`
  - 当状态为APPROVED时，会自动将申请人添加为团队成员

## 示例代码

查看 `src/examples/client.js` 文件了解如何使用API。

运行示例：

```bash
node src/examples/client.js
```

## 区块链事件监听

为了保持数据最新，本服务还包含区块链事件监听功能：

- 监听实时事件：`npm run blockchain:listen`
- 同步历史事件：`npm run sync`

## 数据库结构

本服务使用Supabase(PostgreSQL)作为数据库，主要表结构如下：

### teams表

```sql
CREATE TABLE teams (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  token_uri TEXT NOT NULL,
  captain_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### members表

```sql
CREATE TABLE members (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  token_uri TEXT NOT NULL,
  address TEXT NOT NULL UNIQUE,
  role INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

### team_join_requests表

```sql
CREATE TABLE team_join_requests (
  id SERIAL PRIMARY KEY,
  applicant TEXT NOT NULL,
  team_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  role INTEGER NOT NULL,
  status request_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id)
);
```

## 常见问题

### RLS(行级安全)错误

如果您遇到权限错误，请检查您的Supabase项目中的RLS策略是否正确配置。对于开发阶段，您可以暂时禁用RLS：

```sql
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE members DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_join_requests DISABLE ROW LEVEL SECURITY;
```

### 找不到团队/成员

请确保您的Supabase数据库中已有相关数据。您可以使用区块链同步工具从链上同步数据。 