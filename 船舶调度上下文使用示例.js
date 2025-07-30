/**
 * TOS港口操作系统 - 船舶调度上下文使用示例
 * 展示如何使用船舶调度上下文的实体、值对象和领域服务
 */

const {
    VesselName,
    IMONumber,
    VesselType,
    VesselDimensions,
    Deadweight,
    VesselStatus,
    TimeWindow,
    BerthNumber,
    BerthType,
    BerthStatus,
    ScheduleStatus,
    Vessel,
    Berth,
    Schedule,
    VesselAggregate,
    BerthAggregate,
    ScheduleAggregate,
    VesselSchedulingService,
    VesselFactory,
    BerthFactory,
    VesselSchedulingSpecification
} = require('./船舶调度上下文设计.js');

// ==================== 使用示例 ====================

/**
 * 示例1：创建船舶和泊位
 */
function createVesselAndBerthExample() {
    console.log('=== 示例1：创建船舶和泊位 ===');
    
    // 创建集装箱船舶
    const vesselDimensions = new VesselDimensions(300, 40, 12); // 300m x 40m x 12m
    const deadweight = new Deadweight(50000); // 50000吨
    
    const vessel = VesselFactory.createContainerVessel(
        'VESSEL_001',
        'COSCO SHIPPING UNIVERSE',
        '1234567',
        vesselDimensions,
        deadweight
    );
    
    console.log('船舶信息:', {
        id: vessel.id,
        name: vessel.name.toString(),
        imoNumber: vessel.imoNumber.toString(),
        type: vessel.vesselType.toString(),
        dimensions: vessel.dimensions.toString(),
        deadweight: vessel.deadweight.toString(),
        status: vessel.status.toString()
    });
    
    // 创建集装箱泊位
    const berth = BerthFactory.createContainerBerth(
        'BERTH_001',
        'A1',
        350, // 350米长
        15,  // 15米水深
        ['QUAY_CRANE_1', 'QUAY_CRANE_2', 'QUAY_CRANE_3']
    );
    
    console.log('泊位信息:', {
        id: berth.id,
        berthNumber: berth.berthNumber.toString(),
        type: berth.berthType.toString(),
        length: berth.length,
        depth: berth.depth,
        status: berth.status.toString(),
        equipment: berth.equipmentConfiguration
    });
    
    // 检查船舶是否适合泊位
    const isCompatible = berth.canAccommodateVessel(vessel);
    console.log('船舶是否适合泊位:', isCompatible);
    
    return { vessel, berth };
}

/**
 * 示例2：船舶状态转换
 */
function vesselStatusTransitionExample(vessel) {
    console.log('\n=== 示例2：船舶状态转换 ===');
    
    console.log('初始状态:', vessel.status.toString());
    
    try {
        // 船舶进港
        vessel.changeStatus(VesselStatus.ANCHORED);
        console.log('锚泊状态:', vessel.status.toString());
        
        // 分配泊位
        const berth = new Berth('BERTH_001', 'A1', BerthType.CONTAINER, 350, 15);
        vessel.assignToBerth(berth);
        console.log('靠泊状态:', vessel.status.toString());
        
        // 开始作业
        vessel.startOperation();
        console.log('作业状态:', vessel.status.toString());
        
        // 完成作业
        vessel.completeOperation();
        console.log('完成状态:', vessel.status.toString());
        
        // 离港
        vessel.depart();
        console.log('离港状态:', vessel.status.toString());
        
    } catch (error) {
        console.error('状态转换错误:', error.message);
    }
}

/**
 * 示例3：创建调度计划
 */
function createScheduleExample(vessel, berth) {
    console.log('\n=== 示例3：创建调度计划 ===');
    
    // 创建时间窗口
    const startTime = new Date('2024-01-15T08:00:00Z');
    const endTime = new Date('2024-01-15T16:00:00Z');
    const timeWindow = new TimeWindow(startTime, endTime);
    
    // 创建调度计划
    const schedule = new Schedule(
        'SCH_001',
        vessel,
        berth,
        timeWindow,
        1 // 优先级
    );
    
    console.log('调度计划信息:', {
        id: schedule.id,
        vesselId: schedule.vessel.id,
        berthId: schedule.berth.id,
        timeWindow: schedule.timeWindow.toString(),
        priority: schedule.priority,
        status: schedule.status.toString()
    });
    
    // 确认调度计划
    schedule.confirm();
    console.log('确认后状态:', schedule.status.toString());
    
    // 开始调度计划
    schedule.start();
    console.log('开始后状态:', schedule.status.toString());
    
    // 完成调度计划
    schedule.complete();
    console.log('完成后状态:', schedule.status.toString());
    
    return schedule;
}

/**
 * 示例4：聚合根使用
 */
function aggregateExample(vessel, berth, schedule) {
    console.log('\n=== 示例4：聚合根使用 ===');
    
    // 创建船舶聚合根
    const vesselAggregate = new VesselAggregate(vessel);
    vesselAggregate.addSchedule(schedule);
    
    console.log('船舶调度计划数量:', vesselAggregate.schedules.length);
    
    // 获取当前调度计划
    const currentSchedule = vesselAggregate.getCurrentSchedule();
    console.log('当前调度计划:', currentSchedule ? currentSchedule.id : '无');
    
    // 获取即将到来的调度计划
    const upcomingSchedules = vesselAggregate.getUpcomingSchedules();
    console.log('即将到来的调度计划数量:', upcomingSchedules.length);
    
    // 创建泊位聚合根
    const berthAggregate = new BerthAggregate(berth);
    berthAggregate.addSchedule(schedule);
    
    // 计算泊位利用率
    const startDate = new Date('2024-01-15T00:00:00Z');
    const endDate = new Date('2024-01-16T00:00:00Z');
    const utilization = berthAggregate.calculateUtilization(startDate, endDate);
    console.log('泊位利用率:', utilization.toFixed(2) + '%');
    
    // 创建调度计划聚合根
    const scheduleAggregate = new ScheduleAggregate(schedule);
    
    // 添加作业步骤
    scheduleAggregate.addOperationStep({
        name: '卸货准备',
        description: '准备卸货设备和人员',
        estimatedDuration: 30, // 分钟
        status: 'COMPLETED'
    });
    
    scheduleAggregate.addOperationStep({
        name: '卸货作业',
        description: '执行集装箱卸货',
        estimatedDuration: 240, // 分钟
        status: 'IN_PROGRESS'
    });
    
    scheduleAggregate.addOperationStep({
        name: '装货作业',
        description: '执行集装箱装货',
        estimatedDuration: 180, // 分钟
        status: 'PENDING'
    });
    
    // 添加资源分配
    scheduleAggregate.addResourceAllocation({
        resourceType: 'EQUIPMENT',
        resourceId: 'QC_001',
        resourceName: '岸桥1号',
        allocatedTime: new TimeWindow(
            new Date('2024-01-15T08:00:00Z'),
            new Date('2024-01-15T16:00:00Z')
        )
    });
    
    scheduleAggregate.addResourceAllocation({
        resourceType: 'PERSONNEL',
        resourceId: 'TEAM_001',
        resourceName: '作业班组1',
        allocatedTime: new TimeWindow(
            new Date('2024-01-15T08:00:00Z'),
            new Date('2024-01-15T16:00:00Z')
        )
    });
    
    console.log('调度计划进度:', scheduleAggregate.getProgress().toFixed(2) + '%');
    console.log('作业步骤数量:', scheduleAggregate.operationSteps.length);
    console.log('资源分配数量:', scheduleAggregate.resourceAllocations.length);
}

/**
 * 示例5：领域服务使用
 */
function domainServiceExample() {
    console.log('\n=== 示例5：领域服务使用 ===');
    
    // 模拟仓储接口
    const mockVesselRepository = {
        findById: (id) => {
            if (id === 'VESSEL_001') {
                return VesselFactory.createContainerVessel(
                    'VESSEL_001',
                    'COSCO SHIPPING UNIVERSE',
                    '1234567',
                    new VesselDimensions(300, 40, 12),
                    new Deadweight(50000)
                );
            }
            return null;
        }
    };
    
    const mockBerthRepository = {
        findById: (id) => {
            if (id === 'BERTH_001') {
                return BerthFactory.createContainerBerth(
                    'BERTH_001',
                    'A1',
                    350,
                    15,
                    ['QC_001', 'QC_002']
                );
            }
            return null;
        }
    };
    
    const mockScheduleRepository = {
        findConflictingSchedules: (berthId, timeWindow) => {
            return []; // 假设没有冲突
        },
        save: (schedule) => {
            console.log('保存调度计划:', schedule.id);
        }
    };
    
    // 创建领域服务
    const schedulingService = new VesselSchedulingService(
        mockVesselRepository,
        mockBerthRepository,
        mockScheduleRepository
    );
    
    // 创建时间窗口
    const timeWindow = new TimeWindow(
        new Date('2024-01-15T08:00:00Z'),
        new Date('2024-01-15T16:00:00Z')
    );
    
    try {
        // 为船舶分配泊位
        const schedule = schedulingService.assignBerthToVessel(
            'VESSEL_001',
            'BERTH_001',
            timeWindow
        );
        
        console.log('成功创建调度计划:', schedule.id);
        console.log('船舶ID:', schedule.vessel.id);
        console.log('泊位ID:', schedule.berth.id);
        console.log('时间窗口:', schedule.timeWindow.toString());
        
    } catch (error) {
        console.error('分配泊位失败:', error.message);
    }
}

/**
 * 示例6：冲突检测
 */
function conflictDetectionExample() {
    console.log('\n=== 示例6：冲突检测 ===');
    
    // 创建船舶和泊位
    const vessel1 = VesselFactory.createContainerVessel(
        'VESSEL_001',
        'COSCO SHIPPING UNIVERSE',
        '1234567',
        new VesselDimensions(300, 40, 12),
        new Deadweight(50000)
    );
    
    const vessel2 = VesselFactory.createContainerVessel(
        'VESSEL_002',
        'MSC OSCAR',
        '7654321',
        new VesselDimensions(400, 59, 16),
        new Deadweight(192000)
    );
    
    const berth = BerthFactory.createContainerBerth(
        'BERTH_001',
        'A1',
        400,
        18,
        ['QC_001', 'QC_002', 'QC_003']
    );
    
    // 创建时间窗口
    const timeWindow1 = new TimeWindow(
        new Date('2024-01-15T08:00:00Z'),
        new Date('2024-01-15T16:00:00Z')
    );
    
    const timeWindow2 = new TimeWindow(
        new Date('2024-01-15T12:00:00Z'),
        new Date('2024-01-15T20:00:00Z')
    );
    
    // 创建调度计划
    const schedule1 = new Schedule('SCH_001', vessel1, berth, timeWindow1);
    const schedule2 = new Schedule('SCH_002', vessel2, berth, timeWindow2);
    
    // 检测冲突
    const hasConflict = schedule1.conflictsWith(schedule2);
    console.log('调度计划是否冲突:', hasConflict);
    
    if (hasConflict) {
        console.log('冲突原因: 时间窗口重叠且使用相同泊位');
    }
    
    // 使用领域服务检测多个调度计划的冲突
    const schedulingService = new VesselSchedulingService();
    const conflicts = schedulingService.detectConflicts([schedule1, schedule2]);
    
    console.log('检测到的冲突数量:', conflicts.length);
    conflicts.forEach((conflict, index) => {
        console.log(`冲突${index + 1}:`, {
            schedule1Id: conflict.schedule1.id,
            schedule2Id: conflict.schedule2.id,
            conflictType: conflict.conflictType
        });
    });
}

/**
 * 示例7：规范验证
 */
function specificationExample() {
    console.log('\n=== 示例7：规范验证 ===');
    
    // 创建船舶
    const vessel = VesselFactory.createContainerVessel(
        'VESSEL_001',
        'COSCO SHIPPING UNIVERSE',
        '1234567',
        new VesselDimensions(300, 40, 12),
        new Deadweight(50000)
    );
    
    // 创建泊位
    const berth = BerthFactory.createContainerBerth(
        'BERTH_001',
        'A1',
        350,
        15,
        ['QC_001', 'QC_002']
    );
    
    // 创建时间窗口
    const timeWindow = new TimeWindow(
        new Date('2024-01-15T08:00:00Z'),
        new Date('2024-01-15T16:00:00Z')
    );
    
    // 创建调度计划
    const schedule = new Schedule('SCH_001', vessel, berth, timeWindow);
    
    // 使用规范验证
    console.log('船舶是否可以调度:', VesselSchedulingSpecification.canBeScheduled(vessel));
    console.log('泊位是否可用:', VesselSchedulingSpecification.isBerthAvailable(berth, timeWindow));
    console.log('调度计划是否有效:', VesselSchedulingSpecification.isScheduleValid(schedule));
    
    // 测试无效的调度计划
    try {
        const invalidSchedule = new Schedule('SCH_002', vessel, berth, {
            startTime: new Date('2024-01-15T16:00:00Z'),
            endTime: new Date('2024-01-15T08:00:00Z') // 结束时间早于开始时间
        });
        console.log('无效调度计划是否有效:', VesselSchedulingSpecification.isScheduleValid(invalidSchedule));
    } catch (error) {
        console.log('无效调度计划创建失败:', error.message);
    }
}

/**
 * 示例8：值对象验证
 */
function valueObjectValidationExample() {
    console.log('\n=== 示例8：值对象验证 ===');
    
    // 测试有效的值对象
    try {
        const vesselName = new VesselName('COSCO SHIPPING UNIVERSE');
        console.log('有效船舶名称:', vesselName.toString());
        
        const imoNumber = new IMONumber('1234567');
        console.log('有效IMO号:', imoNumber.toString());
        
        const vesselType = new VesselType(VesselType.CONTAINER);
        console.log('有效船舶类型:', vesselType.toString());
        
        const dimensions = new VesselDimensions(300, 40, 12);
        console.log('有效船舶尺寸:', dimensions.toString());
        
        const deadweight = new Deadweight(50000);
        console.log('有效载重量:', deadweight.toString());
        
    } catch (error) {
        console.error('值对象创建错误:', error.message);
    }
    
    // 测试无效的值对象
    try {
        const invalidVesselName = new VesselName(''); // 空名称
    } catch (error) {
        console.log('无效船舶名称错误:', error.message);
    }
    
    try {
        const invalidIMO = new IMONumber('123456'); // 6位数字
    } catch (error) {
        console.log('无效IMO号错误:', error.message);
    }
    
    try {
        const invalidVesselType = new VesselType('INVALID_TYPE');
    } catch (error) {
        console.log('无效船舶类型错误:', error.message);
    }
    
    try {
        const invalidDimensions = new VesselDimensions(0, 40, 12); // 长度为0
    } catch (error) {
        console.log('无效船舶尺寸错误:', error.message);
    }
    
    try {
        const invalidDeadweight = new Deadweight(-1000); // 负数
    } catch (error) {
        console.log('无效载重量错误:', error.message);
    }
}

/**
 * 主函数：运行所有示例
 */
function runAllExamples() {
    console.log('TOS港口操作系统 - 船舶调度上下文使用示例\n');
    
    try {
        // 示例1：创建船舶和泊位
        const { vessel, berth } = createVesselAndBerthExample();
        
        // 示例2：船舶状态转换
        vesselStatusTransitionExample(vessel);
        
        // 示例3：创建调度计划
        const schedule = createScheduleExample(vessel, berth);
        
        // 示例4：聚合根使用
        aggregateExample(vessel, berth, schedule);
        
        // 示例5：领域服务使用
        domainServiceExample();
        
        // 示例6：冲突检测
        conflictDetectionExample();
        
        // 示例7：规范验证
        specificationExample();
        
        // 示例8：值对象验证
        valueObjectValidationExample();
        
        console.log('\n=== 所有示例执行完成 ===');
        
    } catch (error) {
        console.error('示例执行错误:', error);
    }
}

// 如果直接运行此文件，则执行所有示例
if (require.main === module) {
    runAllExamples();
}

module.exports = {
    createVesselAndBerthExample,
    vesselStatusTransitionExample,
    createScheduleExample,
    aggregateExample,
    domainServiceExample,
    conflictDetectionExample,
    specificationExample,
    valueObjectValidationExample,
    runAllExamples
}; 