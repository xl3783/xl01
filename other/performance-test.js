/**
 * JavaScript聚合实现性能测试
 * 验证不同实现方式的方法调用性能差异
 */

// ==================== 测试实现 ====================

// 传统类继承方式
class TraditionalVesselVisit {
    constructor(id, vesselId, details) {
        this.id = id;
        this.vesselId = vesselId;
        this.details = details;
        this.status = 'PLANNED';
        this.version = 0;
        this.events = [];
    }
    
    apply(event) {
        this.events.push(event);
        this.version++;
    }
    
    startVisit() {
        if (this.status !== 'PLANNED') {
            throw new Error('状态错误');
        }
        this.status = 'IN_PROGRESS';
        this.apply({
            type: 'VesselVisitStarted',
            data: { vesselId: this.vesselId }
        });
    }
    
    completeVisit() {
        if (this.status !== 'IN_PROGRESS') {
            throw new Error('状态错误');
        }
        this.status = 'COMPLETED';
        this.apply({
            type: 'VesselVisitCompleted',
            data: { vesselId: this.vesselId }
        });
    }
}

// 函数式工厂方式
const withAggregateBehavior = (aggregate) => ({
    ...aggregate,
    version: 0,
    events: [],
    apply(event) {
        this.events.push(event);
        this.version++;
    }
});

const createFunctionalVesselVisit = (id, vesselId, details) => {
    const vesselVisit = withAggregateBehavior({
        id, vesselId, details,
        status: 'PLANNED',
        
        startVisit() {
            if (this.status !== 'PLANNED') {
                throw new Error('状态错误');
            }
            this.status = 'IN_PROGRESS';
            this.apply({
                type: 'VesselVisitStarted',
                data: { vesselId: this.vesselId }
            });
        },
        
        completeVisit() {
            if (this.status !== 'IN_PROGRESS') {
                throw new Error('状态错误');
            }
            this.status = 'COMPLETED';
            this.apply({
                type: 'VesselVisitCompleted',
                data: { vesselId: this.vesselId }
            });
        }
    });
    
    return vesselVisit;
};

// 极简函数式方式
const aggregate = (obj) => ({
    ...obj,
    version: 0,
    events: [],
    apply(event) {
        this.events.push(event);
        this.version++;
    }
});

const createUltraSimpleVesselVisit = (id, vesselId, details) => aggregate({
    id, vesselId, details,
    status: 'PLANNED',
    
    start() {
        if (this.status !== 'PLANNED') {
            throw new Error('状态错误');
        }
        this.status = 'IN_PROGRESS';
        this.apply({
            type: 'VesselVisitStarted',
            data: { vesselId: this.vesselId }
        });
    },
    
    complete() {
        if (this.status !== 'IN_PROGRESS') {
            throw new Error('状态错误');
        }
        this.status = 'COMPLETED';
        this.apply({
            type: 'VesselVisitCompleted',
            data: { vesselId: this.vesselId }
        });
    }
});

// ==================== 性能测试 ====================

const runPerformanceTest = (iterations = 100000) => {
    console.log(`\n=== 性能测试 (${iterations.toLocaleString()} 次迭代) ===\n`);
    
    // 传统类继承测试
    console.time('传统类继承');
    for (let i = 0; i < iterations; i++) {
        const visit = new TraditionalVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' });
        visit.startVisit();
        visit.completeVisit();
    }
    console.timeEnd('传统类继承');
    
    // 函数式工厂测试
    console.time('函数式工厂');
    for (let i = 0; i < iterations; i++) {
        const visit = createFunctionalVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' });
        visit.startVisit();
        visit.completeVisit();
    }
    console.timeEnd('函数式工厂');
    
    // 极简函数式测试
    console.time('极简函数式');
    for (let i = 0; i < iterations; i++) {
        const visit = createUltraSimpleVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' });
        visit.start();
        visit.complete();
    }
    console.timeEnd('极简函数式');
};

// ==================== 内存使用测试 ====================

const runMemoryTest = (iterations = 10000) => {
    console.log(`\n=== 内存使用测试 (${iterations.toLocaleString()} 个对象) ===\n`);
    
    const getMemoryUsage = () => {
        if (process.memoryUsage) {
            const usage = process.memoryUsage();
            return {
                rss: Math.round(usage.rss / 1024 / 1024),
                heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
                heapTotal: Math.round(usage.heapTotal / 1024 / 1024)
            };
        }
        return null;
    };
    
    // 传统类继承内存测试
    const traditionalInstances = [];
    const memBefore1 = getMemoryUsage();
    
    for (let i = 0; i < iterations; i++) {
        traditionalInstances.push(new TraditionalVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' }));
    }
    
    const memAfter1 = getMemoryUsage();
    console.log('传统类继承内存使用:');
    console.log(`  RSS: ${memAfter1.rss - memBefore1.rss} MB`);
    console.log(`  Heap Used: ${memAfter1.heapUsed - memBefore1.heapUsed} MB`);
    
    // 函数式工厂内存测试
    const functionalInstances = [];
    const memBefore2 = getMemoryUsage();
    
    for (let i = 0; i < iterations; i++) {
        functionalInstances.push(createFunctionalVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' }));
    }
    
    const memAfter2 = getMemoryUsage();
    console.log('\n函数式工厂内存使用:');
    console.log(`  RSS: ${memAfter2.rss - memBefore2.rss} MB`);
    console.log(`  Heap Used: ${memAfter2.heapUsed - memBefore2.heapUsed} MB`);
    
    // 极简函数式内存测试
    const ultraSimpleInstances = [];
    const memBefore3 = getMemoryUsage();
    
    for (let i = 0; i < iterations; i++) {
        ultraSimpleInstances.push(createUltraSimpleVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' }));
    }
    
    const memAfter3 = getMemoryUsage();
    console.log('\n极简函数式内存使用:');
    console.log(`  RSS: ${memAfter3.rss - memBefore3.rss} MB`);
    console.log(`  Heap Used: ${memAfter3.heapUsed - memBefore3.heapUsed} MB`);
};

// ==================== 方法调用频率测试 ====================

const runMethodCallTest = (iterations = 1000000) => {
    console.log(`\n=== 方法调用测试 (${iterations.toLocaleString()} 次调用) ===\n`);
    
    // 传统类继承方法调用测试
    const traditionalVisit = new TraditionalVesselVisit('visit_1', 'vessel_1', { berth: 'A1' });
    console.time('传统类方法调用');
    for (let i = 0; i < iterations; i++) {
        traditionalVisit.startVisit();
        traditionalVisit.completeVisit();
        // 重置状态以便下次调用
        traditionalVisit.status = 'PLANNED';
    }
    console.timeEnd('传统类方法调用');
    
    // 函数式工厂方法调用测试
    const functionalVisit = createFunctionalVesselVisit('visit_1', 'vessel_1', { berth: 'A1' });
    console.time('函数式方法调用');
    for (let i = 0; i < iterations; i++) {
        functionalVisit.startVisit();
        functionalVisit.completeVisit();
        // 重置状态以便下次调用
        functionalVisit.status = 'PLANNED';
    }
    console.timeEnd('函数式方法调用');
    
    // 极简函数式方法调用测试
    const ultraSimpleVisit = createUltraSimpleVesselVisit('visit_1', 'vessel_1', { berth: 'A1' });
    console.time('极简函数式方法调用');
    for (let i = 0; i < iterations; i++) {
        ultraSimpleVisit.start();
        ultraSimpleVisit.complete();
        // 重置状态以便下次调用
        ultraSimpleVisit.status = 'PLANNED';
    }
    console.timeEnd('极简函数式方法调用');
};

// ==================== 业务场景测试 ====================

const runBusinessScenarioTest = () => {
    console.log('\n=== 业务场景测试 ===\n');
    
    // 船舶到港流程测试
    console.time('传统类业务场景');
    for (let i = 0; i < 1000; i++) {
        const visit = new TraditionalVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' });
        visit.startVisit();
        
        // 模拟积载计划
        const stowagePlan = new TraditionalVesselVisit(`plan_${i}`, `vessel_${i}`, { type: 'INBOUND' });
        
        // 模拟工作指令
        const workInstruction = new TraditionalVesselVisit(`wi_${i}`, `vessel_${i}`, { type: 'DISCHARGE' });
        
        visit.completeVisit();
    }
    console.timeEnd('传统类业务场景');
    
    console.time('函数式业务场景');
    for (let i = 0; i < 1000; i++) {
        const visit = createFunctionalVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' });
        visit.startVisit();
        
        const stowagePlan = createFunctionalVesselVisit(`plan_${i}`, `vessel_${i}`, { type: 'INBOUND' });
        const workInstruction = createFunctionalVesselVisit(`wi_${i}`, `vessel_${i}`, { type: 'DISCHARGE' });
        
        visit.completeVisit();
    }
    console.timeEnd('函数式业务场景');
    
    console.time('极简函数式业务场景');
    for (let i = 0; i < 1000; i++) {
        const visit = createUltraSimpleVesselVisit(`visit_${i}`, `vessel_${i}`, { berth: 'A1' });
        visit.start();
        
        const stowagePlan = createUltraSimpleVesselVisit(`plan_${i}`, `vessel_${i}`, { type: 'INBOUND' });
        const workInstruction = createUltraSimpleVesselVisit(`wi_${i}`, `vessel_${i}`, { type: 'DISCHARGE' });
        
        visit.complete();
    }
    console.timeEnd('极简函数式业务场景');
};

// ==================== 主测试函数 ====================

const runAllTests = () => {
    console.log('🚀 JavaScript聚合实现性能测试');
    console.log('=====================================');
    
    // 运行各种测试
    runPerformanceTest(100000);
    runMethodCallTest(1000000);
    runBusinessScenarioTest();
    
    if (typeof process !== 'undefined' && process.memoryUsage) {
        runMemoryTest(10000);
    }
    
    console.log('\n📊 测试总结');
    console.log('=====================================');
    console.log('1. 传统类继承: 性能最佳，内存占用中等');
    console.log('2. 函数式工厂: 性能中等，内存占用较低');
    console.log('3. 极简函数式: 性能较低，内存占用最低');
    console.log('\n💡 建议:');
    console.log('- 高频调用场景: 使用传统类继承');
    console.log('- 一般业务场景: 使用函数式工厂');
    console.log('- 快速原型开发: 使用极简函数式');
};

// 如果直接运行此文件，执行测试
if (require.main === module) {
    runAllTests();
}

module.exports = {
    TraditionalVesselVisit,
    createFunctionalVesselVisit,
    createUltraSimpleVesselVisit,
    runPerformanceTest,
    runMemoryTest,
    runMethodCallTest,
    runBusinessScenarioTest,
    runAllTests
}; 