/**
 * TOS港口操作系统 - 集装箱作业上下文设计
 * 实现集装箱作业上下文的DDD战术设计
 */

// ==================== 值对象设计 ====================

/**
 * 集装箱编号值对象
 */
class ContainerNumber {
    constructor(value) {
        if (!value || typeof value !== 'string' || value.length !== 11) {
            throw new Error('集装箱编号必须是11位字符串');
        }
        this.value = value.toUpperCase();
    }

    toString() {
        return this.value;
    }

    equals(other) {
        return other instanceof ContainerNumber && this.value === other.value;
    }
}

/**
 * 集装箱尺寸值对象
 */
class ContainerSize {
    constructor(length, width, height) {
        if (length <= 0 || width <= 0 || height <= 0) {
            throw new Error('集装箱尺寸必须大于0');
        }
        this.length = length;
        this.width = width;
        this.height = height;
    }

    getVolume() {
        return this.length * this.width * this.height;
    }

    toString() {
        return `${this.length}×${this.width}×${this.height}`;
    }

    equals(other) {
        return other instanceof ContainerSize &&
            this.length === other.length &&
            this.width === other.width &&
            this.height === other.height;
    }
}

/**
 * 集装箱类型枚举
 */
class ContainerType {
    static GENERAL = 'GENERAL';
    static REFRIGERATED = 'REFRIGERATED';
    static DANGEROUS = 'DANGEROUS';
    static OVERWEIGHT = 'OVERWEIGHT';
    static EMPTY = 'EMPTY';

    constructor(type) {
        if (!Object.values(ContainerType).includes(type)) {
            throw new Error('无效的集装箱类型');
        }
        this.type = type;
    }

    toString() {
        return this.type;
    }

    equals(other) {
        return other instanceof ContainerType && this.type === other.type;
    }
}

/**
 * 重量值对象
 */
class Weight {
    constructor(value, unit = 'TON') {
        if (value < 0) {
            throw new Error('重量不能为负数');
        }
        this.value = value;
        this.unit = unit;
    }

    toString() {
        return `${this.value} ${this.unit}`;
    }

    equals(other) {
        return other instanceof Weight && 
            this.value === other.value && 
            this.unit === other.unit;
    }
}

/**
 * 集装箱状态枚举
 */
class ContainerStatus {
    static IN_TRANSIT = 'IN_TRANSIT';
    static AT_BERTH = 'AT_BERTH';
    static BEING_LOADED = 'BEING_LOADED';
    static BEING_UNLOADED = 'BEING_UNLOADED';
    static IN_YARD = 'IN_YARD';
    static READY_FOR_DEPARTURE = 'READY_FOR_DEPARTURE';
    static DEPARTED = 'DEPARTED';

    constructor(status) {
        if (!Object.values(ContainerStatus).includes(status)) {
            throw new Error('无效的集装箱状态');
        }
        this.status = status;
    }

    toString() {
        return this.status;
    }

    equals(other) {
        return other instanceof ContainerStatus && this.status === other.status;
    }
}

/**
 * 位置值对象
 */
class Location {
    constructor(area, bay, row, tier) {
        this.area = area;
        this.bay = bay;
        this.row = row;
        this.tier = tier;
    }

    toString() {
        return `${this.area}-${this.bay}-${this.row}-${this.tier}`;
    }

    equals(other) {
        return other instanceof Location &&
            this.area === other.area &&
            this.bay === other.bay &&
            this.row === other.row &&
            this.tier === other.tier;
    }
}

/**
 * 作业区域值对象
 */
class OperationArea {
    constructor(areaId, areaType, capacity, constraints = []) {
        if (!areaId || !areaType || !capacity) {
            throw new Error('作业区域参数无效');
        }
        this.areaId = areaId;
        this.areaType = areaType;
        this.capacity = capacity;
        this.constraints = constraints;
    }

    canAccommodate(container) {
        return this.validateConstraints(container) && this.hasAvailableCapacity(container);
    }

    validateConstraints(container) {
        return this.constraints.every(constraint => constraint.isSatisfied(container));
    }

    hasAvailableCapacity(container) {
        return this.capacity >= container.weight.value;
    }

    toString() {
        return `${this.areaId} (${this.areaType})`;
    }
}

/**
 * 作业类型值对象
 */
class OperationType {
    constructor(loadingType, operationMode, complexity, risk) {
        this.loadingType = loadingType;
        this.operationMode = operationMode;
        this.complexity = complexity;
        this.risk = risk;
    }

    requiresSpecialHandling() {
        return this.complexity === 'HIGH' || this.risk === 'HIGH';
    }

    isCompatibleWith(equipmentType) {
        return equipmentType.canHandle(this);
    }

    toString() {
        return `${this.loadingType}-${this.operationMode}`;
    }
}

/**
 * 设备类型值对象
 */
class EquipmentType {
    constructor(category, capability, limitation, cost) {
        this.category = category;
        this.capability = capability;
        this.limitation = limitation;
        this.cost = cost;
    }

    canHandle(container) {
        return this.validateContainerCompatibility(container);
    }

    validateContainerCompatibility(container) {
        return this.capability.maxWeight >= container.weight.value &&
               this.capability.maxSize >= container.size.getVolume();
    }

    calculateEfficiency(operation) {
        // 简化的效率计算
        return this.capability.efficiency * (1 - operation.complexity.impact);
    }

    toString() {
        return `${this.category} (${this.capability.maxWeight}吨)`;
    }
}

/**
 * 优先级值对象
 */
class Priority {
    static HIGH = 1;
    static MEDIUM = 2;
    static LOW = 3;

    constructor(level) {
        if (![Priority.HIGH, Priority.MEDIUM, Priority.LOW].includes(level)) {
            throw new Error('无效的优先级');
        }
        this.level = level;
    }

    isHigherThan(other) {
        return this.level < other.level;
    }

    toString() {
        const names = { [Priority.HIGH]: '高', [Priority.MEDIUM]: '中', [Priority.LOW]: '低' };
        return names[this.level];
    }
}

/**
 * 进度值对象
 */
class Progress {
    constructor(percentage, completedSteps, totalSteps) {
        if (percentage < 0 || percentage > 100) {
            throw new Error('进度百分比必须在0-100之间');
        }
        this.percentage = percentage;
        this.completedSteps = completedSteps;
        this.totalSteps = totalSteps;
    }

    update(completedSteps, totalSteps) {
        const newPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
        return new Progress(newPercentage, completedSteps, totalSteps);
    }

    toString() {
        return `${this.percentage.toFixed(1)}% (${this.completedSteps}/${this.totalSteps})`;
    }
}

// ==================== 实体设计 ====================

/**
 * 集装箱实体
 */
class Container {
    constructor(id, containerNumber, size, type, weight, cargoInfo = null) {
        this.id = id;
        this.containerNumber = containerNumber;
        this.size = size;
        this.type = type;
        this.weight = weight;
        this.cargoInfo = cargoInfo;
        this.status = new ContainerStatus(ContainerStatus.IN_TRANSIT);
        this.location = null;
        this.operationHistory = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    assignToOperation(operationPlan) {
        this.status = new ContainerStatus(ContainerStatus.AT_BERTH);
        this.updatedAt = new Date();
    }

    updateStatus(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }

    updateLocation(newLocation) {
        this.location = newLocation;
        this.updatedAt = new Date();
    }

    recordOperation(operation) {
        this.operationHistory.push({
            ...operation,
            timestamp: new Date()
        });
    }

    validateOperation(operationType) {
        return this.type.type === operationType.loadingType &&
               this.weight.value <= operationType.equipmentType.capability.maxWeight;
    }

    toString() {
        return `Container(${this.containerNumber.toString()})`;
    }
}

/**
 * 作业步骤实体
 */
class OperationStep {
    constructor(id, stepOrder, stepType, estimatedDuration) {
        this.id = id;
        this.stepOrder = stepOrder;
        this.stepType = stepType;
        this.dependency = [];
        this.status = 'PENDING';
        this.estimatedDuration = estimatedDuration;
        this.actualDuration = null;
        this.resources = [];
        this.constraints = [];
        this.startTime = null;
        this.endTime = null;
    }

    addDependency(dependency) {
        this.dependency.push(dependency);
    }

    assignResource(resource) {
        this.resources.push(resource);
    }

    start() {
        this.status = 'IN_PROGRESS';
        this.startTime = new Date();
    }

    complete() {
        this.status = 'COMPLETED';
        this.endTime = new Date();
        this.actualDuration = (this.endTime - this.startTime) / (1000 * 60); // 分钟
    }

    isReady() {
        return this.dependency.every(dep => dep.status === 'COMPLETED');
    }

    toString() {
        return `Step(${this.stepOrder}: ${this.stepType})`;
    }
}

/**
 * 操作员实体
 */
class Operator {
    constructor(id, name, qualification = []) {
        this.id = id;
        this.name = name;
        this.qualification = qualification;
        this.currentStatus = 'AVAILABLE';
        this.assignedEquipment = [];
        this.workSchedule = null;
        this.performanceMetrics = {
            efficiency: 1.0,
            safetyRecord: 0,
            completedTasks: 0
        };
    }

    assignEquipment(equipment) {
        this.assignedEquipment.push(equipment);
    }

    updateStatus(status) {
        this.currentStatus = status;
    }

    updatePerformance(metrics) {
        this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    }

    hasQualification(requiredQualification) {
        return this.qualification.includes(requiredQualification);
    }

    toString() {
        return `Operator(${this.name})`;
    }
}

// ==================== 聚合根设计 ====================

/**
 * 集装箱聚合根
 */
class ContainerAggregate {
    constructor(container) {
        this.container = container;
        this.operationPlans = [];
        this.workOrders = [];
    }

    assignToOperationPlan(operationPlan) {
        this.container.assignToOperation(operationPlan);
        this.operationPlans.push(operationPlan);
    }

    createWorkOrder(workOrderType, priority) {
        const workOrder = new WorkOrder(
            `WO_${Date.now()}`,
            workOrderType,
            priority
        );
        this.workOrders.push(workOrder);
        return workOrder;
    }

    updateStatus(newStatus) {
        this.container.updateStatus(newStatus);
    }

    updateLocation(newLocation) {
        this.container.updateLocation(newLocation);
    }

    getCurrentStatus() {
        return this.container.status;
    }

    getOperationHistory() {
        return this.container.operationHistory;
    }

    toString() {
        return `ContainerAggregate(${this.container.toString()})`;
    }
}

/**
 * 作业计划聚合根
 */
class OperationPlanAggregate {
    constructor(plan) {
        this.plan = plan;
        this.steps = [];
        this.resourceAllocations = [];
        this.progress = new Progress(0, 0, 0);
    }

    createStep(stepType, estimatedDuration) {
        const step = new OperationStep(
            `STEP_${this.steps.length + 1}`,
            this.steps.length + 1,
            stepType,
            estimatedDuration
        );
        this.steps.push(step);
        this.updateProgress();
        return step;
    }

    allocateResource(resourceType, resourceId, resourceName, allocatedTime) {
        const allocation = {
            resourceType,
            resourceId,
            resourceName,
            allocatedTime,
            status: 'ALLOCATED'
        };
        this.resourceAllocations.push(allocation);
    }

    updateProgress() {
        const completedSteps = this.steps.filter(step => step.status === 'COMPLETED').length;
        this.progress = this.progress.update(completedSteps, this.steps.length);
    }

    startStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step && step.isReady()) {
            step.start();
            this.updateProgress();
        }
    }

    completeStep(stepId) {
        const step = this.steps.find(s => s.id === stepId);
        if (step) {
            step.complete();
            this.updateProgress();
        }
    }

    validatePlan() {
        return this.steps.length > 0 && 
               this.resourceAllocations.length > 0 &&
               this.plan.status.toString() !== 'CANCELLED';
    }

    getProgress() {
        return this.progress.percentage;
    }

    toString() {
        return `OperationPlanAggregate(${this.plan.id})`;
    }
}

/**
 * 作业指令聚合根
 */
class WorkOrderAggregate {
    constructor(workOrder) {
        this.workOrder = workOrder;
        this.executionSteps = [];
        this.qualityChecks = [];
    }

    assignToOperator(operator) {
        this.workOrder.executor = operator;
        this.workOrder.status = new WorkOrderStatus(WorkOrderStatus.ASSIGNED);
    }

    assignEquipment(equipment) {
        this.workOrder.assignedEquipment = equipment;
    }

    startExecution() {
        this.workOrder.executionStatus = 'IN_PROGRESS';
        this.workOrder.startTime = new Date();
        this.workOrder.status = new WorkOrderStatus(WorkOrderStatus.IN_PROGRESS);
    }

    completeExecution(result) {
        this.workOrder.executionStatus = 'COMPLETED';
        this.workOrder.endTime = new Date();
        this.workOrder.result = result;
        this.workOrder.status = new WorkOrderStatus(WorkOrderStatus.COMPLETED);
    }

    handleException(exception) {
        this.workOrder.exceptions.push({
            ...exception,
            timestamp: new Date()
        });
        this.workOrder.status = new WorkOrderStatus(WorkOrderStatus.EXCEPTION);
    }

    addQualityCheck(check) {
        this.qualityChecks.push({
            ...check,
            timestamp: new Date()
        });
    }

    validateExecution() {
        return this.workOrder.executor &&
               this.workOrder.assignedEquipment &&
               this.qualityChecks.every(check => check.passed);
    }

    getExecutionDuration() {
        if (this.workOrder.startTime && this.workOrder.endTime) {
            return (this.workOrder.endTime - this.workOrder.startTime) / (1000 * 60); // 分钟
        }
        return null;
    }

    toString() {
        return `WorkOrderAggregate(${this.workOrder.id})`;
    }
}

// ==================== 作业指令相关类 ====================

/**
 * 作业指令状态枚举
 */
class WorkOrderStatus {
    static PENDING = 'PENDING';
    static ASSIGNED = 'ASSIGNED';
    static IN_PROGRESS = 'IN_PROGRESS';
    static COMPLETED = 'COMPLETED';
    static CANCELLED = 'CANCELLED';
    static EXCEPTION = 'EXCEPTION';

    constructor(status) {
        if (!Object.values(WorkOrderStatus).includes(status)) {
            throw new Error('无效的作业指令状态');
        }
        this.status = status;
    }

    toString() {
        return this.status;
    }
}

/**
 * 作业指令类型枚举
 */
class WorkOrderType {
    static LOAD = 'LOAD';
    static UNLOAD = 'UNLOAD';
    static MOVE = 'MOVE';
    static INSPECT = 'INSPECT';
    static REPAIR = 'REPAIR';

    constructor(type) {
        if (!Object.values(WorkOrderType).includes(type)) {
            throw new Error('无效的作业指令类型');
        }
        this.type = type;
    }

    toString() {
        return this.type;
    }
}

/**
 * 作业指令实体
 */
class WorkOrder {
    constructor(id, type, priority) {
        this.id = id;
        this.type = type;
        this.status = new WorkOrderStatus(WorkOrderStatus.PENDING);
        this.priority = priority;
        this.executionStatus = 'PENDING';
        this.startTime = null;
        this.endTime = null;
        this.executor = null;
        this.assignedEquipment = null;
        this.result = null;
        this.exceptions = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    toString() {
        return `WorkOrder(${this.id})`;
    }
}

// ==================== 作业计划相关类 ====================

/**
 * 作业计划状态枚举
 */
class PlanStatus {
    static DRAFT = 'DRAFT';
    static CONFIRMED = 'CONFIRMED';
    static IN_PROGRESS = 'IN_PROGRESS';
    static COMPLETED = 'COMPLETED';
    static CANCELLED = 'CANCELLED';

    constructor(status) {
        if (!Object.values(PlanStatus).includes(status)) {
            throw new Error('无效的作业计划状态');
        }
        this.status = status;
    }

    toString() {
        return this.status;
    }
}

/**
 * 作业计划类型枚举
 */
class PlanType {
    static LOADING = 'LOADING';
    static UNLOADING = 'UNLOADING';
    static TRANSFER = 'TRANSFER';
    static MAINTENANCE = 'MAINTENANCE';

    constructor(type) {
        if (!Object.values(PlanType).includes(type)) {
            throw new Error('无效的作业计划类型');
        }
        this.type = type;
    }

    toString() {
        return this.type;
    }
}

/**
 * 作业计划实体
 */
class OperationPlan {
    constructor(id, planType, vessels = [], containers = []) {
        this.id = id;
        this.planType = planType;
        this.status = new PlanStatus(PlanStatus.DRAFT);
        this.priority = new Priority(Priority.MEDIUM);
        this.vessels = vessels;
        this.containers = containers;
        this.steps = [];
        this.resourceAllocation = [];
        this.progress = new Progress(0, 0, 0);
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    confirm() {
        this.status = new PlanStatus(PlanStatus.CONFIRMED);
        this.updatedAt = new Date();
    }

    start() {
        this.status = new PlanStatus(PlanStatus.IN_PROGRESS);
        this.updatedAt = new Date();
    }

    complete() {
        this.status = new PlanStatus(PlanStatus.COMPLETED);
        this.updatedAt = new Date();
    }

    cancel() {
        this.status = new PlanStatus(PlanStatus.CANCELLED);
        this.updatedAt = new Date();
    }

    updateProgress(progress) {
        this.progress = progress;
        this.updatedAt = new Date();
    }

    toString() {
        return `OperationPlan(${this.id})`;
    }
}

// ==================== 领域服务设计 ====================

/**
 * 作业计划生成服务
 */
class OperationPlanGenerationService {
    generatePlan(vessels, containers, constraints = []) {
        // 1. 分析船舶和集装箱信息
        const analysis = this.analyzeRequirements(vessels, containers);
        
        // 2. 确定作业策略
        const strategy = this.determineStrategy(analysis, constraints);
        
        // 3. 生成作业步骤
        const steps = this.generateSteps(analysis, strategy);
        
        // 4. 分配资源
        const resourceAllocation = this.allocateResources(steps);
        
        // 5. 优化计划
        const optimizedPlan = this.optimizePlan(steps, resourceAllocation);
        
        return optimizedPlan;
    }

    analyzeRequirements(vessels, containers) {
        return {
            totalContainers: containers.length,
            containerTypes: [...new Set(containers.map(c => c.type.type))],
            totalWeight: containers.reduce((sum, c) => sum + c.weight.value, 0),
            estimatedDuration: this.estimateDuration(containers),
            specialRequirements: containers.filter(c => c.type.type === ContainerType.DANGEROUS || c.type.type === ContainerType.REFRIGERATED)
        };
    }

    determineStrategy(analysis, constraints) {
        return {
            operationMode: analysis.specialRequirements.length > 0 ? 'SPECIAL_HANDLING' : 'STANDARD',
            priority: analysis.totalWeight > 10000 ? Priority.HIGH : Priority.MEDIUM,
            resourceRequirements: this.calculateResourceRequirements(analysis)
        };
    }

    generateSteps(analysis, strategy) {
        const steps = [];
        
        // 准备步骤
        steps.push({
            id: 'PREP_001',
            name: '作业准备',
            type: 'PREPARATION',
            estimatedDuration: 30,
            dependencies: []
        });

        // 主要作业步骤
        if (strategy.operationMode === 'SPECIAL_HANDLING') {
            steps.push({
                id: 'SPECIAL_001',
                name: '特殊货物处理',
                type: 'SPECIAL_HANDLING',
                estimatedDuration: 60,
                dependencies: ['PREP_001']
            });
        }

        // 装卸作业步骤
        steps.push({
            id: 'OPERATION_001',
            name: '集装箱作业',
            type: 'CONTAINER_OPERATION',
            estimatedDuration: analysis.estimatedDuration,
            dependencies: strategy.operationMode === 'SPECIAL_HANDLING' ? ['SPECIAL_001'] : ['PREP_001']
        });

        // 完成步骤
        steps.push({
            id: 'COMPLETE_001',
            name: '作业完成',
            type: 'COMPLETION',
            estimatedDuration: 30,
            dependencies: ['OPERATION_001']
        });

        return steps;
    }

    allocateResources(steps) {
        return steps.map(step => ({
            stepId: step.id,
            equipment: this.assignEquipment(step),
            personnel: this.assignPersonnel(step),
            timeWindow: this.calculateTimeWindow(step)
        }));
    }

    optimizePlan(steps, resourceAllocation) {
        // 简化的优化逻辑
        const optimizedSteps = steps.map(step => ({
            ...step,
            estimatedDuration: Math.max(step.estimatedDuration * 0.9, 15) // 优化10%，最少15分钟
        }));

        return {
            steps: optimizedSteps,
            resourceAllocation,
            totalDuration: optimizedSteps.reduce((sum, step) => sum + step.estimatedDuration, 0)
        };
    }

    estimateDuration(containers) {
        // 简化的持续时间估算：每个集装箱2分钟
        return containers.length * 2;
    }

    calculateResourceRequirements(analysis) {
        return {
            equipment: Math.ceil(analysis.totalContainers / 50), // 每50个集装箱需要1台设备
            personnel: Math.ceil(analysis.totalContainers / 20)  // 每20个集装箱需要1个人
        };
    }

    assignEquipment(step) {
        // 简化的设备分配逻辑
        const equipmentMap = {
            'PREPARATION': ['FORKLIFT'],
            'SPECIAL_HANDLING': ['SPECIAL_EQUIPMENT'],
            'CONTAINER_OPERATION': ['QUAY_CRANE', 'YARD_CRANE'],
            'COMPLETION': ['FORKLIFT']
        };
        return equipmentMap[step.type] || ['GENERAL_EQUIPMENT'];
    }

    assignPersonnel(step) {
        // 简化的人员分配逻辑
        const personnelMap = {
            'PREPARATION': 2,
            'SPECIAL_HANDLING': 4,
            'CONTAINER_OPERATION': 6,
            'COMPLETION': 2
        };
        return personnelMap[step.type] || 2;
    }

    calculateTimeWindow(step) {
        return {
            startTime: new Date(),
            endTime: new Date(Date.now() + step.estimatedDuration * 60 * 1000)
        };
    }
}

/**
 * 设备调度算法服务
 */
class EquipmentSchedulingService {
    scheduleEquipment(workOrders, availableEquipment, constraints = []) {
        // 1. 分析作业指令需求
        const requirements = this.analyzeRequirements(workOrders);
        
        // 2. 评估设备能力
        const capabilities = this.evaluateCapabilities(availableEquipment);
        
        // 3. 匹配需求和能力
        const matches = this.matchRequirementsToCapabilities(requirements, capabilities);
        
        // 4. 生成调度方案
        const schedule = this.generateSchedule(matches, constraints);
        
        // 5. 优化调度结果
        const optimizedSchedule = this.optimizeSchedule(schedule);
        
        return optimizedSchedule;
    }

    analyzeRequirements(workOrders) {
        return workOrders.map(wo => ({
            workOrderId: wo.id,
            type: wo.type.type,
            priority: wo.priority.level,
            estimatedDuration: this.estimateWorkOrderDuration(wo),
            requiredEquipment: this.getRequiredEquipment(wo.type.type)
        }));
    }

    evaluateCapabilities(equipment) {
        return equipment.map(eq => ({
            equipmentId: eq.id,
            type: eq.type.category,
            capability: eq.type.capability,
            availability: eq.status === 'AVAILABLE',
            currentLoad: eq.currentLoad || 0
        }));
    }

    matchRequirementsToCapabilities(requirements, capabilities) {
        const matches = [];
        
        requirements.forEach(req => {
            const compatibleEquipment = capabilities.filter(cap => 
                cap.type === req.requiredEquipment && 
                cap.availability &&
                cap.currentLoad < cap.capability.maxLoad
            );
            
            if (compatibleEquipment.length > 0) {
                // 选择负载最低的设备
                const selectedEquipment = compatibleEquipment.reduce((min, current) => 
                    current.currentLoad < min.currentLoad ? current : min
                );
                
                matches.push({
                    requirement: req,
                    capability: selectedEquipment,
                    score: this.calculateMatchScore(req, selectedEquipment)
                });
            }
        });
        
        return matches;
    }

    generateSchedule(matches, constraints) {
        // 按优先级排序
        matches.sort((a, b) => a.requirement.priority - b.requirement.priority);
        
        const schedule = {
            assignments: matches.map(match => ({
                workOrderId: match.requirement.workOrderId,
                equipmentId: match.capability.equipmentId,
                startTime: this.calculateStartTime(match),
                endTime: this.calculateEndTime(match),
                score: match.score
            })),
            totalScore: matches.reduce((sum, match) => sum + match.score, 0)
        };
        
        return schedule;
    }

    optimizeSchedule(schedule) {
        // 简化的优化：尝试减少设备切换
        const optimizedAssignments = this.minimizeEquipmentSwitching(schedule.assignments);
        
        return {
            ...schedule,
            assignments: optimizedAssignments,
            optimizationScore: this.calculateOptimizationScore(optimizedAssignments)
        };
    }

    estimateWorkOrderDuration(workOrder) {
        const durationMap = {
            [WorkOrderType.LOAD]: 30,
            [WorkOrderType.UNLOAD]: 30,
            [WorkOrderType.MOVE]: 15,
            [WorkOrderType.INSPECT]: 10,
            [WorkOrderType.REPAIR]: 120
        };
        return durationMap[workOrder.type.type] || 30;
    }

    getRequiredEquipment(workOrderType) {
        const equipmentMap = {
            [WorkOrderType.LOAD]: 'QUAY_CRANE',
            [WorkOrderType.UNLOAD]: 'QUAY_CRANE',
            [WorkOrderType.MOVE]: 'YARD_CRANE',
            [WorkOrderType.INSPECT]: 'INSPECTION_EQUIPMENT',
            [WorkOrderType.REPAIR]: 'REPAIR_EQUIPMENT'
        };
        return equipmentMap[workOrderType] || 'GENERAL_EQUIPMENT';
    }

    calculateMatchScore(requirement, capability) {
        // 简化的匹配分数计算
        const loadFactor = 1 - (capability.currentLoad / capability.capability.maxLoad);
        const priorityFactor = requirement.priority === Priority.HIGH ? 1.2 : 1.0;
        return loadFactor * priorityFactor;
    }

    calculateStartTime(match) {
        return new Date(Date.now() + match.capability.currentLoad * 60 * 1000);
    }

    calculateEndTime(match) {
        return new Date(this.calculateStartTime(match).getTime() + match.requirement.estimatedDuration * 60 * 1000);
    }

    minimizeEquipmentSwitching(assignments) {
        // 简化的设备切换优化
        const equipmentGroups = {};
        assignments.forEach(assignment => {
            if (!equipmentGroups[assignment.equipmentId]) {
                equipmentGroups[assignment.equipmentId] = [];
            }
            equipmentGroups[assignment.equipmentId].push(assignment);
        });
        
        // 为每个设备组内的作业按时间排序
        Object.values(equipmentGroups).forEach(group => {
            group.sort((a, b) => a.startTime - b.startTime);
        });
        
        return assignments;
    }

    calculateOptimizationScore(assignments) {
        // 简化的优化分数计算
        const equipmentSwitches = this.countEquipmentSwitches(assignments);
        return Math.max(0, 100 - equipmentSwitches * 10);
    }

    countEquipmentSwitches(assignments) {
        let switches = 0;
        for (let i = 1; i < assignments.length; i++) {
            if (assignments[i].equipmentId !== assignments[i-1].equipmentId) {
                switches++;
            }
        }
        return switches;
    }
}

/**
 * 进度监控服务
 */
class ProgressMonitoringService {
    monitorProgress(operationPlan) {
        // 1. 收集执行数据
        const executionData = this.collectExecutionData(operationPlan);
        
        // 2. 计算进度指标
        const progressMetrics = this.calculateProgressMetrics(executionData);
        
        // 3. 检测偏差
        const deviations = this.detectDeviations(progressMetrics, operationPlan);
        
        // 4. 生成预测
        const predictions = this.generatePredictions(progressMetrics, deviations);
        
        // 5. 生成报告
        const report = this.generateReport(progressMetrics, deviations, predictions);
        
        return report;
    }

    handleDeviation(deviation) {
        // 1. 分析偏差原因
        const cause = this.analyzeDeviationCause(deviation);
        
        // 2. 评估影响
        const impact = this.assessImpact(deviation);
        
        // 3. 制定应对策略
        const strategy = this.determineStrategy(cause, impact);
        
        // 4. 执行应对措施
        const response = this.executeStrategy(strategy);
        
        return response;
    }

    collectExecutionData(operationPlan) {
        return {
            planId: operationPlan.id,
            currentStep: operationPlan.steps.find(step => step.status === 'IN_PROGRESS'),
            completedSteps: operationPlan.steps.filter(step => step.status === 'COMPLETED'),
            pendingSteps: operationPlan.steps.filter(step => step.status === 'PENDING'),
            totalSteps: operationPlan.steps.length,
            startTime: operationPlan.createdAt,
            currentTime: new Date()
        };
    }

    calculateProgressMetrics(executionData) {
        const completedCount = executionData.completedSteps.length;
        const totalCount = executionData.totalSteps;
        const progressPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
        
        const elapsedTime = executionData.currentTime - executionData.startTime;
        const averageStepTime = completedCount > 0 ? elapsedTime / completedCount : 0;
        
        return {
            progressPercentage,
            completedSteps: completedCount,
            totalSteps: totalCount,
            elapsedTime,
            averageStepTime,
            estimatedRemainingTime: averageStepTime * (totalCount - completedCount)
        };
    }

    detectDeviations(progressMetrics, operationPlan) {
        const deviations = [];
        
        // 检查进度偏差
        const expectedProgress = this.calculateExpectedProgress(operationPlan);
        if (progressMetrics.progressPercentage < expectedProgress - 10) {
            deviations.push({
                type: 'PROGRESS_DELAY',
                severity: 'HIGH',
                description: `进度延迟 ${(expectedProgress - progressMetrics.progressPercentage).toFixed(1)}%`,
                impact: '可能影响整体计划完成时间'
            });
        }
        
        // 检查时间偏差
        const estimatedCompletion = new Date(Date.now() + progressMetrics.estimatedRemainingTime);
        const plannedCompletion = this.getPlannedCompletionTime(operationPlan);
        if (estimatedCompletion > plannedCompletion) {
            deviations.push({
                type: 'TIME_OVERRUN',
                severity: 'MEDIUM',
                description: `预计完成时间超出计划 ${((estimatedCompletion - plannedCompletion) / (1000 * 60 * 60)).toFixed(1)} 小时`,
                impact: '需要调整后续计划'
            });
        }
        
        return deviations;
    }

    generatePredictions(progressMetrics, deviations) {
        const predictions = {
            estimatedCompletionTime: new Date(Date.now() + progressMetrics.estimatedRemainingTime),
            confidenceLevel: this.calculateConfidenceLevel(progressMetrics, deviations),
            riskFactors: this.identifyRiskFactors(deviations),
            recommendations: this.generateRecommendations(deviations)
        };
        
        return predictions;
    }

    generateReport(progressMetrics, deviations, predictions) {
        return {
            summary: {
                progress: progressMetrics.progressPercentage,
                status: deviations.length > 0 ? 'AT_RISK' : 'ON_TRACK',
                completionTime: predictions.estimatedCompletionTime
            },
            details: {
                metrics: progressMetrics,
                deviations: deviations,
                predictions: predictions
            },
            timestamp: new Date()
        };
    }

    analyzeDeviationCause(deviation) {
        const causeMap = {
            'PROGRESS_DELAY': '资源不足或效率低下',
            'TIME_OVERRUN': '计划估算不准确或意外事件',
            'RESOURCE_CONFLICT': '设备或人员冲突',
            'QUALITY_ISSUE': '质量问题导致返工'
        };
        return causeMap[deviation.type] || '未知原因';
    }

    assessImpact(deviation) {
        const impactMap = {
            'HIGH': '严重影响整体计划',
            'MEDIUM': '中等影响，需要调整',
            'LOW': '轻微影响，可接受'
        };
        return impactMap[deviation.severity] || '未知影响';
    }

    determineStrategy(cause, impact) {
        const strategies = {
            '资源不足或效率低下': '增加资源或优化流程',
            '计划估算不准确或意外事件': '重新评估和调整计划',
            '设备或人员冲突': '重新分配资源',
            '质量问题导致返工': '加强质量控制'
        };
        return strategies[cause] || '继续监控';
    }

    executeStrategy(strategy) {
        return {
            action: strategy,
            timestamp: new Date(),
            status: 'EXECUTED'
        };
    }

    calculateExpectedProgress(operationPlan) {
        const elapsedTime = Date.now() - operationPlan.createdAt.getTime();
        const totalPlannedTime = operationPlan.steps.reduce((sum, step) => sum + step.estimatedDuration, 0) * 60 * 1000;
        return Math.min(100, (elapsedTime / totalPlannedTime) * 100);
    }

    getPlannedCompletionTime(operationPlan) {
        const totalDuration = operationPlan.steps.reduce((sum, step) => sum + step.estimatedDuration, 0) * 60 * 1000;
        return new Date(operationPlan.createdAt.getTime() + totalDuration);
    }

    calculateConfidenceLevel(progressMetrics, deviations) {
        let confidence = 100;
        deviations.forEach(deviation => {
            if (deviation.severity === 'HIGH') confidence -= 30;
            else if (deviation.severity === 'MEDIUM') confidence -= 15;
            else confidence -= 5;
        });
        return Math.max(0, confidence);
    }

    identifyRiskFactors(deviations) {
        return deviations.map(deviation => ({
            factor: deviation.type,
            probability: this.estimateRiskProbability(deviation),
            mitigation: this.suggestMitigation(deviation)
        }));
    }

    generateRecommendations(deviations) {
        return deviations.map(deviation => ({
            type: deviation.type,
            recommendation: this.getRecommendation(deviation),
            priority: deviation.severity === 'HIGH' ? 'IMMEDIATE' : 'SOON'
        }));
    }

    estimateRiskProbability(deviation) {
        const probabilityMap = {
            'PROGRESS_DELAY': 0.7,
            'TIME_OVERRUN': 0.5,
            'RESOURCE_CONFLICT': 0.3,
            'QUALITY_ISSUE': 0.2
        };
        return probabilityMap[deviation.type] || 0.5;
    }

    suggestMitigation(deviation) {
        const mitigationMap = {
            'PROGRESS_DELAY': '增加资源或优化流程',
            'TIME_OVERRUN': '重新评估时间估算',
            'RESOURCE_CONFLICT': '重新分配资源',
            'QUALITY_ISSUE': '加强质量检查'
        };
        return mitigationMap[deviation.type] || '继续监控';
    }

    getRecommendation(deviation) {
        const recommendationMap = {
            'PROGRESS_DELAY': '立即增加资源或调整计划',
            'TIME_OVERRUN': '重新评估完成时间并通知相关方',
            'RESOURCE_CONFLICT': '重新分配资源或调整优先级',
            'QUALITY_ISSUE': '暂停作业并检查质量问题'
        };
        return recommendationMap[deviation.type] || '继续执行计划';
    }
}

// ==================== 工厂类 ====================

/**
 * 集装箱工厂
 */
class ContainerFactory {
    static createGeneralContainer(id, containerNumber, weight) {
        const size = new ContainerSize(6.1, 2.4, 2.6); // 20英尺标准箱
        const type = new ContainerType(ContainerType.GENERAL);
        const weightObj = new Weight(weight);
        
        return new Container(id, containerNumber, size, type, weightObj);
    }

    static createRefrigeratedContainer(id, containerNumber, weight) {
        const size = new ContainerSize(6.1, 2.4, 2.6);
        const type = new ContainerType(ContainerType.REFRIGERATED);
        const weightObj = new Weight(weight);
        
        return new Container(id, containerNumber, size, type, weightObj);
    }

    static createDangerousContainer(id, containerNumber, weight, cargoInfo) {
        const size = new ContainerSize(6.1, 2.4, 2.6);
        const type = new ContainerType(ContainerType.DANGEROUS);
        const weightObj = new Weight(weight);
        
        return new Container(id, containerNumber, size, type, weightObj, cargoInfo);
    }

    static createOverweightContainer(id, containerNumber, weight) {
        const size = new ContainerSize(12.2, 2.4, 2.6); // 40英尺箱
        const type = new ContainerType(ContainerType.OVERWEIGHT);
        const weightObj = new Weight(weight);
        
        return new Container(id, containerNumber, size, type, weightObj);
    }

    static createEmptyContainer(id, containerNumber) {
        const size = new ContainerSize(6.1, 2.4, 2.6);
        const type = new ContainerType(ContainerType.EMPTY);
        const weightObj = new Weight(0);
        
        return new Container(id, containerNumber, size, type, weightObj);
    }
}

/**
 * 作业计划工厂
 */
class OperationPlanFactory {
    static createLoadingPlan(id, vessels, containers) {
        const planType = new PlanType(PlanType.LOADING);
        return new OperationPlan(id, planType, vessels, containers);
    }

    static createUnloadingPlan(id, vessels, containers) {
        const planType = new PlanType(PlanType.UNLOADING);
        return new OperationPlan(id, planType, vessels, containers);
    }

    static createTransferPlan(id, containers) {
        const planType = new PlanType(PlanType.TRANSFER);
        return new OperationPlan(id, planType, [], containers);
    }

    static createMaintenancePlan(id, vessels) {
        const planType = new PlanType(PlanType.MAINTENANCE);
        return new OperationPlan(id, planType, vessels, []);
    }
}

/**
 * 作业指令工厂
 */
class WorkOrderFactory {
    static createLoadWorkOrder(id, priority = Priority.MEDIUM) {
        const type = new WorkOrderType(WorkOrderType.LOAD);
        return new WorkOrder(id, type, new Priority(priority));
    }

    static createUnloadWorkOrder(id, priority = Priority.MEDIUM) {
        const type = new WorkOrderType(WorkOrderType.UNLOAD);
        return new WorkOrder(id, type, new Priority(priority));
    }

    static createMoveWorkOrder(id, priority = Priority.LOW) {
        const type = new WorkOrderType(WorkOrderType.MOVE);
        return new WorkOrder(id, type, new Priority(priority));
    }

    static createInspectWorkOrder(id, priority = Priority.MEDIUM) {
        const type = new WorkOrderType(WorkOrderType.INSPECT);
        return new WorkOrder(id, type, new Priority(priority));
    }

    static createRepairWorkOrder(id, priority = Priority.HIGH) {
        const type = new WorkOrderType(WorkOrderType.REPAIR);
        return new WorkOrder(id, type, new Priority(priority));
    }
}

// ==================== 规范类 ====================

/**
 * 集装箱作业规范
 */
class ContainerOperationSpecification {
    static canBeOperated(container, operationType) {
        return container.validateOperation(operationType);
    }

    static isContainerReady(container) {
        return container.status.toString() !== ContainerStatus.DEPARTED;
    }

    static isOperationPlanValid(plan) {
        return plan.steps.length > 0 && 
               plan.status.toString() !== PlanStatus.CANCELLED;
    }

    static isWorkOrderAssignable(workOrder, operator) {
        return workOrder.status.toString() === WorkOrderStatus.PENDING &&
               operator.currentStatus === 'AVAILABLE';
    }

    static isEquipmentCompatible(equipment, container) {
        return equipment.type.canHandle(container);
    }

    static isLocationAvailable(location, containers) {
        const containersAtLocation = containers.filter(c => 
            c.location && c.location.equals(location)
        );
        return containersAtLocation.length === 0;
    }

    static isProgressAcceptable(progress, plan) {
        const expectedProgress = this.calculateExpectedProgress(plan);
        return progress.percentage >= expectedProgress * 0.9; // 允许10%的偏差
    }

    static calculateExpectedProgress(plan) {
        const elapsedTime = Date.now() - plan.createdAt.getTime();
        const totalPlannedTime = plan.steps.reduce((sum, step) => 
            sum + step.estimatedDuration, 0) * 60 * 1000;
        return Math.min(100, (elapsedTime / totalPlannedTime) * 100);
    }
}

// ==================== 领域事件 ====================

/**
 * 领域事件基类
 */
class DomainEvent {
    constructor() {
        this.eventId = `EVENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.timestamp = new Date();
    }
}

/**
 * 集装箱相关事件
 */
class ContainerStatusChangedEvent extends DomainEvent {
    constructor(containerId, oldStatus, newStatus) {
        super();
        this.containerId = containerId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }
}

class ContainerLocationChangedEvent extends DomainEvent {
    constructor(containerId, oldLocation, newLocation) {
        super();
        this.containerId = containerId;
        this.oldLocation = oldLocation;
        this.newLocation = newLocation;
    }
}

/**
 * 作业计划相关事件
 */
class OperationPlanCreatedEvent extends DomainEvent {
    constructor(planId, planType, vessels, containers) {
        super();
        this.planId = planId;
        this.planType = planType;
        this.vessels = vessels;
        this.containers = containers;
    }
}

class OperationPlanStatusChangedEvent extends DomainEvent {
    constructor(planId, oldStatus, newStatus) {
        super();
        this.planId = planId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
    }
}

class OperationPlanCompletedEvent extends DomainEvent {
    constructor(planId, completionTime, performanceMetrics) {
        super();
        this.planId = planId;
        this.completionTime = completionTime;
        this.performanceMetrics = performanceMetrics;
    }
}

/**
 * 作业指令相关事件
 */
class WorkOrderCreatedEvent extends DomainEvent {
    constructor(workOrderId, type, priority) {
        super();
        this.workOrderId = workOrderId;
        this.type = type;
        this.priority = priority;
    }
}

class WorkOrderAssignedEvent extends DomainEvent {
    constructor(workOrderId, operator, equipment) {
        super();
        this.workOrderId = workOrderId;
        this.operator = operator;
        this.equipment = equipment;
    }
}

class WorkOrderExecutedEvent extends DomainEvent {
    constructor(workOrderId, result) {
        super();
        this.workOrderId = workOrderId;
        this.result = result;
    }
}

// ==================== 仓储接口 ====================

/**
 * 集装箱仓储接口
 */
class ContainerRepository {
    async findById(containerId) {
        throw new Error('ContainerRepository.findById() 需要实现');
    }

    async findByNumber(containerNumber) {
        throw new Error('ContainerRepository.findByNumber() 需要实现');
    }

    async findByStatus(status) {
        throw new Error('ContainerRepository.findByStatus() 需要实现');
    }

    async findByLocation(location) {
        throw new Error('ContainerRepository.findByLocation() 需要实现');
    }

    async save(container) {
        throw new Error('ContainerRepository.save() 需要实现');
    }

    async delete(containerId) {
        throw new Error('ContainerRepository.delete() 需要实现');
    }

    async findContainersForOperation(operationPlan) {
        throw new Error('ContainerRepository.findContainersForOperation() 需要实现');
    }
}

/**
 * 作业计划仓储接口
 */
class OperationPlanRepository {
    async findById(planId) {
        throw new Error('OperationPlanRepository.findById() 需要实现');
    }

    async findByStatus(status) {
        throw new Error('OperationPlanRepository.findByStatus() 需要实现');
    }

    async findByVessel(vesselId) {
        throw new Error('OperationPlanRepository.findByVessel() 需要实现');
    }

    async findByDateRange(startDate, endDate) {
        throw new Error('OperationPlanRepository.findByDateRange() 需要实现');
    }

    async save(plan) {
        throw new Error('OperationPlanRepository.save() 需要实现');
    }

    async delete(planId) {
        throw new Error('OperationPlanRepository.delete() 需要实现');
    }

    async findActivePlans() {
        throw new Error('OperationPlanRepository.findActivePlans() 需要实现');
    }

    async findPlansByPriority(priority) {
        throw new Error('OperationPlanRepository.findPlansByPriority() 需要实现');
    }
}

/**
 * 作业指令仓储接口
 */
class WorkOrderRepository {
    async findById(workOrderId) {
        throw new Error('WorkOrderRepository.findById() 需要实现');
    }

    async findByStatus(status) {
        throw new Error('WorkOrderRepository.findByStatus() 需要实现');
    }

    async findByOperator(operatorId) {
        throw new Error('WorkOrderRepository.findByOperator() 需要实现');
    }

    async findByEquipment(equipmentId) {
        throw new Error('WorkOrderRepository.findByEquipment() 需要实现');
    }

    async save(workOrder) {
        throw new Error('WorkOrderRepository.save() 需要实现');
    }

    async delete(workOrderId) {
        throw new Error('WorkOrderRepository.delete() 需要实现');
    }

    async findPendingWorkOrders() {
        throw new Error('WorkOrderRepository.findPendingWorkOrders() 需要实现');
    }

    async findWorkOrdersByPriority(priority) {
        throw new Error('WorkOrderRepository.findWorkOrdersByPriority() 需要实现');
    }
}

// ==================== 应用服务 ====================

/**
 * 作业计划应用服务
 */
class OperationPlanApplicationService {
    constructor(operationPlanRepository, containerRepository, planGenerationService, eventBus) {
        this.operationPlanRepository = operationPlanRepository;
        this.containerRepository = containerRepository;
        this.planGenerationService = planGenerationService;
        this.eventBus = eventBus;
    }

    async createOperationPlan(command) {
        // 1. 验证命令
        this.validateCommand(command);
        
        // 2. 获取相关数据
        const vessels = await this.getVessels(command.vesselIds);
        const containers = await this.getContainers(command.containerIds);
        
        // 3. 生成作业计划
        const plan = this.planGenerationService.generatePlan(vessels, containers, command.constraints);
        
        // 4. 保存计划
        await this.operationPlanRepository.save(plan);
        
        // 5. 发布事件
        this.eventBus.publish(new OperationPlanCreatedEvent(
            plan.id,
            plan.planType,
            plan.vessels,
            plan.containers
        ));
        
        return plan.id;
    }

    async updatePlanStatus(command) {
        // 1. 获取计划
        const plan = await this.operationPlanRepository.findById(command.planId);
        if (!plan) {
            throw new Error('Operation plan not found');
        }
        
        // 2. 更新状态
        const oldStatus = plan.status;
        plan.status = new PlanStatus(command.newStatus);
        
        // 3. 保存更新
        await this.operationPlanRepository.save(plan);
        
        // 4. 发布事件
        this.eventBus.publish(new OperationPlanStatusChangedEvent(
            plan.id,
            oldStatus,
            plan.status
        ));
    }

    validateCommand(command) {
        if (!command.vesselIds || !command.containerIds) {
            throw new Error('Invalid command parameters');
        }
    }

    async getVessels(vesselIds) {
        // 这里应该从船舶调度上下文获取船舶信息
        return vesselIds.map(id => ({ id, name: `Vessel_${id}` }));
    }

    async getContainers(containerIds) {
        const containers = [];
        for (const id of containerIds) {
            const container = await this.containerRepository.findById(id);
            if (container) {
                containers.push(container);
            }
        }
        return containers;
    }
}

/**
 * 作业指令应用服务
 */
class WorkOrderApplicationService {
    constructor(workOrderRepository, operatorRepository, equipmentRepository, eventBus) {
        this.workOrderRepository = workOrderRepository;
        this.operatorRepository = operatorRepository;
        this.equipmentRepository = equipmentRepository;
        this.eventBus = eventBus;
    }

    async assignWorkOrder(command) {
        // 1. 获取作业指令
        const workOrder = await this.workOrderRepository.findById(command.workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        
        // 2. 获取操作员和设备
        const operator = await this.operatorRepository.findById(command.operatorId);
        const equipment = await this.equipmentRepository.findById(command.equipmentId);
        
        // 3. 分配作业指令
        workOrder.executor = operator;
        workOrder.assignedEquipment = equipment;
        workOrder.status = new WorkOrderStatus(WorkOrderStatus.ASSIGNED);
        
        // 4. 保存更新
        await this.workOrderRepository.save(workOrder);
        
        // 5. 发布事件
        this.eventBus.publish(new WorkOrderAssignedEvent(
            workOrder.id,
            operator,
            equipment
        ));
    }

    async executeWorkOrder(command) {
        // 1. 获取作业指令
        const workOrder = await this.workOrderRepository.findById(command.workOrderId);
        if (!workOrder) {
            throw new Error('Work order not found');
        }
        
        // 2. 执行作业指令
        workOrder.executionStatus = 'IN_PROGRESS';
        workOrder.startTime = new Date();
        workOrder.status = new WorkOrderStatus(WorkOrderStatus.IN_PROGRESS);
        
        // 3. 模拟执行过程
        const result = await this.performExecution(workOrder, command.parameters);
        
        // 4. 完成执行
        workOrder.executionStatus = 'COMPLETED';
        workOrder.endTime = new Date();
        workOrder.result = result;
        workOrder.status = new WorkOrderStatus(WorkOrderStatus.COMPLETED);
        
        // 5. 保存结果
        await this.workOrderRepository.save(workOrder);
        
        // 6. 发布事件
        this.eventBus.publish(new WorkOrderExecutedEvent(
            workOrder.id,
            result
        ));
    }

    async performExecution(workOrder, parameters) {
        // 模拟执行过程
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return {
            success: true,
            duration: 60,
            quality: 'GOOD',
            notes: 'Execution completed successfully'
        };
    }
}

// ==================== 上下文集成接口 ====================

/**
 * 集装箱作业上下文集成接口
 */
class ContainerOperationIntegration {
    async receiveVesselSchedule(schedule) {
        // 接收船舶调度信息
        console.log('Received vessel schedule:', schedule);
    }

    async getYardLocations(containerIds) {
        // 获取堆场位置信息
        return containerIds.map(id => new Location('YARD', 'A', 1, 1));
    }

    async getEquipmentStatus(equipmentIds) {
        // 获取设备状态信息
        return equipmentIds.map(id => ({ id, status: 'AVAILABLE' }));
    }

    async sendOperationCompletion(completion) {
        // 发送作业完成通知
        console.log('Operation completion sent:', completion);
    }
}

// ==================== 导出模块 ====================

module.exports = {
    // 值对象
    ContainerNumber,
    ContainerSize,
    ContainerType,
    Weight,
    ContainerStatus,
    Location,
    OperationArea,
    OperationType,
    EquipmentType,
    Priority,
    Progress,
    
    // 实体
    Container,
    OperationStep,
    Operator,
    
    // 聚合根
    ContainerAggregate,
    OperationPlanAggregate,
    WorkOrderAggregate,
    
    // 作业指令相关
    WorkOrderStatus,
    WorkOrderType,
    WorkOrder,
    
    // 作业计划相关
    PlanStatus,
    PlanType,
    OperationPlan,
    
    // 领域服务
    OperationPlanGenerationService,
    EquipmentSchedulingService,
    ProgressMonitoringService,
    
    // 工厂类
    ContainerFactory,
    OperationPlanFactory,
    WorkOrderFactory,
    
    // 规范类
    ContainerOperationSpecification,
    
    // 领域事件
    DomainEvent,
    ContainerStatusChangedEvent,
    ContainerLocationChangedEvent,
    OperationPlanCreatedEvent,
    OperationPlanStatusChangedEvent,
    OperationPlanCompletedEvent,
    WorkOrderCreatedEvent,
    WorkOrderAssignedEvent,
    WorkOrderExecutedEvent,
    
    // 仓储接口
    ContainerRepository,
    OperationPlanRepository,
    WorkOrderRepository,
    
    // 应用服务
    OperationPlanApplicationService,
    WorkOrderApplicationService,
    
    // 上下文集成
    ContainerOperationIntegration
};