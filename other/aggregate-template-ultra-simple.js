/**
 * TOS聚合极简实现
 * 充分利用JavaScript弱类型特点，最小化代码量
 */

// ==================== 核心工具 ====================

// 事件创建器
const event = (type, data) => ({
    id: `${type}_${Date.now()}`,
    type,
    data,
    timestamp: new Date()
});

// 聚合行为混入
const aggregate = (obj) => ({
    ...obj,
    events: [],
    version: 0,
    apply(e) { this.events.push(e); this.version++; },
    getEvents() { return [...this.events]; },
    clearEvents() { this.events = []; }
});

// ==================== 聚合定义 ====================

// 船舶访问
const vesselVisit = (id, vesselId, details) => aggregate({
    id, vesselId, details,
    status: 'PLANNED',
    createdAt: new Date(),
    
    start() {
        if (this.status !== 'PLANNED') throw new Error('状态错误');
        this.status = 'IN_PROGRESS';
        this.apply(event('VesselVisitStarted', { vesselId: this.vesselId }));
    },
    
    complete() {
        if (this.status !== 'IN_PROGRESS') throw new Error('状态错误');
        this.status = 'COMPLETED';
        this.apply(event('VesselVisitCompleted', { vesselId: this.vesselId }));
    }
});

// 积载计划
const stowagePlan = (id, vesselVisitId, type) => aggregate({
    id, vesselVisitId, type,
    containers: new Map(),
    status: 'DRAFT',
    createdAt: new Date(),
    
    import(containerData) {
        this.containers = new Map(containerData);
        this.status = 'IMPORTED';
        this.apply(event('StowagePlanImported', { 
            count: this.containers.size,
            type: this.type 
        }));
    },
    
    export() {
        this.status = 'EXPORTED';
        this.apply(event('StowagePlanExported', { type: this.type }));
    }
});

// 工作指令
const workInstruction = (id, vesselVisitId, type) => aggregate({
    id, vesselVisitId, type,
    moves: [],
    status: 'PENDING',
    createdAt: new Date(),
    
    issue(method) {
        if (this.status !== 'PENDING') throw new Error('状态错误');
        this.status = 'ISSUED';
        this.apply(event('WorkInstructionIssued', { method, type: this.type }));
    },
    
    complete() {
        if (this.status !== 'ISSUED') throw new Error('状态错误');
        this.status = 'COMPLETED';
        this.apply(event('WorkInstructionCompleted', { type: this.type }));
    }
});

// 起重机计划
const cranePlan = (id, vesselVisitId, workInstructionId) => aggregate({
    id, vesselVisitId, workInstructionId,
    shifts: [],
    status: 'DRAFT',
    createdAt: new Date(),
    
    create() {
        this.status = 'DRAFT';
        this.apply(event('CranePlanCreated', { workInstructionId: this.workInstructionId }));
    },
    
    optimize() {
        this.status = 'OPTIMIZED';
        this.apply(event('CranePlanOptimized', { workInstructionId: this.workInstructionId }));
    }
});

// 集装箱
const container = (id, number, type) => aggregate({
    id, number, type,
    position: null,
    status: 'AVAILABLE',
    createdAt: new Date(),
    
    allocate(pos) {
        this.position = pos;
        this.apply(event('ContainerPositionAllocated', { number: this.number, position: pos }));
    },
    
    updateStatus(status) {
        this.status = status;
        this.apply(event('ContainerStatusUpdated', { number: this.number, status }));
    }
});

// ==================== 业务场景 ====================

// 船舶到港流程
const vesselArrival = () => {
    const visit = vesselVisit('visit_001', 'vessel_001', { berth: 'A1' });
    const plan = stowagePlan('plan_001', 'visit_001', 'INBOUND');
    
    plan.import([
        ['cont_001', { bay: '01', row: '01' }],
        ['cont_002', { bay: '01', row: '02' }]
    ]);
    
    visit.start();
    
    return { visit, plan };
};

// 装卸作业流程
const cargoOperation = () => {
    const instruction = workInstruction('wi_001', 'visit_001', 'DISCHARGE');
    const crane = cranePlan('crane_001', 'visit_001', 'wi_001');
    
    instruction.issue('EC_SYSTEM');
    crane.create();
    crane.optimize();
    instruction.complete();
    
    return { instruction, crane };
};

// ==================== 导出 ====================

module.exports = {
    // 聚合创建函数
    vesselVisit,
    stowagePlan,
    workInstruction,
    cranePlan,
    container,
    
    // 业务场景
    vesselArrival,
    cargoOperation,
    
    // 工具函数
    event,
    aggregate
}; 