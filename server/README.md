# TOS Terminal Operating System Backend

基于领域驱动设计的港口业务系统后端，采用Express.js框架构建。

## 🏗️ 架构设计

### 领域驱动设计 (DDD)
- **聚合根**: 船舶访问、积载计划、作业指令、起重机计划、集装箱管理
- **仓储模式**: 数据访问层抽象
- **应用服务**: 业务用例编排
- **领域事件**: 聚合间通信

### 分层架构
```
src/
├── domain/          # 领域层
│   └── aggregates/  # 聚合根
├── repositories/    # 仓储层
├── services/        # 应用服务层
├── routes/          # 接口层
├── middleware/      # 中间件
├── utils/           # 工具类
└── shared/          # 共享模块
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 8.0.0

### 安装依赖
```bash
cd server
npm install
```

### 环境配置
```bash
cp env.example .env
# 编辑 .env 文件配置环境变量
```

### 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 健康检查
```bash
curl http://localhost:3000/health
```

## 📋 API接口

### 船舶访问管理

#### 创建船舶访问
```http
POST /api/vessel-visits
Content-Type: application/json

{
  "vesselId": "VESSEL001",
  "visitDetails": {
    "eta": "2024-01-15T10:00:00Z",
    "etd": "2024-01-16T18:00:00Z",
    "berthId": "BERTH01",
    "agent": "COSCO",
    "remarks": "标准集装箱船"
  }
}
```

#### 获取船舶访问列表
```http
GET /api/vessel-visits?page=1&pageSize=10&status=PLANNED
```

#### 开始船舶访问
```http
POST /api/vessel-visits/:id/start
```

#### 完成船舶访问
```http
POST /api/vessel-visits/:id/complete
```

#### 获取统计信息
```http
GET /api/vessel-visits/statistics
```

### 响应格式
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "vesselId": "VESSEL001",
    "visitDetails": {...},
    "status": "PLANNED",
    "duration": 32,
    "createdAt": "2024-01-15T08:00:00Z",
    "updatedAt": "2024-01-15T08:00:00Z"
  },
  "message": "操作成功",
  "code": "SUCCESS",
  "timestamp": "2024-01-15T08:00:00Z"
}
```

## 🔧 开发指南

### 添加新的聚合

1. **创建聚合根**
```javascript
// src/domain/aggregates/NewAggregate.js
class NewAggregate extends AggregateRoot {
    constructor(id, data) {
        super(id);
        this.data = data;
        // 业务逻辑
    }
}
```

2. **创建仓储**
```javascript
// src/repositories/NewAggregateRepository.js
class NewAggregateRepository {
    async save(aggregate) { /* 实现 */ }
    async findById(id) { /* 实现 */ }
}
```

3. **创建应用服务**
```javascript
// src/services/NewAggregateService.js
class NewAggregateService {
    async createAggregate(data) { /* 实现 */ }
    async getAggregate(id) { /* 实现 */ }
}
```

4. **创建路由**
```javascript
// src/routes/newAggregateRoutes.js
router.post('/', asyncHandler(async (req, res) => {
    // 路由处理
}));
```

### 领域事件

系统使用领域事件实现聚合间通信：

```javascript
// 发布事件
this.apply(new DomainEvent(this.id, 'EventType', eventData));

// 事件存储
const events = aggregate.getUncommittedEvents();
```

### 错误处理

统一的错误处理机制：

```javascript
// 业务错误
throw new BusinessError('错误消息', 'ERROR_CODE');

// 验证错误
throw new ValidationError('字段错误', 'fieldName', value);
```

## 🧪 测试

### 运行测试
```bash
npm test
npm run test:watch
```

### 测试覆盖率
```bash
npm run test:coverage
```

## 📊 监控和日志

### 日志级别
- `error`: 错误信息
- `warn`: 警告信息
- `info`: 一般信息
- `debug`: 调试信息

### 业务日志
```javascript
logger.business('业务操作', { data });
logger.operation('操作记录', { details });
logger.security('安全事件', { event });
logger.performance('性能指标', { metrics });
```

## 🔒 安全特性

- **Helmet**: 安全头设置
- **CORS**: 跨域资源共享
- **Rate Limiting**: 请求频率限制
- **Input Validation**: 输入验证
- **Error Handling**: 统一错误处理

## 📈 性能优化

- **Compression**: 响应压缩
- **Caching**: 缓存策略
- **Connection Pooling**: 连接池
- **Async/Await**: 异步处理

## 🚀 部署

### Docker部署
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

### 环境变量
```bash
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

## 📚 文档

- [API文档](./docs/api.md)
- [架构设计](./docs/architecture.md)
- [部署指南](./docs/deployment.md)

## 🤝 贡献

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 📞 支持

如有问题，请联系开发团队。 