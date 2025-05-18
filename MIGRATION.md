# 从Prisma迁移到Supabase

## 迁移概述

本项目已从Prisma ORM迁移到Supabase数据库服务。以下是迁移的主要步骤和更改：

### 1. 安装依赖

添加Supabase客户端库：

```bash
npm install @supabase/supabase-js
```

移除Prisma相关依赖：

```bash
npm uninstall @prisma/client @prisma/extension-accelerate prisma
```

### 2. 数据库连接配置

创建了新的`src/services/supabase.ts`文件，用于初始化Supabase客户端：

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://raautdvmjylvbjisqosg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
```

### 3. 表结构迁移

需要在Supabase中创建以下表，对应原Prisma模型：

#### Team表
- id (number, 主键)
- name (text) 
- tokenURI (text)
- captainAddress (text, 唯一约束)
- createdAt (timestamp with timezone)

#### Member表
- id (number, 主键)
- name (text)
- tokenURI (text)
- address (text, 唯一约束)
- role (integer)
- teamId (integer, 外键引用Team表的id)
- createdAt (timestamp with timezone)

#### TeamJoinRequest表
- id (integer, 主键, 自动递增)
- applicant (text)
- teamId (integer, 外键引用Team表的id)
- name (text)
- role (integer)
- status (text, 枚举: 'PENDING', 'APPROVED', 'REJECTED')
- createdAt (timestamp with timezone)
- updatedAt (timestamp with timezone)

### 4. 代码更改

修改了以下文件以使用Supabase替代Prisma：

- `src/services/teamService.ts`
- `src/services/teamJoinRequestService.ts`
- `src/services/contractEventService.ts`

主要更改包括：

- 使用Supabase的查询API替代Prisma的ORM方法
- 更新错误处理逻辑
- 明确处理时间戳字段

### 5. 环境变量

需要在.env文件中设置以下环境变量：

```
SUPABASE_KEY=your_supabase_key
```

## 如何测试迁移

1. 确保设置了正确的环境变量
2. 运行开发服务器：`npm run dev`
3. 运行演示脚本：`npm run demo`

## 注意事项

- 确保Supabase项目中已创建所有必要的表和关系
- 检查RLS（行级安全）策略，确保应用程序有足够的权限访问数据 