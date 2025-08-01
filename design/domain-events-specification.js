/**
 * TOS领域事件实现规范
 * 定义港口业务领域事件的结构和处理规范
 */

// ==================== 领域事件基类 ====================

/**
 * 领域事件基类
 */
class DomainEvent {
    constructor(aggregateId, eventType, data = {}, metadata = {}) {
        this.eventId = this.generateEventId();
        this.aggregateId = aggregateId;
        this.eventType = eventType;
        this.data = data;
        this.metadata = {
            timestamp: new Date(),
            version: 1,
            ...metadata
        };
    }

    generateEventId() {
        return `${this.eventType}_${this.aggregateId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    toJSON() {
        return {
            eventId: this.eventId,
            aggregateId: this.aggregateId,
            eventType: this.eventType,
            data: this.data,
            metadata: this.metadata
        };
    }
}

// ==================== 船舶访问相关事件 ====================

/**
 * 船舶访问创建事件
 */
class VesselVisitCreated extends DomainEvent {
    constructor(aggregateId, vesselId, visitDetails) {
        super(aggregateId, 'VesselVisitCreated', {
            vesselId,
            visitDetails,
            status: 'PLANNED'
        });
    }
}

/**
 * 船舶访问开始事件
 */
class VesselVisitStarted extends DomainEvent {
    constructor(aggregateId, vesselId, status) {
        super(aggregateId, 'VesselVisitStarted', {
            vesselId,
            status,
            timestamp: new Date()
        });
    }
}

/**
 * 船舶访问完成事件
 */
class VesselVisitCompleted extends DomainEvent {
    constructor(aggregateId, vesselId, status) {
        super(aggregateId, 'VesselVisitCompleted', {
            vesselId,
            status,
            timestamp: new Date()
        });
    }
}

/**
 * 船舶访问详情更新事件
 */
class VesselVisitDetailsUpdated extends DomainEvent {
    constructor(aggregateId, details) {
        super(aggregateId, 'VesselVisitDetailsUpdated', {
            details,
            timestamp: new Date()
        });
    }
}

// ==================== 积载计划相关事件 ====================

/**
 * 积载计划导入事件
 */
class StowagePlanImported extends DomainEvent {
    constructor(aggregateId, vesselVisitId, planType, containerCount, groupCodeCount) {
        super(aggregateId, 'StowagePlanImported', {
            vesselVisitId,
            planType,
            containerCount,
            groupCodeCount,
            timestamp: new Date()
        });
    }
}

/**
 * 积载计划修改事件
 */
class StowagePlanModified extends DomainEvent {
    constructor(aggregateId, vesselVisitId, planType, containerCount, groupCodeCount) {
        super(aggregateId, 'StowagePlanModified', {
            vesselVisitId,
            planType,
            containerCount,
            groupCodeCount,
            timestamp: new Date()
        });
    }
}

/**
 * 积载错误检测事件
 */
class StowageErrorDetected extends DomainEvent {
    constructor(aggregateId, vesselVisitId, planType, error) {
        super(aggregateId, 'StowageErrorDetected', {
            vesselVisitId,
            planType,
            error,
            timestamp: new Date()
        });
    }
}

/**
 * 积载计划导出事件
 */
class StowagePlanExported extends DomainEvent {
    constructor(aggregateId, vesselVisitId, planType) {
        super(aggregateId, 'StowagePlanExported', {
            vesselVisitId,
            planType,
            timestamp: new Date()
        });
    }
}

// ==================== 工作指令相关事件 ====================

/**
 * 工作指令签发事件
 */
class WorkInstructionIssued extends DomainEvent {
    constructor(aggregateId, vesselVisitId, instructionType, issueMethod) {
        super(aggregateId, 'WorkInstructionIssued', {
            vesselVisitId,
            instructionType,
            issueMethod,
            timestamp: new Date()
        });
    }
}

/**
 * 工作指令开始执行事件
 */
class WorkInstructionStarted extends DomainEvent {
    constructor(aggregateId, vesselVisitId, instructionType) {
        super(aggregateId, 'WorkInstructionStarted', {
            vesselVisitId,
            instructionType,
            timestamp: new Date()
        });
    }
}

/**
 * 工作指令完成事件
 */
class WorkInstructionCompleted extends DomainEvent {
    constructor(aggregateId, vesselVisitId, instructionType) {
        super(aggregateId, 'WorkInstructionCompleted', {
            vesselVisitId,
            instructionType,
            timestamp: new Date()
        });
    }
}

/**
 * 计划作业添加事件
 */
class PlannedMoveAdded extends DomainEvent {
    constructor(aggregateId, vesselVisitId, instructionType, move) {
        super(aggregateId, 'PlannedMoveAdded', {
            vesselVisitId,
            instructionType,
            move,
            timestamp: new Date()
        });
    }
}

// ==================== 起重机计划相关事件 ====================

/**
 * 起重机计划创建事件
 */
class CranePlanCreated extends DomainEvent {
    constructor(aggregateId, vesselVisitId, workInstructionId) {
        super(aggregateId, 'CranePlanCreated', {
            vesselVisitId,
            workInstructionId,
            timestamp: new Date()
        });
    }
}

/**
 * 起重机计划优化事件
 */
class CranePlanOptimized extends DomainEvent {
    constructor(aggregateId, vesselVisitId, workInstructionId) {
        super(aggregateId, 'CranePlanOptimized', {
            vesselVisitId,
            workInstructionId,
            timestamp: new Date()
        });
    }
}

/**
 * 起重机计划执行事件
 */
class CranePlanExecuted extends DomainEvent {
    constructor(aggregateId, vesselVisitId, workInstructionId) {
        super(aggregateId, 'CranePlanExecuted', {
            vesselVisitId,
            workInstructionId,
            timestamp: new Date()
        });
    }
}

/**
 * 起重机班次安排事件
 */
class CraneWorkshiftScheduled extends DomainEvent {
    constructor(aggregateId, vesselVisitId, workshift) {
        super(aggregateId, 'CraneWorkshiftScheduled', {
            vesselVisitId,
            workshift,
            timestamp: new Date()
        });
    }
}

/**
 * 作业队列优化事件
 */
class WorkQueueOptimized extends DomainEvent {
    constructor(aggregateId, vesselVisitId, workInstructionId) {
        super(aggregateId, 'WorkQueueOptimized', {
            vesselVisitId,
            workInstructionId,
            timestamp: new Date()
        });
    }
}

// ==================== 集装箱管理相关事件 ====================

/**
 * 集装箱位置分配事件
 */
class ContainerPositionAllocated extends DomainEvent {
    constructor(aggregateId, containerNumber, position) {
        super(aggregateId, 'ContainerPositionAllocated', {
            containerNumber,
            position,
            timestamp: new Date()
        });
    }
}

/**
 * 集装箱状态更新事件
 */
class ContainerStatusUpdated extends DomainEvent {
    constructor(aggregateId, containerNumber, status) {
        super(aggregateId, 'ContainerStatusUpdated', {
            containerNumber,
            status,
            timestamp: new Date()
        });
    }
}

/**
 * 集装箱移动开始事件
 */
class ContainerMoveStarted extends DomainEvent {
    constructor(aggregateId, containerNumber, status) {
        super(aggregateId, 'ContainerMoveStarted', {
            containerNumber,
            status,
            timestamp: new Date()
        });
    }
}

/**
 * 集装箱移动完成事件
 */
class ContainerMoveCompleted extends DomainEvent {
    constructor(aggregateId, containerNumber, position, status) {
        super(aggregateId, 'ContainerMoveCompleted', {
            containerNumber,
            position,
            status,
            timestamp: new Date()
        });
    }
}

// ==================== 事件处理器基类 ====================

/**
 * 事件处理器基类
 */
class EventHandler {
    constructor() {
        this.handlers = new Map();
    }

    /**
     * 注册事件处理器
     */
    registerHandler(eventType, handler) {
        this.handlers.set(eventType, handler);
    }

    /**
     * 处理事件
     */
    async handleEvent(event) {
        const handler = this.handlers.get(event.eventType);
        if (handler) {
            return await handler(event);
        }
        console.warn(`No handler registered for event type: ${event.eventType}`);
    }

    /**
     * 处理事件列表
     */
    async handleEvents(events) {
        const results = [];
        for (const event of events) {
            const result = await this.handleEvent(event);
            results.push(result);
        }
        return results;
    }
}

// ==================== 事件总线 ====================

/**
 * 领域事件总线
 */
class DomainEventBus {
    constructor() {
        this.handlers = new Map();
        this.middleware = [];
    }

    /**
     * 注册事件处理器
     */
    subscribe(eventType, handler) {
        if (!this.handlers.has(eventType)) {
            this.handlers.set(eventType, []);
        }
        this.handlers.get(eventType).push(handler);
    }

    /**
     * 取消注册事件处理器
     */
    unsubscribe(eventType, handler) {
        if (this.handlers.has(eventType)) {
            const handlers = this.handlers.get(eventType);
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * 发布事件
     */
    async publish(event) {
        // 执行中间件
        for (const middleware of this.middleware) {
            await middleware(event);
        }

        // 执行事件处理器
        const handlers = this.handlers.get(event.eventType) || [];
        const promises = handlers.map(handler => handler(event));
        return Promise.all(promises);
    }

    /**
     * 添加中间件
     */
    use(middleware) {
        this.middleware.push(middleware);
    }
}

// ==================== 事件存储 ====================

/**
 * 事件存储接口
 */
class EventStore {
    constructor() {
        this.events = [];
    }

    /**
     * 保存事件
     */
    async saveEvents(aggregateId, events, expectedVersion) {
        // 验证版本号
        const currentVersion = this.getCurrentVersion(aggregateId);
        if (expectedVersion !== currentVersion) {
            throw new Error(`Concurrency conflict: expected version ${expectedVersion}, but current version is ${currentVersion}`);
        }

        // 保存事件
        for (const event of events) {
            event.expectedVersion = expectedVersion;
            this.events.push(event);
        }

        return events;
    }

    /**
     * 获取聚合事件
     */
    async getEvents(aggregateId) {
        return this.events.filter(event => event.aggregateId === aggregateId);
    }

    /**
     * 获取当前版本号
     */
    getCurrentVersion(aggregateId) {
        const aggregateEvents = this.events.filter(event => event.aggregateId === aggregateId);
        return aggregateEvents.length;
    }
}

// ==================== 事件工厂 ====================

/**
 * 事件工厂类
 */
class EventFactory {
    /**
     * 创建船舶访问事件
     */
    static createVesselVisitEvents() {
        return {
            VesselVisitCreated,
            VesselVisitStarted,
            VesselVisitCompleted,
            VesselVisitDetailsUpdated
        };
    }

    /**
     * 创建积载计划事件
     */
    static createStowagePlanEvents() {
        return {
            StowagePlanImported,
            StowagePlanModified,
            StowageErrorDetected,
            StowagePlanExported
        };
    }

    /**
     * 创建工作指令事件
     */
    static createWorkInstructionEvents() {
        return {
            WorkInstructionIssued,
            WorkInstructionStarted,
            WorkInstructionCompleted,
            PlannedMoveAdded
        };
    }

    /**
     * 创建起重机计划事件
     */
    static createCranePlanEvents() {
        return {
            CranePlanCreated,
            CranePlanOptimized,
            CranePlanExecuted,
            CraneWorkshiftScheduled,
            WorkQueueOptimized
        };
    }

    /**
     * 创建集装箱管理事件
     */
    static createContainerEvents() {
        return {
            ContainerPositionAllocated,
            ContainerStatusUpdated,
            ContainerMoveStarted,
            ContainerMoveCompleted
        };
    }
}

// ==================== 导出模块 ====================

module.exports = {
    // 基础类
    DomainEvent,
    EventHandler,
    DomainEventBus,
    EventStore,
    EventFactory,
    
    // 船舶访问事件
    VesselVisitCreated,
    VesselVisitStarted,
    VesselVisitCompleted,
    VesselVisitDetailsUpdated,
    
    // 积载计划事件
    StowagePlanImported,
    StowagePlanModified,
    StowageErrorDetected,
    StowagePlanExported,
    
    // 工作指令事件
    WorkInstructionIssued,
    WorkInstructionStarted,
    WorkInstructionCompleted,
    PlannedMoveAdded,
    
    // 起重机计划事件
    CranePlanCreated,
    CranePlanOptimized,
    CranePlanExecuted,
    CraneWorkshiftScheduled,
    WorkQueueOptimized,
    
    // 集装箱管理事件
    ContainerPositionAllocated,
    ContainerStatusUpdated,
    ContainerMoveStarted,
    ContainerMoveCompleted
}; 