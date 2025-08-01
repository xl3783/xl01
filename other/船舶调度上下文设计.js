/**
 * TOS港口操作系统 - 船舶调度上下文设计
 * 基于DDD战术设计模式，使用JavaScript实现
 */

// ==================== 值对象设计 ====================

/**
 * 船舶名称值对象
 */
class VesselName {
    constructor(value) {
        if (!value || typeof value !== 'string' || value.trim().length === 0) {
            throw new Error('船舶名称不能为空');
        }
        if (value.length > 100) {
            throw new Error('船舶名称长度不能超过100个字符');
        }
        this.value = value.trim();
    }

    equals(other) {
        return other instanceof VesselName && this.value === other.value;
    }

    toString() {
        return this.value;
    }
}

/**
 * IMO号值对象
 */
class IMONumber {
    constructor(value) {
        if (!this.isValidIMO(value)) {
            throw new Error('无效的IMO号格式');
        }
        this.value = value;
    }

    isValidIMO(imo) {
        // IMO号格式验证：7位数字
        const imoRegex = /^\d{7}$/;
        return imoRegex.test(imo);
    }

    equals(other) {
        return other instanceof IMONumber && this.value === other.value;
    }

    toString() {
        return this.value;
    }
}

/**
 * 船舶类型值对象
 */
class VesselType {
    static CONTAINER = 'CONTAINER';
    static BULK = 'BULK';
    static TANKER = 'TANKER';
    static GENERAL = 'GENERAL';
    static RO_RO = 'RO_RO';

    constructor(type) {
        if (!Object.values(VesselType).includes(type)) {
            throw new Error('无效的船舶类型');
        }
        this.value = type;
    }

    equals(other) {
        return other instanceof VesselType && this.value === other.value;
    }

    toString() {
        return this.value;
    }
}

/**
 * 船舶尺寸值对象
 */
class VesselDimensions {
    constructor(length, beam, draft) {
        if (length <= 0 || beam <= 0 || draft <= 0) {
            throw new Error('船舶尺寸必须大于0');
        }
        this.length = length; // 船长（米）
        this.beam = beam;     // 船宽（米）
        this.draft = draft;   // 吃水（米）
    }

    equals(other) {
        return other instanceof VesselDimensions &&
               this.length === other.length &&
               this.beam === other.beam &&
               this.draft === other.draft;
    }

    getArea() {
        return this.length * this.beam;
    }

    toString() {
        return `${this.length}m x ${this.beam}m x ${this.draft}m`;
    }
}

/**
 * 载重量值对象
 */
class Deadweight {
    constructor(weight) {
        if (weight <= 0) {
            throw new Error('载重量必须大于0');
        }
        this.value = weight; // 吨
    }

    equals(other) {
        return other instanceof Deadweight && this.value === other.value;
    }

    add(other) {
        return new Deadweight(this.value + other.value);
    }

    subtract(other) {
        const result = this.value - other.value;
        if (result < 0) {
            throw new Error('载重量不能为负数');
        }
        return new Deadweight(result);
    }

    toString() {
        return `${this.value}吨`;
    }
}

/**
 * 船舶状态值对象
 */
class VesselStatus {
    static APPROACHING = 'APPROACHING';     // 进港中
    static ANCHORED = 'ANCHORED';           // 锚泊
    static BERTHED = 'BERTHED';             // 靠泊
    static OPERATING = 'OPERATING';         // 作业中
    static COMPLETED = 'COMPLETED';         // 作业完成
    static DEPARTING = 'DEPARTING';         // 离港中
    static MAINTENANCE = 'MAINTENANCE';     // 维护中

    constructor(status) {
        if (!Object.values(VesselStatus).includes(status)) {
            throw new Error('无效的船舶状态');
        }
        this.value = status;
    }

    equals(other) {
        return other instanceof VesselStatus && this.value === other.value;
    }

    canTransitionTo(newStatus) {
        const validTransitions = {
            [VesselStatus.APPROACHING]: [VesselStatus.ANCHORED, VesselStatus.BERTHED],
            [VesselStatus.ANCHORED]: [VesselStatus.BERTHED],
            [VesselStatus.BERTHED]: [VesselStatus.OPERATING],
            [VesselStatus.OPERATING]: [VesselStatus.COMPLETED],
            [VesselStatus.COMPLETED]: [VesselStatus.DEPARTING],
            [VesselStatus.DEPARTING]: [VesselStatus.APPROACHING],
            [VesselStatus.MAINTENANCE]: [VesselStatus.APPROACHING, VesselStatus.ANCHORED]
        };
        return validTransitions[this.value]?.includes(newStatus) || false;
    }

    toString() {
        return this.value;
    }
}

/**
 * 时间窗口值对象
 */
class TimeWindow {
    constructor(startTime, endTime) {
        if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
            throw new Error('开始时间和结束时间必须是Date对象');
        }
        if (startTime >= endTime) {
            throw new Error('开始时间必须早于结束时间');
        }
        this.startTime = new Date(startTime);
        this.endTime = new Date(endTime);
    }

    getDuration() {
        return this.endTime.getTime() - this.startTime.getTime();
    }

    overlaps(other) {
        return this.startTime < other.endTime && this.endTime > other.startTime;
    }

    contains(time) {
        return time >= this.startTime && time <= this.endTime;
    }

    equals(other) {
        return other instanceof TimeWindow &&
               this.startTime.getTime() === other.startTime.getTime() &&
               this.endTime.getTime() === other.endTime.getTime();
    }

    toString() {
        return `${this.startTime.toISOString()} - ${this.endTime.toISOString()}`;
    }
}

/**
 * 泊位号值对象
 */
class BerthNumber {
    constructor(number) {
        if (!number || typeof number !== 'string') {
            throw new Error('泊位号不能为空');
        }
        this.value = number.trim();
    }

    equals(other) {
        return other instanceof BerthNumber && this.value === other.value;
    }

    toString() {
        return this.value;
    }
}

/**
 * 泊位类型值对象
 */
class BerthType {
    static CONTAINER = 'CONTAINER';
    static BULK = 'BULK';
    static TANKER = 'TANKER';
    static GENERAL = 'GENERAL';
    static MULTI_PURPOSE = 'MULTI_PURPOSE';

    constructor(type) {
        if (!Object.values(BerthType).includes(type)) {
            throw new Error('无效的泊位类型');
        }
        this.value = type;
    }

    equals(other) {
        return other instanceof BerthType && this.value === other.value;
    }

    toString() {
        return this.value;
    }
}

/**
 * 泊位状态值对象
 */
class BerthStatus {
    static AVAILABLE = 'AVAILABLE';         // 可用
    static OCCUPIED = 'OCCUPIED';           // 占用
    static MAINTENANCE = 'MAINTENANCE';     // 维护
    static RESERVED = 'RESERVED';           // 预留

    constructor(status) {
        if (!Object.values(BerthStatus).includes(status)) {
            throw new Error('无效的泊位状态');
        }
        this.value = status;
    }

    equals(other) {
        return other instanceof BerthStatus && this.value === other.value;
    }

    toString() {
        return this.value;
    }
}

/**
 * 调度计划状态值对象
 */
class ScheduleStatus {
    static DRAFT = 'DRAFT';                 // 草稿
    static CONFIRMED = 'CONFIRMED';         // 已确认
    static IN_PROGRESS = 'IN_PROGRESS';     // 进行中
    static COMPLETED = 'COMPLETED';         // 已完成
    static CANCELLED = 'CANCELLED';         // 已取消

    constructor(status) {
        if (!Object.values(ScheduleStatus).includes(status)) {
            throw new Error('无效的调度计划状态');
        }
        this.value = status;
    }

    equals(other) {
        return other instanceof ScheduleStatus && this.value === other.value;
    }

    toString() {
        return this.value;
    }
}

// ==================== 实体设计 ====================

/**
 * 船舶实体
 */
class Vessel {
    constructor(id, name, imoNumber, vesselType, dimensions, deadweight) {
        this.id = id;
        this.name = name instanceof VesselName ? name : new VesselName(name);
        this.imoNumber = imoNumber instanceof IMONumber ? imoNumber : new IMONumber(imoNumber);
        this.vesselType = vesselType instanceof VesselType ? vesselType : new VesselType(vesselType);
        this.dimensions = dimensions instanceof VesselDimensions ? dimensions : new VesselDimensions(
            dimensions.length, dimensions.beam, dimensions.draft
        );
        this.deadweight = deadweight instanceof Deadweight ? deadweight : new Deadweight(deadweight);
        this.status = new VesselStatus(VesselStatus.APPROACHING);
        this.currentBerth = null;
        this.scheduleHistory = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    changeStatus(newStatus) {
        const newStatusObj = new VesselStatus(newStatus);
        if (!this.status.canTransitionTo(newStatus)) {
            throw new Error(`船舶状态不能从 ${this.status} 转换为 ${newStatus}`);
        }
        
        const oldStatus = this.status;
        this.status = newStatusObj;
        this.updatedAt = new Date();
        
        // 发布状态变更事件
        this.addDomainEvent({
            type: 'VesselStatusChanged',
            vesselId: this.id,
            oldStatus: oldStatus.toString(),
            newStatus: newStatusObj.toString(),
            timestamp: new Date()
        });
    }

    assignToBerth(berth) {
        if (this.status.value !== VesselStatus.APPROACHING && 
            this.status.value !== VesselStatus.ANCHORED) {
            throw new Error('只有进港中或锚泊的船舶才能分配泊位');
        }
        this.currentBerth = berth;
        this.changeStatus(VesselStatus.BERTHED);
    }

    startOperation() {
        if (this.status.value !== VesselStatus.BERTHED) {
            throw new Error('只有靠泊的船舶才能开始作业');
        }
        this.changeStatus(VesselStatus.OPERATING);
    }

    completeOperation() {
        if (this.status.value !== VesselStatus.OPERATING) {
            throw new Error('只有作业中的船舶才能完成作业');
        }
        this.changeStatus(VesselStatus.COMPLETED);
    }

    depart() {
        if (this.status.value !== VesselStatus.COMPLETED) {
            throw new Error('只有作业完成的船舶才能离港');
        }
        this.currentBerth = null;
        this.changeStatus(VesselStatus.DEPARTING);
    }

    addSchedule(schedule) {
        this.scheduleHistory.push({
            schedule: schedule,
            addedAt: new Date()
        });
    }

    addDomainEvent(event) {
        if (!this.domainEvents) {
            this.domainEvents = [];
        }
        this.domainEvents.push(event);
    }

    clearDomainEvents() {
        this.domainEvents = [];
    }

    equals(other) {
        return other instanceof Vessel && this.id === other.id;
    }
}

/**
 * 泊位实体
 */
class Berth {
    constructor(id, berthNumber, berthType, length, depth, equipmentConfiguration) {
        this.id = id;
        this.berthNumber = berthNumber instanceof BerthNumber ? berthNumber : new BerthNumber(berthNumber);
        this.berthType = berthType instanceof BerthType ? berthType : new BerthType(berthType);
        this.length = length; // 泊位长度（米）
        this.depth = depth;   // 泊位水深（米）
        this.equipmentConfiguration = equipmentConfiguration || [];
        this.status = new BerthStatus(BerthStatus.AVAILABLE);
        this.currentVessel = null;
        this.scheduleHistory = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    canAccommodateVessel(vessel) {
        // 检查船舶尺寸是否适合泊位
        if (vessel.dimensions.length > this.length) {
            return false;
        }
        if (vessel.dimensions.draft > this.depth) {
            return false;
        }
        // 检查泊位类型是否匹配船舶类型
        return this.isCompatibleWithVesselType(vessel.vesselType);
    }

    isCompatibleWithVesselType(vesselType) {
        const compatibilityMap = {
            [VesselType.CONTAINER]: [BerthType.CONTAINER, BerthType.MULTI_PURPOSE],
            [VesselType.BULK]: [BerthType.BULK, BerthType.MULTI_PURPOSE],
            [VesselType.TANKER]: [BerthType.TANKER, BerthType.MULTI_PURPOSE],
            [VesselType.GENERAL]: [BerthType.GENERAL, BerthType.MULTI_PURPOSE],
            [VesselType.RO_RO]: [BerthType.GENERAL, BerthType.MULTI_PURPOSE]
        };
        return compatibilityMap[vesselType.value]?.includes(this.berthType.value) || false;
    }

    assignVessel(vessel) {
        if (this.status.value !== BerthStatus.AVAILABLE) {
            throw new Error('泊位不可用');
        }
        if (!this.canAccommodateVessel(vessel)) {
            throw new Error('船舶不适合此泊位');
        }
        
        this.currentVessel = vessel;
        this.status = new BerthStatus(BerthStatus.OCCUPIED);
        this.updatedAt = new Date();
        
        this.addDomainEvent({
            type: 'BerthAssigned',
            berthId: this.id,
            vesselId: vessel.id,
            timestamp: new Date()
        });
    }

    releaseVessel() {
        if (this.status.value !== BerthStatus.OCCUPIED) {
            throw new Error('泊位未被占用');
        }
        
        const releasedVessel = this.currentVessel;
        this.currentVessel = null;
        this.status = new BerthStatus(BerthStatus.AVAILABLE);
        this.updatedAt = new Date();
        
        this.addDomainEvent({
            type: 'BerthReleased',
            berthId: this.id,
            vesselId: releasedVessel.id,
            timestamp: new Date()
        });
        
        return releasedVessel;
    }

    addSchedule(schedule) {
        this.scheduleHistory.push({
            schedule: schedule,
            addedAt: new Date()
        });
    }

    addDomainEvent(event) {
        if (!this.domainEvents) {
            this.domainEvents = [];
        }
        this.domainEvents.push(event);
    }

    clearDomainEvents() {
        this.domainEvents = [];
    }

    equals(other) {
        return other instanceof Berth && this.id === other.id;
    }
}

/**
 * 调度计划实体
 */
class Schedule {
    constructor(id, vessel, berth, timeWindow, priority = 1) {
        this.id = id;
        this.vessel = vessel;
        this.berth = berth;
        this.timeWindow = timeWindow instanceof TimeWindow ? timeWindow : new TimeWindow(
            timeWindow.startTime, timeWindow.endTime
        );
        this.priority = priority;
        this.status = new ScheduleStatus(ScheduleStatus.DRAFT);
        this.operationDetails = null;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    confirm() {
        if (this.status.value !== ScheduleStatus.DRAFT) {
            throw new Error('只有草稿状态的调度计划才能确认');
        }
        this.status = new ScheduleStatus(ScheduleStatus.CONFIRMED);
        this.updatedAt = new Date();
        
        this.addDomainEvent({
            type: 'ScheduleConfirmed',
            scheduleId: this.id,
            vesselId: this.vessel.id,
            berthId: this.berth.id,
            timestamp: new Date()
        });
    }

    start() {
        if (this.status.value !== ScheduleStatus.CONFIRMED) {
            throw new Error('只有已确认的调度计划才能开始');
        }
        this.status = new ScheduleStatus(ScheduleStatus.IN_PROGRESS);
        this.updatedAt = new Date();
        
        this.addDomainEvent({
            type: 'ScheduleStarted',
            scheduleId: this.id,
            timestamp: new Date()
        });
    }

    complete() {
        if (this.status.value !== ScheduleStatus.IN_PROGRESS) {
            throw new Error('只有进行中的调度计划才能完成');
        }
        this.status = new ScheduleStatus(ScheduleStatus.COMPLETED);
        this.updatedAt = new Date();
        
        this.addDomainEvent({
            type: 'ScheduleCompleted',
            scheduleId: this.id,
            timestamp: new Date()
        });
    }

    cancel() {
        if (this.status.value === ScheduleStatus.COMPLETED) {
            throw new Error('已完成的调度计划不能取消');
        }
        this.status = new ScheduleStatus(ScheduleStatus.CANCELLED);
        this.updatedAt = new Date();
        
        this.addDomainEvent({
            type: 'ScheduleCancelled',
            scheduleId: this.id,
            timestamp: new Date()
        });
    }

    setOperationDetails(details) {
        this.operationDetails = details;
        this.updatedAt = new Date();
    }

    conflictsWith(other) {
        // 检查时间窗口冲突
        if (this.timeWindow.overlaps(other.timeWindow)) {
            // 检查泊位冲突
            if (this.berth.id === other.berth.id) {
                return true;
            }
            // 检查船舶冲突
            if (this.vessel.id === other.vessel.id) {
                return true;
            }
        }
        return false;
    }

    addDomainEvent(event) {
        if (!this.domainEvents) {
            this.domainEvents = [];
        }
        this.domainEvents.push(event);
    }

    clearDomainEvents() {
        this.domainEvents = [];
    }

    equals(other) {
        return other instanceof Schedule && this.id === other.id;
    }
}

// ==================== 聚合根设计 ====================

/**
 * 船舶聚合根
 */
class VesselAggregate {
    constructor(vessel) {
        this.vessel = vessel;
        this.schedules = [];
        this.operationHistory = [];
    }

    addSchedule(schedule) {
        // 验证调度计划是否属于此船舶
        if (schedule.vessel.id !== this.vessel.id) {
            throw new Error('调度计划不属于此船舶');
        }
        
        // 检查时间冲突
        for (const existingSchedule of this.schedules) {
            if (schedule.conflictsWith(existingSchedule)) {
                throw new Error('调度计划时间冲突');
            }
        }
        
        this.schedules.push(schedule);
        this.vessel.addSchedule(schedule);
    }

    removeSchedule(scheduleId) {
        const index = this.schedules.findIndex(s => s.id === scheduleId);
        if (index === -1) {
            throw new Error('调度计划不存在');
        }
        this.schedules.splice(index, 1);
    }

    getCurrentSchedule() {
        const now = new Date();
        return this.schedules.find(schedule => 
            schedule.timeWindow.contains(now) && 
            schedule.status.value === ScheduleStatus.IN_PROGRESS
        );
    }

    getUpcomingSchedules() {
        const now = new Date();
        return this.schedules.filter(schedule => 
            schedule.timeWindow.startTime > now &&
            schedule.status.value === ScheduleStatus.CONFIRMED
        ).sort((a, b) => a.timeWindow.startTime - b.timeWindow.startTime);
    }

    addOperationRecord(record) {
        this.operationHistory.push({
            ...record,
            timestamp: new Date()
        });
    }

    getDomainEvents() {
        const events = [...(this.vessel.domainEvents || [])];
        this.vessel.clearDomainEvents();
        return events;
    }
}

/**
 * 泊位聚合根
 */
class BerthAggregate {
    constructor(berth) {
        this.berth = berth;
        this.schedules = [];
        this.utilizationHistory = [];
    }

    addSchedule(schedule) {
        // 验证调度计划是否属于此泊位
        if (schedule.berth.id !== this.berth.id) {
            throw new Error('调度计划不属于此泊位');
        }
        
        // 检查时间冲突
        for (const existingSchedule of this.schedules) {
            if (schedule.conflictsWith(existingSchedule)) {
                throw new Error('调度计划时间冲突');
            }
        }
        
        this.schedules.push(schedule);
        this.berth.addSchedule(schedule);
    }

    removeSchedule(scheduleId) {
        const index = this.schedules.findIndex(s => s.id === scheduleId);
        if (index === -1) {
            throw new Error('调度计划不存在');
        }
        this.schedules.splice(index, 1);
    }

    getCurrentSchedule() {
        const now = new Date();
        return this.schedules.find(schedule => 
            schedule.timeWindow.contains(now) && 
            schedule.status.value === ScheduleStatus.IN_PROGRESS
        );
    }

    getUpcomingSchedules() {
        const now = new Date();
        return this.schedules.filter(schedule => 
            schedule.timeWindow.startTime > now &&
            schedule.status.value === ScheduleStatus.CONFIRMED
        ).sort((a, b) => a.timeWindow.startTime - b.timeWindow.startTime);
    }

    calculateUtilization(startDate, endDate) {
        const totalTime = endDate.getTime() - startDate.getTime();
        let occupiedTime = 0;
        
        for (const schedule of this.schedules) {
            if (schedule.status.value === ScheduleStatus.COMPLETED) {
                const overlapStart = Math.max(startDate.getTime(), schedule.timeWindow.startTime.getTime());
                const overlapEnd = Math.min(endDate.getTime(), schedule.timeWindow.endTime.getTime());
                if (overlapEnd > overlapStart) {
                    occupiedTime += overlapEnd - overlapStart;
                }
            }
        }
        
        return totalTime > 0 ? (occupiedTime / totalTime) * 100 : 0;
    }

    addUtilizationRecord(record) {
        this.utilizationHistory.push({
            ...record,
            timestamp: new Date()
        });
    }

    getDomainEvents() {
        const events = [...(this.berth.domainEvents || [])];
        this.berth.clearDomainEvents();
        return events;
    }
}

/**
 * 调度计划聚合根
 */
class ScheduleAggregate {
    constructor(schedule) {
        this.schedule = schedule;
        this.operationSteps = [];
        this.resourceAllocations = [];
    }

    addOperationStep(step) {
        this.operationSteps.push({
            ...step,
            id: `step_${this.operationSteps.length + 1}`,
            createdAt: new Date()
        });
    }

    addResourceAllocation(allocation) {
        this.resourceAllocations.push({
            ...allocation,
            id: `allocation_${this.resourceAllocations.length + 1}`,
            createdAt: new Date()
        });
    }

    getProgress() {
        if (this.operationSteps.length === 0) {
            return 0;
        }
        
        const completedSteps = this.operationSteps.filter(step => step.status === 'COMPLETED');
        return (completedSteps.length / this.operationSteps.length) * 100;
    }

    getEstimatedCompletionTime() {
        if (this.operationSteps.length === 0) {
            return this.schedule.timeWindow.endTime;
        }
        
        const remainingSteps = this.operationSteps.filter(step => step.status !== 'COMPLETED');
        const avgStepDuration = 30; // 假设平均每个步骤30分钟
        const estimatedRemainingTime = remainingSteps.length * avgStepDuration * 60 * 1000; // 转换为毫秒
        
        return new Date(Date.now() + estimatedRemainingTime);
    }

    getDomainEvents() {
        const events = [...(this.schedule.domainEvents || [])];
        this.schedule.clearDomainEvents();
        return events;
    }
}

// ==================== 领域服务设计 ====================

/**
 * 船舶调度领域服务
 */
class VesselSchedulingService {
    constructor(vesselRepository, berthRepository, scheduleRepository) {
        this.vesselRepository = vesselRepository;
        this.berthRepository = berthRepository;
        this.scheduleRepository = scheduleRepository;
    }

    /**
     * 为船舶分配泊位
     */
    assignBerthToVessel(vesselId, berthId, timeWindow) {
        const vessel = this.vesselRepository.findById(vesselId);
        const berth = this.berthRepository.findById(berthId);
        
        if (!vessel) {
            throw new Error('船舶不存在');
        }
        if (!berth) {
            throw new Error('泊位不存在');
        }
        
        // 检查泊位是否适合船舶
        if (!berth.canAccommodateVessel(vessel)) {
            throw new Error('泊位不适合此船舶');
        }
        
        // 检查时间冲突
        const conflictingSchedules = this.scheduleRepository.findConflictingSchedules(berthId, timeWindow);
        if (conflictingSchedules.length > 0) {
            throw new Error('时间窗口与现有调度计划冲突');
        }
        
        // 创建调度计划
        const schedule = new Schedule(
            this.generateScheduleId(),
            vessel,
            berth,
            timeWindow
        );
        
        // 保存调度计划
        this.scheduleRepository.save(schedule);
        
        return schedule;
    }

    /**
     * 优化调度计划
     */
    optimizeSchedules(vessels, berths, timeRange) {
        // 实现调度优化算法
        const optimizedSchedules = [];
        
        // 按优先级排序船舶
        const sortedVessels = vessels.sort((a, b) => b.priority - a.priority);
        
        for (const vessel of sortedVessels) {
            const bestBerth = this.findBestBerthForVessel(vessel, berths, timeRange);
            if (bestBerth) {
                const timeWindow = this.findOptimalTimeWindow(vessel, bestBerth, timeRange);
                if (timeWindow) {
                    const schedule = new Schedule(
                        this.generateScheduleId(),
                        vessel,
                        bestBerth,
                        timeWindow
                    );
                    optimizedSchedules.push(schedule);
                }
            }
        }
        
        return optimizedSchedules;
    }

    /**
     * 检测调度冲突
     */
    detectConflicts(schedules) {
        const conflicts = [];
        
        for (let i = 0; i < schedules.length; i++) {
            for (let j = i + 1; j < schedules.length; j++) {
                if (schedules[i].conflictsWith(schedules[j])) {
                    conflicts.push({
                        schedule1: schedules[i],
                        schedule2: schedules[j],
                        conflictType: this.determineConflictType(schedules[i], schedules[j])
                    });
                }
            }
        }
        
        return conflicts;
    }

    /**
     * 生成调度计划ID
     */
    generateScheduleId() {
        return `SCH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 为船舶找到最佳泊位
     */
    findBestBerthForVessel(vessel, berths, timeRange) {
        const compatibleBerths = berths.filter(berth => 
            berth.canAccommodateVessel(vessel) && 
            berth.status.value === BerthStatus.AVAILABLE
        );
        
        if (compatibleBerths.length === 0) {
            return null;
        }
        
        // 按优先级排序：类型匹配 > 尺寸适合 > 设备配置
        return compatibleBerths.sort((a, b) => {
            // 类型匹配优先级
            const aTypeMatch = a.berthType.value === vessel.vesselType.value ? 1 : 0;
            const bTypeMatch = b.berthType.value === vessel.vesselType.value ? 1 : 0;
            if (aTypeMatch !== bTypeMatch) {
                return bTypeMatch - aTypeMatch;
            }
            
            // 尺寸适合度
            const aFitRatio = Math.min(a.length / vessel.dimensions.length, a.depth / vessel.dimensions.draft);
            const bFitRatio = Math.min(b.length / vessel.dimensions.length, b.depth / vessel.dimensions.draft);
            return bFitRatio - aFitRatio;
        })[0];
    }

    /**
     * 找到最优时间窗口
     */
    findOptimalTimeWindow(vessel, berth, timeRange) {
        // 简化实现：返回时间范围内的第一个可用时间窗口
        const duration = 2 * 60 * 60 * 1000; // 2小时
        const startTime = new Date(timeRange.startTime);
        const endTime = new Date(timeRange.endTime.getTime() - duration);
        
        return new TimeWindow(startTime, new Date(startTime.getTime() + duration));
    }

    /**
     * 确定冲突类型
     */
    determineConflictType(schedule1, schedule2) {
        if (schedule1.berth.id === schedule2.berth.id) {
            return 'BERTH_CONFLICT';
        }
        if (schedule1.vessel.id === schedule2.vessel.id) {
            return 'VESSEL_CONFLICT';
        }
        return 'TIME_CONFLICT';
    }
}

// ==================== 工厂设计 ====================

/**
 * 船舶工厂
 */
class VesselFactory {
    static createContainerVessel(id, name, imoNumber, dimensions, deadweight) {
        return new Vessel(
            id,
            name,
            imoNumber,
            new VesselType(VesselType.CONTAINER),
            dimensions,
            deadweight
        );
    }

    static createBulkVessel(id, name, imoNumber, dimensions, deadweight) {
        return new Vessel(
            id,
            name,
            imoNumber,
            new VesselType(VesselType.BULK),
            dimensions,
            deadweight
        );
    }

    static createTankerVessel(id, name, imoNumber, dimensions, deadweight) {
        return new Vessel(
            id,
            name,
            imoNumber,
            new VesselType(VesselType.TANKER),
            dimensions,
            deadweight
        );
    }
}

/**
 * 泊位工厂
 */
class BerthFactory {
    static createContainerBerth(id, berthNumber, length, depth, equipmentConfiguration) {
        return new Berth(
            id,
            berthNumber,
            new BerthType(BerthType.CONTAINER),
            length,
            depth,
            equipmentConfiguration
        );
    }

    static createBulkBerth(id, berthNumber, length, depth, equipmentConfiguration) {
        return new Berth(
            id,
            berthNumber,
            new BerthType(BerthType.BULK),
            length,
            depth,
            equipmentConfiguration
        );
    }

    static createTankerBerth(id, berthNumber, length, depth, equipmentConfiguration) {
        return new Berth(
            id,
            berthNumber,
            new BerthType(BerthType.TANKER),
            length,
            depth,
            equipmentConfiguration
        );
    }
}

// ==================== 规范设计 ====================

/**
 * 船舶调度规范
 */
class VesselSchedulingSpecification {
    /**
     * 检查船舶是否可以调度
     */
    static canBeScheduled(vessel) {
        return vessel.status.value === VesselStatus.APPROACHING ||
               vessel.status.value === VesselStatus.ANCHORED;
    }

    /**
     * 检查泊位是否可用
     */
    static isBerthAvailable(berth, timeWindow) {
        return berth.status.value === BerthStatus.AVAILABLE;
    }

    /**
     * 检查调度计划是否有效
     */
    static isScheduleValid(schedule) {
        return schedule.vessel && 
               schedule.berth && 
               schedule.timeWindow &&
               schedule.timeWindow.startTime < schedule.timeWindow.endTime;
    }
}

// ==================== 导出模块 ====================

module.exports = {
    // 值对象
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
    
    // 实体
    Vessel,
    Berth,
    Schedule,
    
    // 聚合根
    VesselAggregate,
    BerthAggregate,
    ScheduleAggregate,
    
    // 领域服务
    VesselSchedulingService,
    
    // 工厂
    VesselFactory,
    BerthFactory,
    
    // 规范
    VesselSchedulingSpecification
}; 