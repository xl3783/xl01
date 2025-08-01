/**
 * TOS聚合实现代码模板
 * 基于领域驱动设计原则实现港口业务聚合
 */

// ==================== 基础类定义 ====================

/**
 * 聚合根基类
 */
class AggregateRoot {
    constructor(id) {
        this.id = id;
        this.version = 0;
        this.uncommittedEvents = [];
    }

    /**
     * 应用领域事件
     */
    apply(event) {
        this.uncommittedEvents.push(event);
        this.version++;
    }

    /**
     * 获取未提交的事件
     */
    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }

    /**
     * 标记事件为已提交
     */
    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }
}

/**
 * 值对象基类
 */
class ValueObject {
    constructor(props) {
        Object.assign(this, props);
    }

    equals(other) {
        if (!other || !(other instanceof this.constructor)) {
            return false;
        }
        return JSON.stringify(this) === JSON.stringify(other);
    }
}

/**
 * 领域事件基类
 */
class DomainEvent {
    constructor(aggregateId, eventType, data = {}, timestamp = new Date()) {
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.data = data;
        this.timestamp = timestamp;
        this.eventId = this.generateEventId();
    }

    generateEventId() {
        return `${this.eventType}_${this.aggregateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// ==================== Vessel Visit 聚合 ====================

/**
 * 船舶访问聚合根
 */
class VesselVisit extends AggregateRoot {
    constructor(id, vesselId, visitDetails) {
        super(id);
        this.vesselId = vesselId;
        this.visitDetails = visitDetails;
        this.status = 'PLANNED'; // PLANNED, IN_PROGRESS, COMPLETED
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 开始船舶访问
     */
    startVisit() {
        if (this.status !== 'PLANNED') {
            throw new Error('船舶访问状态不正确，无法开始访问');
        }
        
        this.status = 'IN_PROGRESS';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitStarted', {
            vesselId: this.vesselId,
            status: this.status,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 完成船舶访问
     */
    completeVisit() {
        if (this.status !== 'IN_PROGRESS') {
            throw new Error('船舶访问状态不正确，无法完成访问');
        }
        
        this.status = 'COMPLETED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitCompleted', {
            vesselId: this.vesselId,
            status: this.status,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 更新访问详情
     */
    updateVisitDetails(details) {
        this.visitDetails = { ...this.visitDetails, ...details };
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitDetailsUpdated', {
            details: this.visitDetails,
            timestamp: this.updatedAt
        }));
    }
}

/**
 * 船舶实体
 */
class Vessel {
    constructor(id, name, imo, vesselClass, vesselService, lineOperator) {
        this.id = id;
        this.name = name;
        this.imo = imo;
        this.vesselClass = vesselClass;
        this.vesselService = vesselService;
        this.lineOperator = lineOperator;
    }
}

/**
 * 船舶类别值对象
 */
class VesselClass extends ValueObject {
    constructor(code, name, description) {
        super({ code, name, description });
    }
}

// ==================== Stowage Plan 聚合 ====================

/**
 * 积载计划聚合根
 */
class StowagePlan extends AggregateRoot {
    constructor(id, vesselVisitId, planType) {
        super(id);
        this.vesselVisitId = vesselVisitId;
        this.planType = planType; // INBOUND, OUTBOUND
        this.containerPositions = new Map();
        this.groupCodes = new Map();
        this.stowageErrors = [];
        this.status = 'DRAFT'; // DRAFT, IMPORTED, MODIFIED, EXPORTED
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 导入积载计划
     */
    importStowagePlan(containerPositions, groupCodes) {
        this.containerPositions = new Map(containerPositions);
        this.groupCodes = new Map(groupCodes);
        this.status = 'IMPORTED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'StowagePlanImported', {
            vesselVisitId: this.vesselVisitId,
            planType: this.planType,
            containerCount: this.containerPositions.size,
            groupCodeCount: this.groupCodes.size,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 修改积载计划
     */
    modifyStowagePlan(containerPositions, groupCodes) {
        this.containerPositions = new Map(containerPositions);
        this.groupCodes = new Map(groupCodes);
        this.status = 'MODIFIED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'StowagePlanModified', {
            vesselVisitId: this.vesselVisitId,
            planType: this.planType,
            containerCount: this.containerPositions.size,
            groupCodeCount: this.groupCodes.size,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 检测积载错误
     */
    detectStowageError(error) {
        this.stowageErrors.push({
            id: this.generateErrorId(),
            error: error,
            timestamp: new Date()
        });
        
        this.apply(new DomainEvent(this.id, 'StowageErrorDetected', {
            vesselVisitId: this.vesselVisitId,
            planType: this.planType,
            error: error,
            timestamp: new Date()
        }));
    }

    /**
     * 导出积载计划
     */
    exportStowagePlan() {
        this.status = 'EXPORTED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'StowagePlanExported', {
            vesselVisitId: this.vesselVisitId,
            planType: this.planType,
            timestamp: this.updatedAt
        }));
    }

    generateErrorId() {
        return `error_${this.id}_${Date.now()}`;
    }
}

/**
 * 集装箱位置值对象
 */
class ContainerPosition extends ValueObject {
    constructor(containerId, bay, row, tier, slot) {
        super({ containerId, bay, row, tier, slot });
    }
}

// ==================== Work Instruction 聚合 ====================

/**
 * 工作指令聚合根
 */
class WorkInstruction extends AggregateRoot {
    constructor(id, vesselVisitId, instructionType) {
        super(id);
        this.vesselVisitId = vesselVisitId;
        this.instructionType = instructionType; // DISCHARGE, LOAD
        this.plannedMoves = [];
        this.containerNotes = new Map();
        this.bayNotes = new Map();
        this.status = 'PENDING'; // PENDING, ISSUED, EXECUTING, COMPLETED
        this.issueMethod = null; // EC_SYSTEM, PAPER
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 签发工作指令
     */
    issueInstruction(issueMethod) {
        if (this.status !== 'PENDING') {
            throw new Error('工作指令状态不正确，无法签发');
        }
        
        this.status = 'ISSUED';
        this.issueMethod = issueMethod;
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'WorkInstructionIssued', {
            vesselVisitId: this.vesselVisitId,
            instructionType: this.instructionType,
            issueMethod: this.issueMethod,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 开始执行工作指令
     */
    startExecution() {
        if (this.status !== 'ISSUED') {
            throw new Error('工作指令状态不正确，无法开始执行');
        }
        
        this.status = 'EXECUTING';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'WorkInstructionStarted', {
            vesselVisitId: this.vesselVisitId,
            instructionType: this.instructionType,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 完成工作指令
     */
    completeInstruction() {
        if (this.status !== 'EXECUTING') {
            throw new Error('工作指令状态不正确，无法完成');
        }
        
        this.status = 'COMPLETED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'WorkInstructionCompleted', {
            vesselVisitId: this.vesselVisitId,
            instructionType: this.instructionType,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 添加计划作业
     */
    addPlannedMove(move) {
        this.plannedMoves.push({
            id: this.generateMoveId(),
            ...move,
            createdAt: new Date()
        });
        
        this.apply(new DomainEvent(this.id, 'PlannedMoveAdded', {
            vesselVisitId: this.vesselVisitId,
            instructionType: this.instructionType,
            move: move,
            timestamp: new Date()
        }));
    }

    generateMoveId() {
        return `move_${this.id}_${Date.now()}`;
    }
}

/**
 * 计划作业值对象
 */
class PlannedMove extends ValueObject {
    constructor(containerId, fromPosition, toPosition, moveType, priority) {
        super({ containerId, fromPosition, toPosition, moveType, priority });
    }
}

// ==================== Crane Plan 聚合 ====================

/**
 * 起重机计划聚合根
 */
class CranePlan extends AggregateRoot {
    constructor(id, vesselVisitId, workInstructionId) {
        super(id);
        this.vesselVisitId = vesselVisitId;
        this.workInstructionId = workInstructionId;
        this.craneWorkshifts = [];
        this.workQueues = [];
        this.status = 'DRAFT'; // DRAFT, OPTIMIZED, EXECUTING, COMPLETED
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 创建起重机计划
     */
    createCranePlan() {
        this.status = 'DRAFT';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'CranePlanCreated', {
            vesselVisitId: this.vesselVisitId,
            workInstructionId: this.workInstructionId,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 优化起重机计划
     */
    optimizeCranePlan() {
        this.status = 'OPTIMIZED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'CranePlanOptimized', {
            vesselVisitId: this.vesselVisitId,
            workInstructionId: this.workInstructionId,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 执行起重机计划
     */
    executeCranePlan() {
        this.status = 'EXECUTING';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'CranePlanExecuted', {
            vesselVisitId: this.vesselVisitId,
            workInstructionId: this.workInstructionId,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 添加起重机班次
     */
    addCraneWorkshift(workshift) {
        this.craneWorkshifts.push({
            id: this.generateWorkshiftId(),
            ...workshift,
            createdAt: new Date()
        });
        
        this.apply(new DomainEvent(this.id, 'CraneWorkshiftScheduled', {
            vesselVisitId: this.vesselVisitId,
            workshift: workshift,
            timestamp: new Date()
        }));
    }

    /**
     * 优化作业队列
     */
    optimizeWorkQueue() {
        // 实现作业队列优化逻辑
        this.apply(new DomainEvent(this.id, 'WorkQueueOptimized', {
            vesselVisitId: this.vesselVisitId,
            workInstructionId: this.workInstructionId,
            timestamp: new Date()
        }));
    }

    generateWorkshiftId() {
        return `workshift_${this.id}_${Date.now()}`;
    }
}

/**
 * 起重机班次值对象
 */
class CraneWorkshift extends ValueObject {
    constructor(craneId, startTime, endTime, operatorId, shiftType) {
        super({ craneId, startTime, endTime, operatorId, shiftType });
    }
}

// ==================== Container Management 聚合 ====================

/**
 * 集装箱管理聚合根
 */
class Container extends AggregateRoot {
    constructor(id, containerNumber, containerType) {
        super(id);
        this.containerNumber = containerNumber;
        this.containerType = containerType;
        this.currentPosition = null;
        this.status = 'AVAILABLE'; // AVAILABLE, IN_TRANSIT, LOADED, DISCHARGED
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    /**
     * 分配集装箱位置
     */
    allocatePosition(position) {
        this.currentPosition = position;
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'ContainerPositionAllocated', {
            containerNumber: this.containerNumber,
            position: position,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 更新集装箱状态
     */
    updateStatus(status) {
        this.status = status;
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'ContainerStatusUpdated', {
            containerNumber: this.containerNumber,
            status: status,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 集装箱开始移动
     */
    startMove() {
        this.status = 'IN_TRANSIT';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'ContainerMoveStarted', {
            containerNumber: this.containerNumber,
            status: this.status,
            timestamp: this.updatedAt
        }));
    }

    /**
     * 集装箱移动完成
     */
    completeMove(newPosition) {
        this.currentPosition = newPosition;
        this.status = 'AVAILABLE';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'ContainerMoveCompleted', {
            containerNumber: this.containerNumber,
            position: newPosition,
            status: this.status,
            timestamp: this.updatedAt
        }));
    }
}

/**
 * 集装箱位置值对象
 */
class ContainerLocation extends ValueObject {
    constructor(slot, yardBlock, logicalBlock, allocationRange) {
        super({ slot, yardBlock, logicalBlock, allocationRange });
    }
}

// ==================== 聚合工厂 ====================

/**
 * 聚合工厂类
 */
class AggregateFactory {
    /**
     * 创建船舶访问聚合
     */
    static createVesselVisit(id, vesselId, visitDetails) {
        return new VesselVisit(id, vesselId, visitDetails);
    }

    /**
     * 创建积载计划聚合
     */
    static createStowagePlan(id, vesselVisitId, planType) {
        return new StowagePlan(id, vesselVisitId, planType);
    }

    /**
     * 创建工作指令聚合
     */
    static createWorkInstruction(id, vesselVisitId, instructionType) {
        return new WorkInstruction(id, vesselVisitId, instructionType);
    }

    /**
     * 创建起重机计划聚合
     */
    static createCranePlan(id, vesselVisitId, workInstructionId) {
        return new CranePlan(id, vesselVisitId, workInstructionId);
    }

    /**
     * 创建集装箱聚合
     */
    static createContainer(id, containerNumber, containerType) {
        return new Container(id, containerNumber, containerType);
    }
}

// ==================== 导出模块 ====================

module.exports = {
    // 基础类
    AggregateRoot,
    ValueObject,
    DomainEvent,
    
    // 聚合根
    VesselVisit,
    Vessel,
    VesselClass,
    StowagePlan,
    ContainerPosition,
    WorkInstruction,
    PlannedMove,
    CranePlan,
    CraneWorkshift,
    Container,
    ContainerLocation,
    
    // 工厂
    AggregateFactory
}; 