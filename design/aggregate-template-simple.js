/**
 * TOS聚合实现代码模板（简化版）
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

    apply(event) {
        this.uncommittedEvents.push(event);
        this.version++;
    }

    getUncommittedEvents() {
        return [...this.uncommittedEvents];
    }

    markEventsAsCommitted() {
        this.uncommittedEvents = [];
    }
}

/**
 * 领域事件基类
 */
class DomainEvent {
    constructor(aggregateId, eventType, data = {}) {
        this.eventId = `${eventType}_${aggregateId}_${Date.now()}`;
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.data = data;
        this.timestamp = new Date();
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
        this.status = 'PLANNED';
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    startVisit() {
        if (this.status !== 'PLANNED') {
            throw new Error('船舶访问状态不正确，无法开始访问');
        }
        
        this.status = 'IN_PROGRESS';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitStarted', {
            vesselId: this.vesselId,
            status: this.status
        }));
    }

    completeVisit() {
        if (this.status !== 'IN_PROGRESS') {
            throw new Error('船舶访问状态不正确，无法完成访问');
        }
        
        this.status = 'COMPLETED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitCompleted', {
            vesselId: this.vesselId,
            status: this.status
        }));
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
        this.status = 'DRAFT';
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    importStowagePlan(containerPositions) {
        this.containerPositions = new Map(containerPositions);
        this.status = 'IMPORTED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'StowagePlanImported', {
            vesselVisitId: this.vesselVisitId,
            planType: this.planType,
            containerCount: this.containerPositions.size
        }));
    }

    exportStowagePlan() {
        this.status = 'EXPORTED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'StowagePlanExported', {
            vesselVisitId: this.vesselVisitId,
            planType: this.planType
        }));
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
        this.status = 'PENDING';
        this.issueMethod = null;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

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
            issueMethod: this.issueMethod
        }));
    }

    completeInstruction() {
        if (this.status !== 'ISSUED') {
            throw new Error('工作指令状态不正确，无法完成');
        }
        
        this.status = 'COMPLETED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'WorkInstructionCompleted', {
            vesselVisitId: this.vesselVisitId,
            instructionType: this.instructionType
        }));
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
        this.status = 'DRAFT';
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    createCranePlan() {
        this.status = 'DRAFT';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'CranePlanCreated', {
            vesselVisitId: this.vesselVisitId,
            workInstructionId: this.workInstructionId
        }));
    }

    optimizeCranePlan() {
        this.status = 'OPTIMIZED';
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'CranePlanOptimized', {
            vesselVisitId: this.vesselVisitId,
            workInstructionId: this.workInstructionId
        }));
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
        this.status = 'AVAILABLE';
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    allocatePosition(position) {
        this.currentPosition = position;
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'ContainerPositionAllocated', {
            containerNumber: this.containerNumber,
            position: position
        }));
    }

    updateStatus(status) {
        this.status = status;
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'ContainerStatusUpdated', {
            containerNumber: this.containerNumber,
            status: status
        }));
    }
}

// ==================== 聚合工厂 ====================

/**
 * 聚合工厂类
 */
class AggregateFactory {
    static createVesselVisit(id, vesselId, visitDetails) {
        return new VesselVisit(id, vesselId, visitDetails);
    }

    static createStowagePlan(id, vesselVisitId, planType) {
        return new StowagePlan(id, vesselVisitId, planType);
    }

    static createWorkInstruction(id, vesselVisitId, instructionType) {
        return new WorkInstruction(id, vesselVisitId, instructionType);
    }

    static createCranePlan(id, vesselVisitId, workInstructionId) {
        return new CranePlan(id, vesselVisitId, workInstructionId);
    }

    static createContainer(id, containerNumber, containerType) {
        return new Container(id, containerNumber, containerType);
    }
}

// ==================== 使用示例 ====================

/**
 * 业务场景示例：船舶到港流程
 */
function vesselArrivalExample() {
    // 1. 创建船舶访问
    const vesselVisit = AggregateFactory.createVesselVisit(
        'visit_001',
        'vessel_001',
        { berth: 'A1', eta: new Date() }
    );

    // 2. 创建积载计划
    const stowagePlan = AggregateFactory.createStowagePlan(
        'stowage_001',
        'visit_001',
        'INBOUND'
    );

    // 3. 导入积载计划
    const containerPositions = new Map([
        ['container_001', { bay: '01', row: '01', tier: '01' }],
        ['container_002', { bay: '01', row: '02', tier: '01' }]
    ]);
    stowagePlan.importStowagePlan(containerPositions);

    // 4. 开始船舶访问
    vesselVisit.startVisit();

    // 5. 获取未提交的事件
    const vesselEvents = vesselVisit.getUncommittedEvents();
    const stowageEvents = stowagePlan.getUncommittedEvents();

    console.log('船舶访问事件:', vesselEvents);
    console.log('积载计划事件:', stowageEvents);

    return { vesselVisit, stowagePlan };
}

/**
 * 业务场景示例：装卸作业流程
 */
function cargoOperationExample() {
    // 1. 创建工作指令
    const workInstruction = AggregateFactory.createWorkInstruction(
        'wi_001',
        'visit_001',
        'DISCHARGE'
    );

    // 2. 签发工作指令
    workInstruction.issueInstruction('EC_SYSTEM');

    // 3. 创建起重机计划
    const cranePlan = AggregateFactory.createCranePlan(
        'crane_001',
        'visit_001',
        'wi_001'
    );

    // 4. 创建起重机计划
    cranePlan.createCranePlan();

    // 5. 优化起重机计划
    cranePlan.optimizeCranePlan();

    // 6. 完成工作指令
    workInstruction.completeInstruction();

    return { workInstruction, cranePlan };
}

// ==================== 导出模块 ====================

module.exports = {
    // 基础类
    AggregateRoot,
    DomainEvent,
    
    // 聚合根
    VesselVisit,
    StowagePlan,
    WorkInstruction,
    CranePlan,
    Container,
    
    // 工厂
    AggregateFactory,
    
    // 示例
    vesselArrivalExample,
    cargoOperationExample
}; 