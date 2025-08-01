/**
 * TOS聚合实现使用示例
 * 展示如何使用聚合模板和领域事件实现港口业务场景
 */

const { 
    AggregateFactory, 
    DomainEventBus, 
    EventStore 
} = require('./aggregate-template-simple.js');

const {
    DomainEventBus: EventBus,
    EventStore: EventStoreFull,
    EventFactory
} = require('./domain-events-specification.js');

// ==================== 事件总线设置 ====================

/**
 * 设置领域事件总线
 */
function setupEventBus() {
    const eventBus = new DomainEventBus();
    
    // 注册船舶访问事件处理器
    eventBus.subscribe('VesselVisitStarted', async (event) => {
        console.log('船舶访问开始:', event.data);
        // 这里可以触发其他业务逻辑，如通知相关人员
    });
    
    eventBus.subscribe('VesselVisitCompleted', async (event) => {
        console.log('船舶访问完成:', event.data);
        // 这里可以触发其他业务逻辑，如生成报告
    });
    
    // 注册积载计划事件处理器
    eventBus.subscribe('StowagePlanImported', async (event) => {
        console.log('积载计划导入:', event.data);
        // 这里可以触发其他业务逻辑，如验证积载计划
    });
    
    // 注册工作指令事件处理器
    eventBus.subscribe('WorkInstructionIssued', async (event) => {
        console.log('工作指令签发:', event.data);
        // 这里可以触发其他业务逻辑，如通知作业人员
    });
    
    return eventBus;
}

// ==================== 业务场景实现示例 ====================

/**
 * 场景1：船舶到港流程完整实现
 */
async function vesselArrivalCompleteExample() {
    console.log('=== 船舶到港流程示例 ===');
    
    const eventBus = setupEventBus();
    
    // 1. 创建船舶访问
    const vesselVisit = AggregateFactory.createVesselVisit(
        'visit_001',
        'vessel_001',
        { 
            berth: 'A1', 
            eta: new Date(),
            vesselName: 'COSCO SHIPPING UNIVERSE',
            imo: 'IMO1234567'
        }
    );
    
    // 2. 创建积载计划
    const stowagePlan = AggregateFactory.createStowagePlan(
        'stowage_001',
        'visit_001',
        'INBOUND'
    );
    
    // 3. 导入积载计划
    const containerPositions = new Map([
        ['container_001', { bay: '01', row: '01', tier: '01', slot: 'A1-01-01-01' }],
        ['container_002', { bay: '01', row: '02', tier: '01', slot: 'A1-01-02-01' }],
        ['container_003', { bay: '02', row: '01', tier: '01', slot: 'A1-02-01-01' }]
    ]);
    stowagePlan.importStowagePlan(containerPositions);
    
    // 4. 开始船舶访问
    vesselVisit.startVisit();
    
    // 5. 发布事件
    const vesselEvents = vesselVisit.getUncommittedEvents();
    const stowageEvents = stowagePlan.getUncommittedEvents();
    
    for (const event of [...vesselEvents, ...stowageEvents]) {
        await eventBus.publish(event);
    }
    
    // 6. 标记事件为已提交
    vesselVisit.markEventsAsCommitted();
    stowagePlan.markEventsAsCommitted();
    
    console.log('船舶访问状态:', vesselVisit.status);
    console.log('积载计划状态:', stowagePlan.status);
    
    return { vesselVisit, stowagePlan };
}

/**
 * 场景2：装卸作业流程完整实现
 */
async function cargoOperationCompleteExample() {
    console.log('=== 装卸作业流程示例 ===');
    
    const eventBus = setupEventBus();
    
    // 1. 创建卸货工作指令
    const dischargeInstruction = AggregateFactory.createWorkInstruction(
        'wi_discharge_001',
        'visit_001',
        'DISCHARGE'
    );
    
    // 2. 签发卸货工作指令
    dischargeInstruction.issueInstruction('EC_SYSTEM');
    
    // 3. 创建起重机计划
    const cranePlan = AggregateFactory.createCranePlan(
        'crane_001',
        'visit_001',
        'wi_discharge_001'
    );
    
    // 4. 创建起重机计划
    cranePlan.createCranePlan();
    
    // 5. 优化起重机计划
    cranePlan.optimizeCranePlan();
    
    // 6. 完成卸货工作指令
    dischargeInstruction.completeInstruction();
    
    // 7. 创建装货工作指令
    const loadInstruction = AggregateFactory.createWorkInstruction(
        'wi_load_001',
        'visit_001',
        'LOAD'
    );
    
    // 8. 签发装货工作指令
    loadInstruction.issueInstruction('PAPER');
    
    // 9. 完成装货工作指令
    loadInstruction.completeInstruction();
    
    // 10. 发布事件
    const dischargeEvents = dischargeInstruction.getUncommittedEvents();
    const craneEvents = cranePlan.getUncommittedEvents();
    const loadEvents = loadInstruction.getUncommittedEvents();
    
    for (const event of [...dischargeEvents, ...craneEvents, ...loadEvents]) {
        await eventBus.publish(event);
    }
    
    // 11. 标记事件为已提交
    dischargeInstruction.markEventsAsCommitted();
    cranePlan.markEventsAsCommitted();
    loadInstruction.markEventsAsCommitted();
    
    console.log('卸货指令状态:', dischargeInstruction.status);
    console.log('起重机计划状态:', cranePlan.status);
    console.log('装货指令状态:', loadInstruction.status);
    
    return { dischargeInstruction, cranePlan, loadInstruction };
}

/**
 * 场景3：船舶离港流程完整实现
 */
async function vesselDepartureCompleteExample() {
    console.log('=== 船舶离港流程示例 ===');
    
    const eventBus = setupEventBus();
    
    // 1. 创建出港积载计划
    const outboundStowagePlan = AggregateFactory.createStowagePlan(
        'stowage_outbound_001',
        'visit_001',
        'OUTBOUND'
    );
    
    // 2. 导入出港积载计划
    const outboundContainerPositions = new Map([
        ['container_004', { bay: '01', row: '01', tier: '01', slot: 'A1-01-01-01' }],
        ['container_005', { bay: '01', row: '02', tier: '01', slot: 'A1-01-02-01' }]
    ]);
    outboundStowagePlan.importStowagePlan(outboundContainerPositions);
    
    // 3. 导出积载计划
    outboundStowagePlan.exportStowagePlan();
    
    // 4. 完成船舶访问
    const vesselVisit = AggregateFactory.createVesselVisit('visit_001', 'vessel_001', {});
    vesselVisit.startVisit(); // 先开始访问
    vesselVisit.completeVisit(); // 然后完成访问
    
    // 5. 发布事件
    const outboundEvents = outboundStowagePlan.getUncommittedEvents();
    const visitEvents = vesselVisit.getUncommittedEvents();
    
    for (const event of [...outboundEvents, ...visitEvents]) {
        await eventBus.publish(event);
    }
    
    // 6. 标记事件为已提交
    outboundStowagePlan.markEventsAsCommitted();
    vesselVisit.markEventsAsCommitted();
    
    console.log('出港积载计划状态:', outboundStowagePlan.status);
    console.log('船舶访问状态:', vesselVisit.status);
    
    return { outboundStowagePlan, vesselVisit };
}

/**
 * 场景4：集装箱管理示例
 */
async function containerManagementExample() {
    console.log('=== 集装箱管理示例 ===');
    
    const eventBus = setupEventBus();
    
    // 1. 创建集装箱
    const container1 = AggregateFactory.createContainer(
        'container_001',
        'ABCD1234567',
        '40HC'
    );
    
    const container2 = AggregateFactory.createContainer(
        'container_002',
        'EFGH7890123',
        '20GP'
    );
    
    // 2. 分配集装箱位置
    container1.allocatePosition({
        slot: 'A1-01-01-01',
        yardBlock: 'A1',
        logicalBlock: 'A1-01',
        allocationRange: 'A1-01-01'
    });
    
    container2.allocatePosition({
        slot: 'A1-01-02-01',
        yardBlock: 'A1',
        logicalBlock: 'A1-01',
        allocationRange: 'A1-01-02'
    });
    
    // 3. 更新集装箱状态
    container1.updateStatus('IN_TRANSIT');
    container2.updateStatus('LOADED');
    
    // 4. 发布事件
    const container1Events = container1.getUncommittedEvents();
    const container2Events = container2.getUncommittedEvents();
    
    for (const event of [...container1Events, ...container2Events]) {
        await eventBus.publish(event);
    }
    
    // 5. 标记事件为已提交
    container1.markEventsAsCommitted();
    container2.markEventsAsCommitted();
    
    console.log('集装箱1状态:', container1.status);
    console.log('集装箱1位置:', container1.currentPosition);
    console.log('集装箱2状态:', container2.status);
    console.log('集装箱2位置:', container2.currentPosition);
    
    return { container1, container2 };
}

// ==================== 错误处理示例 ====================

/**
 * 错误处理示例：状态转换错误
 */
function errorHandlingExample() {
    console.log('=== 错误处理示例 ===');
    
    try {
        const vesselVisit = AggregateFactory.createVesselVisit(
            'visit_error_001',
            'vessel_001',
            { berth: 'A1', eta: new Date() }
        );
        
        // 尝试直接完成访问（应该失败）
        vesselVisit.completeVisit();
    } catch (error) {
        console.log('捕获到预期错误:', error.message);
    }
    
    try {
        const workInstruction = AggregateFactory.createWorkInstruction(
            'wi_error_001',
            'visit_001',
            'DISCHARGE'
        );
        
        // 尝试直接完成指令（应该失败）
        workInstruction.completeInstruction();
    } catch (error) {
        console.log('捕获到预期错误:', error.message);
    }
}

// ==================== 性能测试示例 ====================

/**
 * 性能测试：批量创建聚合
 */
function performanceTestExample() {
    console.log('=== 性能测试示例 ===');
    
    const startTime = Date.now();
    
    // 批量创建船舶访问
    const vesselVisits = [];
    for (let i = 0; i < 100; i++) {
        const vesselVisit = AggregateFactory.createVesselVisit(
            `visit_${i.toString().padStart(3, '0')}`,
            `vessel_${i.toString().padStart(3, '0')}`,
            { berth: `A${i % 10 + 1}`, eta: new Date() }
        );
        vesselVisits.push(vesselVisit);
    }
    
    // 批量创建积载计划
    const stowagePlans = [];
    for (let i = 0; i < 100; i++) {
        const stowagePlan = AggregateFactory.createStowagePlan(
            `stowage_${i.toString().padStart(3, '0')}`,
            `visit_${i.toString().padStart(3, '0')}`,
            i % 2 === 0 ? 'INBOUND' : 'OUTBOUND'
        );
        stowagePlans.push(stowagePlan);
    }
    
    const endTime = Date.now();
    console.log(`创建100个船舶访问和100个积载计划耗时: ${endTime - startTime}ms`);
    
    return { vesselVisits, stowagePlans };
}

// ==================== 主函数 ====================

/**
 * 运行所有示例
 */
async function runAllExamples() {
    console.log('开始运行TOS聚合实现示例...\n');
    
    try {
        // 运行业务场景示例
        await vesselArrivalCompleteExample();
        console.log('\n');
        
        await cargoOperationCompleteExample();
        console.log('\n');
        
        await vesselDepartureCompleteExample();
        console.log('\n');
        
        await containerManagementExample();
        console.log('\n');
        
        // 运行错误处理示例
        errorHandlingExample();
        console.log('\n');
        
        // 运行性能测试示例
        performanceTestExample();
        console.log('\n');
        
        console.log('所有示例运行完成！');
        
    } catch (error) {
        console.error('运行示例时发生错误:', error);
    }
}

// ==================== 导出模块 ====================

module.exports = {
    // 业务场景示例
    vesselArrivalCompleteExample,
    cargoOperationCompleteExample,
    vesselDepartureCompleteExample,
    containerManagementExample,
    
    // 错误处理示例
    errorHandlingExample,
    
    // 性能测试示例
    performanceTestExample,
    
    // 主函数
    runAllExamples
};

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
    runAllExamples();
} 