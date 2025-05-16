# 队伍管理系统接口文档
端口：
http://localhost:3000
## 数据模型

### 队伍(Team)
- `id`: 整数，主键
- `name`: 字符串，队伍名称
- `tokenURI`: 字符串，队伍NFT URI
- `captainAddress`: 字符串，队长地址(唯一)
- `members`: 成员列表
- `createdAt`: 创建时间
- `joinRequests`: 入队申请列表

### 成员(Member)
- `id`: 整数，主键
- `name`: 字符串，成员名称
- `tokenURI`: 字符串，成员NFT URI
- `address`: 字符串，成员地址(唯一)
- `role`: 整数，成员角色
- `teamId`: 整数，所属队伍ID
- `createdAt`: 创建时间

### 入队申请(TeamJoinRequest)
- `id`: 整数，主键(自动递增)
- `applicant`: 字符串，申请人地址
- `teamId`: 整数，申请加入的队伍ID
- `name`: 字符串，申请人想使用的名称
- `role`: 整数，申请的角色
- `status`: 枚举，申请状态(PENDING/APPROVED/REJECTED)
- `createdAt`: 创建时间
- `updatedAt`: 更新时间

## API接口

### 队伍管理

#### 创建队伍（链上交互）
- **接口**: `/api/teams/create`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "name": "队伍名称",
    "tokenURI": "ipfs://team-metadata",
    "signerAddress": "0x..."  // 队长钱包地址
  }
  ```
- **响应**:
  ```json
  {
    "teamId": 0,
    "txHash": "0x...",  // 交易哈希
    "status": "success"
  }
  ```
- **说明**: 该操作需要支付0.1 ETH创建队伍，前端需要处理钱包连接

#### 获取队伍详情
- **接口**: `/api/teams/{id}`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "id": 0,
    "name": "队伍名称",
    "tokenURI": "ipfs://team-metadata",
    "captainAddress": "0x...",
    "createdAt": "2023-01-01T00:00:00Z",
    "members": [
      {
        "id": 0,
        "name": "成员名称",
        "address": "0x...",
        "role": 2,
        "tokenURI": "ipfs://member-metadata"
      }
    ]
  }
  ```

#### 获取指定地址的队长信息
- **接口**: `/api/teams/captain/{address}`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "isCaptain": true,
    "team": {
      "id": 0,
      "name": "队伍名称",
      "tokenURI": "ipfs://team-metadata",
      "captainAddress": "0x...",
      "createdAt": "2023-01-01T00:00:00Z"
    }
  }
  ```

### 成员管理

#### 获取队伍成员列表
- **接口**: `/api/teams/{teamId}/members`
- **方法**: `GET`
- **响应**:
  ```json
  [
    {
      "id": 0,
      "name": "成员名称",
      "address": "0x...",
      "role": 2,
      "tokenURI": "ipfs://member-metadata",
      "createdAt": "2023-01-01T00:00:00Z"
    }
  ]
  ```

#### 获取成员详情
- **接口**: `/api/members/{id}`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "id": 0,
    "name": "成员名称",
    "address": "0x...",
    "role": 2,
    "teamId": 0,
    "tokenURI": "ipfs://member-metadata",
    "createdAt": "2023-01-01T00:00:00Z",
    "team": {
      "id": 0,
      "name": "队伍名称"
    }
  }
  ```

#### 检查地址是否已经是成员
- **接口**: `/api/members/check/{address}`
- **方法**: `GET`
- **响应**:
  ```json
  {
    "isMember": true,
    "memberInfo": {
      "id": 0,
      "name": "成员名称",
      "address": "0x...",
      "role": 2,
      "teamId": 0
    }
  }
  ```

### 入队申请管理

#### 创建入队申请
- **接口**: `/api/join-requests`
- **方法**: `POST`
- **请求体**:
  ```json
  {
    "applicant": "0x...",
    "teamId": 0,
    "name": "申请人名称",
    "role": 2
  }
  ```
- **响应**:
  ```json
  {
    "id": 0,
    "applicant": "0x...",
    "teamId": 0,
    "name": "申请人名称",
    "role": 2,
    "status": "PENDING",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z"
  }
  ```

#### 获取队伍待处理申请
- **接口**: `/api/teams/{teamId}/join-requests/pending`
- **方法**: `GET`
- **响应**:
  ```json
  [
    {
      "id": 0,
      "applicant": "0x...",
      "teamId": 0,
      "name": "申请人名称",
      "role": 2,
      "status": "PENDING",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    }
  ]
  ```

#### 获取队伍所有申请
- **接口**: `/api/teams/{teamId}/join-requests`
- **方法**: `GET`
- **响应**:
  ```json
  [
    {
      "id": 0,
      "applicant": "0x...",
      "teamId": 0,
      "name": "申请人名称",
      "role": 2,
      "status": "PENDING",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-01T00:00:00Z"
    },
    {
      "id": 1,
      "applicant": "0x...",
      "teamId": 0,
      "name": "申请人名称",
      "role": 3,
      "status": "APPROVED",
      "createdAt": "2023-01-01T00:00:00Z",
      "updatedAt": "2023-01-02T00:00:00Z"
    }
  ]
  ```

#### 处理入队申请（链上交互）
- **接口**: `/api/join-requests/{id}/handle`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "approved": true,
    "signerAddress": "0x..."  // 队长钱包地址，用于签名交易
  }
  ```
- **响应**:
  ```json
  {
    "id": 0,
    "applicant": "0x...",
    "teamId": 0,
    "name": "申请人名称",
    "role": 2,
    "status": "APPROVED",
    "txHash": "0x...",  // 仅当approved为true时返回
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-02T00:00:00Z"
  }
  ```

### 合约事件与交互

#### 更新团队成员URI（链上交互）
- **接口**: `/api/teams/{teamId}/update-uris`
- **方法**: `PUT`
- **请求体**:
  ```json
  {
    "teamName": "更新后的队伍名称",
    "newTokenURIs": ["ipfs://member1-new-uri", "ipfs://member2-new-uri"],
    "signerAddress": "0x..."  // 队长钱包地址
  }
  ```
- **响应**:
  ```json
  {
    "teamId": 0,
    "memberIds": [1, 2],  // 已更新的成员ID列表
    "txHash": "0x...",
    "status": "success"
  }
  ```

#### 解散团队（链上交互）
- **接口**: `/api/teams/{teamId}/dissolve`
- **方法**: `DELETE`
- **请求体**:
  ```json
  {
    "signerAddress": "0x..."  // 队长钱包地址
  }
  ```
- **响应**:
  ```json
  {
    "teamId": 0,
    "txHash": "0x...",
    "returnedAmount": "0.1",  // 返还的ETH金额
    "status": "success"
  }
  ```

## WebSocket 实时事件通知
WebSocket端点：`wss://your-backend-url/events`

### 支持的事件类型
- `TEAM_CREATED`: 新队伍创建
- `MEMBER_ADDED`: 新成员加入
- `TEAM_URIS_UPDATED`: 队伍URI更新
- `TEAM_DISSOLVED`: 队伍解散

### 事件数据格式
```json
{
  "type": "TEAM_CREATED",
  "data": {
    "teamId": 0,
    "captain": "0x...",
    "name": "队伍名称",
    "tokenURI": "ipfs://team-metadata"
  }
}
```

## 状态码说明

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未授权
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突(例如申请人已是队员)
- `500`: 服务器内部错误

## 角色ID对照表

| 角色ID | 角色名称 |
|-------|--------|
| 1     | 队长    |
| 2     | 副队长  |
| 3     | 普通队员 |
| 4     | 技术专家 |
| 5     | 战术指挥 |

## 区块链交互说明

### 钱包连接
前端需要使用Web3钱包（如MetaMask）处理用户签名和交易。对于需要区块链交互的接口，前端应:

1. 连接用户钱包
2. 获取用户签名
3. 将签名或地址传递给后端API
4. 后端将执行合约调用并返回交易结果

### 交易费用
- 创建队伍需要支付0.1 ETH
- 添加成员不需要额外支付ETH
- 解散队伍时，将返还0.1 ETH给队长

### 测试网络
当前合约部署在Sepolia测试网络上，您需要:
1. 将MetaMask连接到Sepolia网络
2. 获取测试ETH: https://sepoliafaucet.com/

## 前端集成示例

### 使用axios调用API示例
```javascript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

// 创建队伍示例
async function createTeam(name, tokenURI, signer) {
  try {
    // 获取用户钱包地址
    const signerAddress = await signer.getAddress();
    
    // 调用后端API
    const response = await axios.post(`${API_URL}/teams/create`, {
      name,
      tokenURI,
      signerAddress
    });
    
    return response.data;
  } catch (error) {
    console.error('创建队伍失败:', error);
    throw error;
  }
}
```

### 连接WebSocket接收实时事件示例
```javascript
function connectToEventStream(onEvent) {
  const socket = new WebSocket('wss://your-backend-url/events');
  
  socket.onopen = () => {
    console.log('WebSocket连接已建立');
  };
  
  socket.onmessage = (event) => {
    const eventData = JSON.parse(event.data);
    onEvent(eventData);
  };
  
  socket.onerror = (error) => {
    console.error('WebSocket错误:', error);
  };
  
  socket.onclose = () => {
    console.log('WebSocket连接已关闭');
    // 可以添加重连逻辑
  };
  
  return {
    close: () => socket.close()
  };
}
``` 