# TOS聚合详细关系图

## 一、核心业务场景聚合关系

### 场景1：船舶到港流程

```mermaid
graph TD
    subgraph "船舶访问聚合"
        VV[Vessel Visit]
        V[Vessel]
        VC[Vessel Class]
        VS[Vessel Service]
        LO[Line Operator]
    end
    
    subgraph "积载计划聚合"
        SP[Stowage Plan]
        ISP[Inbound Stowage Plan]
        CP[Container Position]
        PB[Preplanned Bay]
        GC[Group Code]
    end
    
    subgraph "集装箱管理聚合"
        C[Container]
        S[Slot]
        YB[Yard Block]
        LB[Logical Block]
        AR[Allocation Range]
    end
    
    %% 业务流程关系
    VV -->|创建访问| SP
    SP -->|导入积载| ISP
    ISP -->|分配位置| CP
    CP -->|影响集装箱| C
    C -->|分配到堆场| YB
    YB -->|分配箱位| S
```

### 场景2：装卸作业流程

```mermaid
graph TD
    subgraph "工作指令聚合"
        WI[Work Instruction]
        DWI[Discharge WI]
        LWI[Load WI]
        PM[Planned Moves]
        CN[Container Note]
        BN[Bay Note]
    end
    
    subgraph "起重机计划聚合"
        CP[Crane Plan]
        CW[Crane Workshift]
        ST[Shift Template]
        WQ[Work Queue]
        SQ[Sequence WQs]
    end
    
    subgraph "集装箱管理聚合"
        C[Container]
        S[Slot]
        YB[Yard Block]
        LB[Logical Block]
    end
    
    %% 作业流程关系
    WI -->|生成指令| DWI
    DWI -->|创建计划| PM
    PM -->|调度起重机| CP
    CP -->|安排班次| CW
    CW -->|排序队列| WQ
    WQ -->|执行作业| C
    C -->|更新位置| S
```

### 场景3：船舶离港流程

```mermaid
graph TD
    subgraph "积载计划聚合"
        SP[Stowage Plan]
        OSP[Outbound Stowage Plan]
        CP[Container Position]
        PB[Preplanned Bay]
        SE[Stowage Error]
    end
    
    subgraph "工作指令聚合"
        WI[Work Instruction]
        LWI[Load WI]
        PM[Planned Moves]
    end
    
    subgraph "船舶访问聚合"
        VV[Vessel Visit]
        VD[Visit Details]
    end
    
    %% 离港流程关系
    SP -->|生成出港计划| OSP
    OSP -->|检查积载| SE
    SE -->|修正计划| OSP
    OSP -->|生成装货指令| LWI
    LWI -->|执行装货| PM
    PM -->|完成访问| VV
```

## 二、聚合内部实体关系

### Vessel Visit聚合内部关系

```mermaid
graph TD
    VV[Vessel Visit] --> V[Vessel]
    V --> VC[Vessel Class]
    V --> VS[Vessel Service]
    V --> LO[Line Operator]
    VV --> VD[Visit Details]
    
    %% 状态转换
    VV -->|计划中| VV_Planned
    VV -->|进行中| VV_InProgress
    VV -->|已完成| VV_Completed
```

### Stowage Plan聚合内部关系

```mermaid
graph TD
    SP[Stowage Plan] --> ISP[Inbound Stowage Plan]
    SP --> OSP[Outbound Stowage Plan]
    ISP --> CP[Container Position]
    OSP --> CP
    CP --> PB[Preplanned Bay]
    CP --> GC[Group Code]
    SP --> SE[Stowage Error]
    
    %% 积载计划状态
    SP -->|导入中| SP_Importing
    SP -->|已导入| SP_Imported
    SP -->|已修改| SP_Modified
    SP -->|已导出| SP_Exported
```

### Work Instruction聚合内部关系

```mermaid
graph TD
    WI[Work Instruction] --> DWI[Discharge WI]
    WI --> LWI[Load WI]
    DWI --> PM[Planned Moves]
    LWI --> PM
    PM --> CN[Container Note]
    PM --> BN[Bay Note]
    
    %% 工作指令状态
    WI -->|待签发| WI_Pending
    WI -->|已签发| WI_Issued
    WI -->|执行中| WI_Executing
    WI -->|已完成| WI_Completed
```

## 三、聚合间通信事件

### 领域事件流

```mermaid
graph LR
    subgraph "船舶访问聚合"
        VV[Vessel Visit]
    end
    
    subgraph "积载计划聚合"
        SP[Stowage Plan]
    end
    
    subgraph "工作指令聚合"
        WI[Work Instruction]
    end
    
    subgraph "起重机计划聚合"
        CP[Crane Plan]
    end
    
    subgraph "集装箱管理聚合"
        C[Container]
    end
    
    %% 事件流
    VV -->|VesselVisitCreated| SP
    SP -->|StowagePlanImported| WI
    WI -->|WorkInstructionIssued| CP
    WI -->|WorkInstructionStarted| C
    CP -->|CranePlanExecuted| C
    C -->|ContainerPositionUpdated| SP
    WI -->|WorkInstructionCompleted| VV
```

## 四、聚合边界验证

### 业务规则验证

| 聚合 | 业务规则 | 验证点 |
|------|----------|--------|
| **Vessel Visit** | 一次访问对应一个船舶 | 船舶ID唯一性检查 |
| **Stowage Plan** | 进港出港计划独立 | 计划类型隔离 |
| **Work Instruction** | 指令基于积载计划 | 计划依赖关系 |
| **Crane Plan** | 起重机能力约束 | 设备能力检查 |
| **Container Management** | 位置唯一性 | 位置冲突检测 |

### 一致性边界

```mermaid
graph TD
    subgraph "事务边界1"
        VV[Vessel Visit创建]
        SP[Stowage Plan导入]
    end
    
    subgraph "事务边界2"
        WI[Work Instruction签发]
        CP[Crane Plan创建]
    end
    
    subgraph "事务边界3"
        PM[Planned Moves执行]
        C[Container位置更新]
    end
    
    VV --> SP
    WI --> CP
    PM --> C
```

## 五、聚合设计优化建议

### 1. **聚合大小优化**
- Vessel Visit聚合：适中，包含必要船舶信息
- Stowage Plan聚合：较大，可考虑按进港/出港拆分
- Work Instruction聚合：适中，指令执行边界清晰
- Crane Plan聚合：较小，设备调度边界明确
- Container Management聚合：较大，可考虑按区域拆分

### 2. **性能优化策略**
- 使用事件溯源处理复杂状态变化
- 聚合间通过事件异步通信
- 支持聚合的并发访问控制
- 考虑聚合的读写分离

### 3. **扩展性设计**
- 预留业务规则扩展点
- 支持新的作业策略接入
- 通过领域事件支持功能扩展
- 聚合设计支持业务变更 