/**
 * 船舶访问聚合
 * 基于领域驱动设计的船舶访问业务逻辑
 */

const { v4: uuidv4 } = require('uuid');
const { BUSINESS_STATUS, ERROR_CODES } = require('../../shared/apiContracts');
const { BusinessError } = require('../../middleware/errorHandler');

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
 * 船舶访问聚合根
 */
class VesselVisit extends AggregateRoot {
    constructor(id, vesselId, visitDetails) {
        super(id);
        this.vesselId = vesselId;
        this.visitDetails = visitDetails;
        this.status = BUSINESS_STATUS.VESSEL_VISIT.PLANNED;
        this.createdAt = new Date();
        this.updatedAt = new Date();
        
        // 应用创建事件
        this.apply(new DomainEvent(this.id, 'VesselVisitCreated', {
            vesselId: this.vesselId,
            visitDetails: this.visitDetails,
            status: this.status
        }));
    }

    /**
     * 开始船舶访问
     */
    startVisit() {
        if (this.status !== BUSINESS_STATUS.VESSEL_VISIT.PLANNED) {
            throw new BusinessError(
                '船舶访问状态不正确，无法开始访问',
                ERROR_CODES.VESSEL_VISIT_STATUS_INVALID,
                { currentStatus: this.status, expectedStatus: BUSINESS_STATUS.VESSEL_VISIT.PLANNED }
            );
        }
        
        this.status = BUSINESS_STATUS.VESSEL_VISIT.IN_PROGRESS;
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitStarted', {
            vesselId: this.vesselId,
            status: this.status,
            startedAt: this.updatedAt
        }));
    }

    /**
     * 完成船舶访问
     */
    completeVisit() {
        if (this.status !== BUSINESS_STATUS.VESSEL_VISIT.IN_PROGRESS) {
            throw new BusinessError(
                '船舶访问状态不正确，无法完成访问',
                ERROR_CODES.VESSEL_VISIT_STATUS_INVALID,
                { currentStatus: this.status, expectedStatus: BUSINESS_STATUS.VESSEL_VISIT.IN_PROGRESS }
            );
        }
        
        this.status = BUSINESS_STATUS.VESSEL_VISIT.COMPLETED;
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitCompleted', {
            vesselId: this.vesselId,
            status: this.status,
            completedAt: this.updatedAt
        }));
    }

    /**
     * 取消船舶访问
     */
    cancelVisit(reason) {
        if (this.status === BUSINESS_STATUS.VESSEL_VISIT.COMPLETED) {
            throw new BusinessError(
                '已完成的船舶访问无法取消',
                ERROR_CODES.VESSEL_VISIT_STATUS_INVALID
            );
        }
        
        this.status = BUSINESS_STATUS.VESSEL_VISIT.CANCELLED;
        this.updatedAt = new Date();
        this.cancelReason = reason;
        
        this.apply(new DomainEvent(this.id, 'VesselVisitCancelled', {
            vesselId: this.vesselId,
            status: this.status,
            reason: reason,
            cancelledAt: this.updatedAt
        }));
    }

    /**
     * 更新访问详情
     */
    updateVisitDetails(newDetails) {
        this.visitDetails = { ...this.visitDetails, ...newDetails };
        this.updatedAt = new Date();
        
        this.apply(new DomainEvent(this.id, 'VesselVisitUpdated', {
            vesselId: this.vesselId,
            updatedDetails: newDetails,
            updatedAt: this.updatedAt
        }));
    }

    /**
     * 验证访问时间冲突
     */
    static validateTimeConflict(eta, etd, existingVisits) {
        const visitStart = new Date(eta);
        const visitEnd = new Date(etd);
        
        for (const visit of existingVisits) {
            const existingStart = new Date(visit.visitDetails.eta);
            const existingEnd = new Date(visit.visitDetails.etd);
            
            if (visitStart < existingEnd && visitEnd > existingStart) {
                throw new BusinessError(
                    '船舶访问时间与现有访问冲突',
                    ERROR_CODES.VESSEL_VISIT_TIME_CONFLICT,
                    { 
                        conflictingVisitId: visit.id,
                        requestedTime: { eta, etd },
                        existingTime: { eta: visit.visitDetails.eta, etd: visit.visitDetails.etd }
                    }
                );
            }
        }
    }

    /**
     * 计算访问持续时间（小时）
     */
    calculateDuration() {
        const start = new Date(this.visitDetails.eta);
        const end = new Date(this.visitDetails.etd);
        return Math.ceil((end - start) / (1000 * 60 * 60));
    }

    /**
     * 转换为DTO
     */
    toDTO() {
        return {
            id: this.id,
            vesselId: this.vesselId,
            visitDetails: this.visitDetails,
            status: this.status,
            duration: this.calculateDuration(),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            version: this.version
        };
    }

    /**
     * 从DTO创建实例
     */
    static fromDTO(dto) {
        const visit = new VesselVisit(dto.id, dto.vesselId, dto.visitDetails);
        visit.status = dto.status;
        visit.createdAt = new Date(dto.createdAt);
        visit.updatedAt = new Date(dto.updatedAt);
        visit.version = dto.version;
        visit.markEventsAsCommitted(); // 清除未提交事件
        return visit;
    }
}

/**
 * 船舶访问工厂
 */
class VesselVisitFactory {
    static create(vesselId, visitDetails) {
        const id = uuidv4();
        return new VesselVisit(id, vesselId, visitDetails);
    }

    static createWithId(id, vesselId, visitDetails) {
        return new VesselVisit(id, vesselId, visitDetails);
    }
}

module.exports = {
    VesselVisit,
    VesselVisitFactory,
    DomainEvent,
    AggregateRoot
}; 