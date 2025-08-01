# TOS聚合设计总结

## 一、聚合设计决策

### 核心聚合识别

基于港口业务领域分析，识别出5个核心聚合：

1. **Vessel Visit（船舶访问）聚合**
   - **聚合根**：Vessel Visit
   - **边界**：一次完整的船舶进出港业务周期
   - **职责**：管理船舶访问的生命周期

2. **Stowage Plan（积载计划）聚合**
   - **聚合根**：Stowage Plan
   - **边界**：船舶货物分布规划
   - **职责**：管理进港和出港积载计划

3. **Work Instruction（工作指令）聚合**
   - **聚合根**：Work Instruction
   - **边界**：装卸作业执行指令
   - **职责**：管理装卸作业指令的执行

4. **Crane Plan（起重机计划）聚合**
   - **聚合根**：Crane Plan
   - **边界**：起重机作业调度
   - **职责**：管理起重机作业调度

5. **Container Management（集装箱管理）聚合**
   - **聚合根**：Container
   - **边界**：集装箱生命周期管理
   - **职责**：管理集装箱位置和状态

## 二、聚合设计原则

### 1. **业务完整性原则**
- 聚合边界反映业务完整性
- 聚合内实体紧密相关
- 聚合根保护聚合内部一致性

### 2. **一致性边界原则**
- 事务边界与聚合边界一致
- 聚合内数据一致性保证
- 聚合间通过事件通信

### 3. **性能优化原则**
- 聚合大小适中，避免大聚合
- 支持聚合的并发访问
- 考虑聚合的读写分离

### 4. **扩展性设计原则**
- 预留业务规则扩展点
- 支持新的作业策略接入
- 通过领域事件支持功能扩展

## 三、聚合间关系设计

### 聚合间通信方式
- **领域事件**：聚合间通过领域事件通信
- **ID引用**：聚合间使用ID引用而非对象引用
- **事件溯源**：使用事件溯源处理复杂状态变化

### 核心业务场景
1. **船舶到港流程**：Vessel Visit → Stowage Plan → Work Instruction
2. **装卸作业流程**：Work Instruction → Crane Plan → Container Management
3. **船舶离港流程**：Stowage Plan → Work Instruction → Vessel Visit

## 四、领域事件设计

### 事件分类
- **船舶访问事件**：VesselVisitCreated、VesselVisitStarted、VesselVisitCompleted
- **积载计划事件**：StowagePlanImported、StowagePlanModified、StowageErrorDetected
- **工作指令事件**：WorkInstructionIssued、WorkInstructionStarted、WorkInstructionCompleted
- **起重机计划事件**：CranePlanCreated、CranePlanOptimized、CranePlanExecuted

### 事件流设计
- 事件按业务时序流动
- 事件支持异步处理
- 事件包含必要的业务数据

## 五、聚合设计验证

### 业务规则验证
| 聚合 | 业务规则 | 验证点 |
|------|----------|--------|
| Vessel Visit | 一次访问对应一个船舶 | 船舶ID唯一性检查 |
| Stowage Plan | 进港出港计划独立 | 计划类型隔离 |
| Work Instruction | 指令基于积载计划 | 计划依赖关系 |
| Crane Plan | 起重机能力约束 | 设备能力检查 |
| Container Management | 位置唯一性 | 位置冲突检测 |

### 性能验证
- 聚合大小适中，支持并发访问
- 聚合间通过事件异步通信
- 支持聚合的读写分离

### 扩展性验证
- 聚合边界预留扩展空间
- 领域事件支持松耦合扩展
- 聚合设计支持业务规则变更

## 六、实施建议

### 1. **分阶段实施**
- 第一阶段：实现核心聚合（Vessel Visit、Stowage Plan）
- 第二阶段：实现作业聚合（Work Instruction、Crane Plan）
- 第三阶段：实现管理聚合（Container Management）

### 2. **技术实现**
- 使用事件溯源架构
- 实现领域事件总线
- 支持聚合的并发控制

### 3. **测试策略**
- 单元测试：测试聚合内部业务规则
- 集成测试：测试聚合间协作
- 端到端测试：测试完整业务流程

### 4. **监控和运维**
- 监控聚合性能指标
- 监控领域事件处理
- 支持聚合的故障恢复

## 七、设计文档清单

### 已完成的文档
- [x] `domain-relationships.md` - 领域关系图与聚合设计
- [x] `aggregate-detailed-relationships.md` - 聚合详细关系图
- [x] `aggregate-design-summary.md` - 聚合设计总结

### 待完成的文档
- [ ] 聚合实现代码模板
- [ ] 领域事件实现规范
- [ ] 聚合测试用例设计
- [ ] 聚合性能优化指南

## 八、设计决策记录

### 关键决策
1. **聚合边界划分**：基于业务完整性原则，识别5个核心聚合
2. **聚合间通信**：采用领域事件方式，避免直接引用
3. **一致性保证**：聚合内强一致性，聚合间最终一致性
4. **性能优化**：聚合大小适中，支持并发访问

### 设计权衡
- **聚合大小**：在业务完整性和性能之间平衡
- **一致性**：在强一致性和性能之间权衡
- **扩展性**：在简单性和灵活性之间平衡

### 风险控制
- **大聚合风险**：Stowage Plan聚合较大，需要监控性能
- **并发风险**：Container Management聚合并发访问频繁
- **扩展风险**：预留扩展点，支持业务变更 