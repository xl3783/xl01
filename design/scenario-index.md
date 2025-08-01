# TOS业务场景索引

## 一、场景分类索引

### 🚢 船舶管理场景
- **船舶到港流程** - 船舶到达港口，开始装卸作业准备
- **船舶离港流程** - 完成装卸作业，船舶准备离港
- **船舶访问管理** - 船舶信息管理和访问状态管理

### 📦 积载计划场景
- **积载计划管理** - 管理船舶货物分布计划
- **进港积载处理** - 处理船舶进港时的货物分布
- **出港积载处理** - 处理船舶出港时的货物分布

### 🏗️ 装卸作业场景
- **卸货作业流程** - 执行船舶卸货作业
- **装货作业流程** - 执行船舶装货作业
- **作业指令管理** - 管理装卸作业指令

### 🏗️ 起重机调度场景
- **起重机调度管理** - 管理起重机作业调度
- **班次管理** - 管理起重机班次安排
- **作业队列优化** - 优化作业队列排序

### 📦 集装箱管理场景
- **集装箱位置管理** - 管理集装箱位置分配
- **堆场分配** - 管理集装箱堆场分配
- **集装箱状态跟踪** - 跟踪集装箱状态变化

## 二、场景详细索引

### 核心业务流程

| 场景名称 | 文档位置 | 主要聚合 | 关键事件 |
|----------|----------|----------|----------|
| 船舶到港流程 | business-scenarios.md#场景1 | Vessel Visit, Stowage Plan, Container Management | VesselVisitCreated, StowagePlanImported |
| 卸货作业流程 | business-scenarios.md#场景2 | Work Instruction, Crane Plan, Container Management | WorkInstructionIssued, CranePlanCreated |
| 装货作业流程 | business-scenarios.md#场景3 | Work Instruction, Stowage Plan, Container Management | LoadWorkInstructionIssued, LoadCompleted |
| 船舶离港流程 | business-scenarios.md#场景4 | Vessel Visit, Stowage Plan, Container Management | StowagePlanExported, VesselVisitCompleted |
| 积载计划管理 | business-scenarios.md#场景5 | Stowage Plan, Container Management | StowagePlanImported, StowagePlanModified |
| 起重机调度管理 | business-scenarios.md#场景6 | Crane Plan, Work Instruction | CranePlanCreated, WorkshiftScheduled |

### 子流程场景

| 场景名称 | 父场景 | 主要步骤 | 涉及实体 |
|----------|--------|----------|----------|
| 船舶信息确认 | 船舶到港流程 | 检查船舶类别、确认船务公司、验证船公司 | Vessel, Vessel Class, Vessel Service, Line Operator |
| 积载计划导入 | 船舶到港流程 | 接收EDI数据、验证计划、处理错误 | Stowage Plan, Inbound Stowage Plan |
| 卸货预计划制定 | 卸货作业流程 | 创建预计划、确定顺序、分配资源 | Preplan, Planned Moves |
| 工作指令签发 | 装卸作业流程 | 生成指令、选择方式、分发任务 | Work Instruction, Discharge WI, Load WI |
| 起重机计划制定 | 起重机调度管理 | 创建计划、设置模板、分配资源 | Crane Plan, Crane Workshift, Shift Template |
| 集装箱位置分配 | 集装箱管理场景 | 分配位置、确定策略、生成方案 | Container, Slot, Yard Block |

## 三、场景关系索引

### 时序关系
```
船舶到港流程 → 卸货作业流程 → 装货作业流程 → 船舶离港流程
     ↓              ↓              ↓              ↓
积载计划管理 → 起重机调度管理 → 集装箱管理场景
```

### 聚合关系
```
Vessel Visit聚合 ←→ Stowage Plan聚合 ←→ Container Management聚合
       ↓                    ↓                    ↓
Work Instruction聚合 ←→ Crane Plan聚合 ←→ Container Management聚合
```

### 事件关系
```
VesselVisitCreated → StowagePlanImported → WorkInstructionIssued
       ↓                    ↓                    ↓
CranePlanCreated → WorkInstructionCompleted → VesselVisitCompleted
```

## 四、场景实施索引

### 第一阶段实施
1. **船舶到港流程** - 核心业务流程，优先级最高
2. **船舶离港流程** - 核心业务流程，优先级最高
3. **积载计划管理** - 基础功能，优先级高

### 第二阶段实施
1. **卸货作业流程** - 作业执行，优先级中
2. **装货作业流程** - 作业执行，优先级中
3. **起重机调度管理** - 设备调度，优先级中

### 第三阶段实施
1. **集装箱管理场景** - 管理功能，优先级低
2. **作业优化** - 优化功能，优先级低
3. **扩展功能** - 扩展功能，优先级低

## 五、场景文档索引

### 设计文档
- `vessel.md` - 船舶业务核心设计
- `entitys.md` - 实体清单
- `domain-relationships.md` - 领域关系图与聚合设计
- `aggregate-detailed-relationships.md` - 聚合详细关系图
- `aggregate-design-summary.md` - 聚合设计总结
- `business-scenarios.md` - 业务场景梳理
- `scenario-index.md` - 业务场景索引（本文档）

### 文档关系
```
vessel.md + entitys.md → domain-relationships.md → aggregate-detailed-relationships.md → aggregate-design-summary.md
                                    ↓
                            business-scenarios.md → scenario-index.md
```

## 六、快速查找指南

### 按业务流程查找
- **船舶管理** → 查看船舶到港流程、船舶离港流程
- **装卸作业** → 查看卸货作业流程、装货作业流程
- **设备调度** → 查看起重机调度管理
- **货物管理** → 查看积载计划管理、集装箱管理场景

### 按聚合查找
- **Vessel Visit聚合** → 查看船舶到港流程、船舶离港流程
- **Stowage Plan聚合** → 查看积载计划管理
- **Work Instruction聚合** → 查看卸货作业流程、装货作业流程
- **Crane Plan聚合** → 查看起重机调度管理
- **Container Management聚合** → 查看集装箱管理场景

### 按实施阶段查找
- **第一阶段** → 船舶到港流程、船舶离港流程、积载计划管理
- **第二阶段** → 卸货作业流程、装货作业流程、起重机调度管理
- **第三阶段** → 集装箱管理场景、作业优化、扩展功能 