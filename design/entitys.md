# TOS聚合实体详细属性设计文档

## 一、Vessel Visit（船舶访问）聚合

### 1.1 Vessel Visit（聚合根）
**属性：**
- `id`: String - 船舶访问唯一标识
- `vesselId`: String - 船舶ID引用
- `visitDetails`: Object - 访问详情
  - `arrivalTime`: Date - 预计到港时间
  - `departureTime`: Date - 预计离港时间
  - `berthId`: String - 泊位ID
  - `terminalId`: String - 码头ID
  - `visitNumber`: String - 访问编号
  - `visitType`: String - 访问类型（REGULAR/EMERGENCY）
- `status`: String - 访问状态（PLANNED/IN_PROGRESS/COMPLETED）
- `createdAt`: Date - 创建时间
- `updatedAt`: Date - 更新时间
- `version`: Number - 版本号

### 1.2 Vessel（船舶实体）
**属性：**
- `id`: String - 船舶唯一标识
- `name`: String - 船舶名称
- `imo`: String - IMO编号
- `vesselClass`: VesselClass - 船舶类别
- `vesselService`: VesselService - 船务公司
- `lineOperator`: LineOperator - 船公司
- `dimensions`: Object - 船舶尺寸
  - `length`: Number - 船长
  - `width`: Number - 船宽
  - `draft`: Number - 吃水深度
- `capacity`: Object - 船舶容量
  - `teuCapacity`: Number - TEU容量
  - `maxWeight`: Number - 最大载重
- `hullStructure`: HullStructure - 船体结构
- `bayConfiguration`: BayConfiguration - 贝位配置
- `cellGuideSystem`: CellGuideSystem - 导槽系统
- `weightLimitations`: WeightLimitations - 重量限制

### 1.3 Vessel Class（船舶类别值对象）
**属性：**
- `code`: String - 类别代码
- `name`: String - 类别名称
- `description`: String - 类别描述
- `category`: String - 船舶分类（CONTAINER/BULK/RO-RO）

### 1.4 Vessel Service（船务公司值对象）
**属性：**
- `id`: String - 公司ID
- `name`: String - 公司名称
- `code`: String - 公司代码
- `contactInfo`: Object - 联系信息
  - `phone`: String - 电话
  - `email`: String - 邮箱
  - `address`: String - 地址

### 1.5 Line Operator（船公司值对象）
**属性：**
- `id`: String - 公司ID
- `name`: String - 公司名称
- `code`: String - 公司代码
- `alliance`: String - 联盟信息
- `serviceArea`: Array - 服务区域

### 1.6 Hull Structure（船体结构值对象）
**属性：**
- `id`: String - 船体结构ID
- `hullType`: String - 船体类型（SINGLE_HULL/DOUBLE_HULL）
- `deckConfiguration`: Array - 甲板配置
  - `deckNumber`: Number - 甲板编号
  - `deckType`: String - 甲板类型（MAIN_DECK/LOWER_DECK/HATCH_COVER）
  - `maxHeight`: Number - 最大高度
  - `maxWeight`: Number - 最大载重
  - `isReeferCapable`: Boolean - 是否支持冷藏箱
- `hatchConfiguration`: Array - 舱口配置
  - `hatchNumber`: Number - 舱口编号
  - `hatchDimensions`: Object - 舱口尺寸
    - `length`: Number - 长度
    - `width`: Number - 宽度
  - `maxLiftingWeight`: Number - 最大起吊重量
  - `operationalStatus`: String - 操作状态（OPERATIONAL/MAINTENANCE/OUT_OF_SERVICE）

### 1.7 Bay Configuration（贝位配置值对象）
**属性：**
- `id`: String - 贝位配置ID
- `bayDefinitions`: Array - 贝位定义
  - `bayNumber`: Number - 贝位号
  - `bayType`: String - 贝位类型（CELL_GUIDE/CELL_LESS）
  - `bayDimensions`: Object - 贝位尺寸
    - `length`: Number - 长度
    - `width`: Number - 宽度
    - `height`: Number - 高度
  - `rowConfiguration`: Array - 行配置
    - `rowNumber`: Number - 行号
    - `rowType`: String - 行类型（TWENTY_FOOT/FORTY_FOOT/COMBINED）
    - `maxTiers`: Number - 最大层数
    - `maxWeight`: Number - 最大重量
  - `tierConfiguration`: Array - 层配置
    - `tierNumber`: Number - 层号
    - `tierType`: String - 层类型（ON_DECK/BELOW_DECK）
    - `maxWeight`: Number - 最大重量
    - `isReeferCapable`: Boolean - 是否支持冷藏箱
  - `slotConfiguration`: Array - 槽位配置
    - `slotNumber`: Number - 槽位号
    - `slotType`: String - 槽位类型（TWENTY_FOOT/FORTY_FOOT/COMBINED）
    - `maxWeight`: Number - 最大重量
    - `specialRequirements`: Array - 特殊要求

### 1.8 Cell Guide System（导槽系统值对象）
**属性：**
- `id`: String - 导槽系统ID
- `cellGuideType`: String - 导槽类型（FIXED/ADJUSTABLE/REMOVABLE）
- `cellGuideConfiguration`: Array - 导槽配置
  - `bayNumber`: Number - 贝位号
  - `rowNumber`: Number - 行号
  - `guideType`: String - 导槽类型（TWENTY_FOOT/FORTY_FOOT/COMBINED）
  - `guideStatus`: String - 导槽状态（OPERATIONAL/DAMAGED/MAINTENANCE）
  - `adjustmentRange`: Object - 调整范围
    - `minWidth`: Number - 最小宽度
    - `maxWidth`: Number - 最大宽度
- `cellGuideMaintenance`: Array - 导槽维护记录
  - `maintenanceDate`: Date - 维护日期
  - `maintenanceType`: String - 维护类型
  - `maintenanceStatus`: String - 维护状态

### 1.9 Weight Limitations（重量限制值对象）
**属性：**
- `id`: String - 重量限制ID
- `overallWeightLimits`: Object - 总体重量限制
  - `maxGrossWeight`: Number - 最大总重量
  - `maxNetWeight`: Number - 最大净重量
  - `maxTareWeight`: Number - 最大皮重
- `bayWeightLimits`: Array - 贝位重量限制
  - `bayNumber`: Number - 贝位号
  - `maxWeight`: Number - 最大重量
  - `weightDistribution`: Object - 重量分布
    - `foreWeight`: Number - 前部重量
    - `aftWeight`: Number - 后部重量
    - `portWeight`: Number - 左舷重量
    - `starboardWeight`: Number - 右舷重量
- `tierWeightLimits`: Array - 层重量限制
  - `tierNumber`: Number - 层号
  - `maxWeight`: Number - 最大重量
  - `stackingLimits`: Object - 堆叠限制
    - `maxStackHeight`: Number - 最大堆高
    - `maxStackWeight`: Number - 最大堆重
- `dynamicWeightLimits`: Object - 动态重量限制
  - `maxBendingMoment`: Number - 最大弯矩
  - `maxShearForce`: Number - 最大剪力
  - `maxTorsionMoment`: Number - 最大扭矩

## 二、Stowage Plan（积载计划）聚合

### 2.1 Stowage Plan（聚合根）
**属性：**
- `id`: String - 积载计划唯一标识
- `vesselVisitId`: String - 船舶访问ID引用
- `planType`: String - 计划类型（INBOUND/OUTBOUND）
- `containerPositions`: Map - 集装箱位置映射
- `groupCodes`: Map - 箱分组映射
- `stowageErrors`: Array - 积载错误列表
- `status`: String - 计划状态（DRAFT/IMPORTED/MODIFIED/EXPORTED）
- `createdAt`: Date - 创建时间
- `updatedAt`: Date - 更新时间
- `version`: Number - 版本号

### 2.2 Inbound Stowage Plan（进港积载计划）
**属性：**
- `id`: String - 进港计划ID
- `stowagePlanId`: String - 积载计划ID引用
- `dischargePositions`: Array - 卸货位置列表
- `containerGroups`: Array - 集装箱分组
- `priorityLevels`: Map - 优先级映射
- `specialHandling`: Array - 特殊处理要求

### 2.3 Outbound Stowage Plan（出港积载计划）
**属性：**
- `id`: String - 出港计划ID
- `stowagePlanId`: String - 积载计划ID引用
- `loadPositions`: Array - 装货位置列表
- `containerGroups`: Array - 集装箱分组
- `stowageRules`: Array - 积载规则
- `weightDistribution`: Object - 重量分布

### 2.4 Container Position（集装箱位置值对象）
**属性：**
- `containerId`: String - 集装箱ID
- `bay`: Number - 贝位号
- `row`: Number - 行号
- `tier`: Number - 层号
- `slot`: Number - 槽位号
- `positionType`: String - 位置类型（ON_DECK/BELOW_DECK）
- `weight`: Number - 重量
- `temperature`: Number - 温度要求
- `positionConstraints`: PositionConstraints - 位置约束
- `stabilityFactors`: StabilityFactors - 稳定性因素
- `accessibilityInfo`: AccessibilityInfo - 可访问性信息

### 2.5 Preplanned Bay（预计划贝位值对象）
**属性：**
- `bayNumber`: Number - 贝位号
- `bayType`: String - 贝位类型
- `capacity`: Number - 容量
- `utilization`: Number - 利用率
- `constraints`: Array - 约束条件

### 2.6 Group Code（箱分组值对象）
**属性：**
- `code`: String - 分组代码
- `description`: String - 分组描述
- `containerCount`: Number - 集装箱数量
- `priority`: Number - 优先级
- `specialRequirements`: Array - 特殊要求

### 2.7 Stowage Error（积载错误值对象）
**属性：**
- `id`: String - 错误ID
- `errorType`: String - 错误类型
- `errorMessage`: String - 错误消息
- `severity`: String - 严重程度（LOW/MEDIUM/HIGH/CRITICAL）
- `affectedContainers`: Array - 受影响的集装箱
- `timestamp`: Date - 错误时间

### 2.8 Position Constraints（位置约束值对象）
**属性：**
- `id`: String - 约束ID
- `bayConstraints`: Object - 贝位约束
  - `maxWeight`: Number - 最大重量
  - `maxHeight`: Number - 最大高度
  - `restrictedContainers`: Array - 限制集装箱类型
- `rowConstraints`: Object - 行约束
  - `rowType`: String - 行类型（TWENTY_FOOT/FORTY_FOOT/COMBINED）
  - `maxTiers`: Number - 最大层数
  - `weightDistribution`: Object - 重量分布要求
- `tierConstraints`: Object - 层约束
  - `maxWeight`: Number - 最大重量
  - `stackingLimits`: Object - 堆叠限制
  - `reeferCapability`: Boolean - 冷藏箱能力
- `slotConstraints`: Object - 槽位约束
  - `slotType`: String - 槽位类型
  - `specialRequirements`: Array - 特殊要求
  - `accessibilityLimitations`: Array - 可访问性限制

### 2.9 Stability Factors（稳定性因素值对象）
**属性：**
- `id`: String - 稳定性因素ID
- `longitudinalStability`: Object - 纵向稳定性
  - `foreAftBalance`: Number - 前后平衡
  - `trimLimits`: Object - 纵倾限制
    - `maxTrim`: Number - 最大纵倾
    - `optimalTrim`: Number - 最佳纵倾
- `transverseStability`: Object - 横向稳定性
  - `portStarboardBalance`: Number - 左右平衡
  - `listLimits`: Object - 横倾限制
    - `maxList`: Number - 最大横倾
    - `optimalList`: Number - 最佳横倾
- `verticalStability`: Object - 垂直稳定性
  - `metacentricHeight`: Number - 稳心高度
  - `freeSurfaceEffect`: Number - 自由液面效应
- `dynamicStability`: Object - 动态稳定性
  - `rollPeriod`: Number - 横摇周期
  - `pitchPeriod`: Number - 纵摇周期

### 2.10 Accessibility Info（可访问性信息值对象）
**属性：**
- `id`: String - 可访问性信息ID
- `craneAccessibility`: Object - 起重机可访问性
  - `craneReach`: Boolean - 起重机可达
  - `craneType`: String - 起重机类型
  - `liftingCapacity`: Number - 起吊能力
- `equipmentAccessibility`: Object - 设备可访问性
  - `reachStackerAccess`: Boolean - 正面吊可达
  - `forkliftAccess`: Boolean - 叉车可达
  - `tractorAccess`: Boolean - 拖车可达
- `operationalAccessibility`: Object - 操作可访问性
  - `loadingSequence`: Array - 装货序列
  - `dischargeSequence`: Array - 卸货序列
  - `rehandlingSequence`: Array - 翻箱序列
- `safetyAccessibility`: Object - 安全可访问性
  - `emergencyAccess`: Boolean - 紧急通道
  - `fireFightingAccess`: Boolean - 消防通道
  - `ventilationAccess`: Boolean - 通风通道

## 三、Work Instruction（工作指令）聚合

### 3.1 Work Instruction（聚合根）
**属性：**
- `id`: String - 工作指令唯一标识
- `vesselVisitId`: String - 船舶访问ID引用
- `instructionType`: String - 指令类型（DISCHARGE/LOAD）
- `plannedMoves`: Array - 计划作业列表
- `status`: String - 指令状态（PENDING/ISSUED/EXECUTING/COMPLETED）
- `issueMethod`: String - 签发方式（EC/PAPER）
- `createdAt`: Date - 创建时间
- `updatedAt`: Date - 更新时间
- `version`: Number - 版本号

### 3.2 Discharge WI（卸货指令）
**属性：**
- `id`: String - 卸货指令ID
- `workInstructionId`: String - 工作指令ID引用
- `dischargePositions`: Array - 卸货位置
- `prioritySequence`: Array - 优先级序列
- `equipmentRequirements`: Array - 设备要求
- `estimatedDuration`: Number - 预计持续时间

### 3.3 Load WI（装货指令）
**属性：**
- `id`: String - 装货指令ID
- `workInstructionId`: String - 工作指令ID引用
- `loadPositions`: Array - 装货位置
- `stowageSequence`: Array - 积载序列
- `equipmentRequirements`: Array - 设备要求
- `estimatedDuration`: Number - 预计持续时间

### 3.4 Planned Move（计划作业值对象）
**属性：**
- `id`: String - 作业ID
- `containerId`: String - 集装箱ID
- `fromPosition`: Object - 起始位置
- `toPosition`: Object - 目标位置
- `moveType`: String - 作业类型（DISCHARGE/LOAD/REHANDLE）
- `priority`: Number - 优先级
- `estimatedTime`: Number - 预计时间
- `equipmentId`: String - 设备ID

### 3.5 Container Note（集装箱备注值对象）
**属性：**
- `containerId`: String - 集装箱ID
- `noteType`: String - 备注类型
- `noteText`: String - 备注内容
- `priority`: Number - 优先级
- `timestamp`: Date - 备注时间

### 3.6 Bay Note（贝位备注值对象）
**属性：**
- `bayNumber`: Number - 贝位号
- `noteType`: String - 备注类型
- `noteText`: String - 备注内容
- `priority`: Number - 优先级
- `timestamp`: Date - 备注时间

## 四、Crane Plan（起重机计划）聚合

### 4.1 Crane Plan（聚合根）
**属性：**
- `id`: String - 起重机计划唯一标识
- `vesselVisitId`: String - 船舶访问ID引用
- `workInstructionId`: String - 工作指令ID引用
- `craneWorkshifts`: Array - 起重机班次列表
- `workQueues`: Array - 作业队列列表
- `status`: String - 计划状态（DRAFT/OPTIMIZED/EXECUTING/COMPLETED）
- `createdAt`: Date - 创建时间
- `updatedAt`: Date - 更新时间
- `version`: Number - 版本号

### 4.2 Crane Workshift（起重机班次值对象）
**属性：**
- `id`: String - 班次ID
- `craneId`: String - 起重机ID
- `startTime`: Date - 开始时间¬
- `endTime`: Date - 结束时间
- `operatorId`: String - 操作员ID
- `shiftType`: String - 班次类型（DAY/NIGHT/OVERTIME）
- `workload`: Number - 工作量
- `efficiency`: Number - 效率指标

### 4.3 Shift Template（班次模板值对象）
**属性：**
- `id`: String - 模板ID
- `templateName`: String - 模板名称
- `shiftPattern`: Array - 班次模式
- `breakTimes`: Array - 休息时间
- `workloadDistribution`: Object - 工作量分布

### 4.4 Work Queue（作业队列值对象）
**属性：**
- `id`: String - 队列ID
- `queueType`: String - 队列类型（DISCHARGE/LOAD/REHANDLE）
- `priority`: Number - 优先级
- `plannedMoves`: Array - 计划作业列表
- `estimatedDuration`: Number - 预计持续时间
- `status`: String - 队列状态（PENDING/EXECUTING/COMPLETED）

### 4.5 Sequence WQs（队列排序值对象）
**属性：**
- `id`: String - 排序ID
- `sequenceNumber`: Number - 序列号
- `workQueueId`: String - 作业队列ID
- `dependencyQueueId`: String - 依赖队列ID
- `optimizationCriteria`: Array - 优化标准

## 五、Container Management（集装箱管理）聚合

### 5.1 Container（聚合根）
**属性：**
- `id`: String - 集装箱唯一标识
- `containerNumber`: String - 集装箱号
- `containerType`: String - 集装箱类型（DRY/REEFER/OPEN_TOP/FLAT_RACK）
- `size`: String - 集装箱尺寸（20FT/40FT/45FT）
- `status`: String - 集装箱状态（AVAILABLE/IN_USE/MAINTENANCE/OUT_OF_SERVICE）
- `currentLocation`: ContainerLocation - 当前位置
- `weight`: Number - 重量
- `contents`: Object - 货物信息
- `createdAt`: Date - 创建时间
- `updatedAt`: Date - 更新时间
- `version`: Number - 版本号

### 5.2 Slot（箱位值对象）
**属性：**
- `id`: String - 箱位ID
- `slotNumber`: String - 箱位编号
- `slotType`: String - 箱位类型（GROUND/STACK）
- `capacity`: Number - 容量
- `currentUtilization`: Number - 当前利用率
- `constraints`: Array - 约束条件
- `status`: String - 箱位状态（AVAILABLE/OCCUPIED/MAINTENANCE）

### 5.3 Yard Block（堆场区块值对象）
**属性：**
- `id`: String - 区块ID
- `blockName`: String - 区块名称
- `blockType`: String - 区块类型（IMPORT/EXPORT/EMPTY/REEFER）
- `dimensions`: Object - 区块尺寸
  - `rows`: Number - 行数
  - `columns`: Number - 列数
  - `tiers`: Number - 层数
- `capacity`: Number - 总容量
- `utilization`: Number - 利用率
- `operationalStatus`: String - 运营状态

### 5.4 Logical Block（逻辑区块值对象）
**属性：**
- `id`: String - 逻辑区块ID
- `logicalName`: String - 逻辑名称
- `physicalBlocks`: Array - 物理区块列表
- `allocationStrategy`: String - 分配策略
- `priorityLevel`: Number - 优先级
- `specialRequirements`: Array - 特殊要求

### 5.5 Allocation Range（分配范围值对象）
**属性：**
- `id`: String - 分配范围ID
- `startSlot`: String - 起始箱位
- `endSlot`: String - 结束箱位
- `allocationType`: String - 分配类型（AUTO/MANUAL）
- `reservedFor`: String - 预留用途
- `validityPeriod`: Object - 有效期
  - `startDate`: Date - 开始日期
  - `endDate`: Date - 结束日期

### 5.6 Container Location（集装箱位置值对象）
**属性：**
- `slot`: Slot - 箱位信息
- `yardBlock`: YardBlock - 堆场区块
- `logicalBlock`: LogicalBlock - 逻辑区块
- `allocationRange`: AllocationRange - 分配范围
- `positionTimestamp`: Date - 位置时间戳
- `locationType`: String - 位置类型（TEMPORARY/PERMANENT）

## 六、通用属性规范

### 6.1 状态枚举定义
- **访问状态**: PLANNED, IN_PROGRESS, COMPLETED
- **计划状态**: DRAFT, IMPORTED, MODIFIED, EXPORTED
- **指令状态**: PENDING, ISSUED, EXECUTING, COMPLETED
- **集装箱状态**: AVAILABLE, IN_USE, MAINTENANCE, OUT_OF_SERVICE
- **箱位状态**: AVAILABLE, OCCUPIED, MAINTENANCE
- **船体类型**: SINGLE_HULL, DOUBLE_HULL
- **甲板类型**: MAIN_DECK, LOWER_DECK, HATCH_COVER
- **贝位类型**: CELL_GUIDE, CELL_LESS
- **导槽类型**: FIXED, ADJUSTABLE, REMOVABLE
- **导槽状态**: OPERATIONAL, DAMAGED, MAINTENANCE
- **舱口状态**: OPERATIONAL, MAINTENANCE, OUT_OF_SERVICE

### 6.2 业务规则约束
- 所有聚合根必须包含版本号用于并发控制
- 所有时间戳使用ISO 8601格式
- 所有ID必须全局唯一
- 值对象必须不可变
- 聚合内部状态变化必须通过聚合根方法进行
- 船体结构配置必须与船舶类别匹配
- 贝位配置必须与船体结构一致
- 导槽系统必须与贝位配置协调
- 重量限制必须考虑船舶结构强度
- 积载计划必须验证位置约束和稳定性要求

### 6.3 数据验证规则
- 集装箱号必须符合ISO 6346标准
- IMO号必须为7位数字
- 重量必须为正数且不超过设备限制
- 时间范围必须合理（开始时间早于结束时间）
- 位置坐标必须在有效范围内
- 船体结构尺寸必须与船舶总尺寸一致
- 贝位配置必须覆盖整个船舶长度
- 导槽配置必须与贝位行配置匹配
- 重量分布必须满足船舶稳定性要求
- 积载位置必须验证可访问性和安全性

这个属性设计文档涵盖了TOS系统中所有5个核心聚合的实体属性，遵循领域驱动设计原则，确保业务完整性和技术实现的平衡。