/**
 * 船舶访问仓储
 * 基于仓储模式的数据访问层
 */

const { logger } = require('../utils/logger');
const { BusinessError } = require('../middleware/errorHandler');
const { ERROR_CODES } = require('../shared/apiContracts');

/**
 * 船舶访问仓储接口
 */
class IVesselVisitRepository {
    async save(vesselVisit) {
        throw new Error('方法必须由子类实现');
    }

    async findById(id) {
        throw new Error('方法必须由子类实现');
    }

    async findByVesselId(vesselId) {
        throw new Error('方法必须由子类实现');
    }

    async findByStatus(status) {
        throw new Error('方法必须由子类实现');
    }

    async findAll(options = {}) {
        throw new Error('方法必须由子类实现');
    }

    async delete(id) {
        throw new Error('方法必须由子类实现');
    }
}

/**
 * 内存存储的船舶访问仓储实现
 */
class InMemoryVesselVisitRepository extends IVesselVisitRepository {
    constructor() {
        super();
        this.vesselVisits = new Map();
        this.eventStore = new Map(); // 事件存储
    }

    /**
     * 保存船舶访问
     */
    async save(vesselVisit) {
        try {
            // 保存聚合状态
            const dto = vesselVisit.toDTO();
            this.vesselVisits.set(vesselVisit.id, dto);

            // 保存领域事件
            const events = vesselVisit.getUncommittedEvents();
            if (events.length > 0) {
                const aggregateEvents = this.eventStore.get(vesselVisit.id) || [];
                aggregateEvents.push(...events);
                this.eventStore.set(vesselVisit.id, aggregateEvents);
                
                // 标记事件为已提交
                vesselVisit.markEventsAsCommitted();
                
                // 记录业务日志
                logger.business('船舶访问已保存', {
                    visitId: vesselVisit.id,
                    vesselId: vesselVisit.vesselId,
                    status: vesselVisit.status,
                    eventCount: events.length
                });
            }

            return vesselVisit;
        } catch (error) {
            logger.error('保存船舶访问失败', {
                visitId: vesselVisit.id,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 根据ID查找船舶访问
     */
    async findById(id) {
        try {
            const dto = this.vesselVisits.get(id);
            if (!dto) {
                throw new BusinessError(
                    `船舶访问不存在: ${id}`,
                    ERROR_CODES.VESSEL_VISIT_NOT_FOUND
                );
            }

            const { VesselVisit } = require('../domain/aggregates/VesselVisit');
            return VesselVisit.fromDTO(dto);
        } catch (error) {
            if (error instanceof BusinessError) {
                throw error;
            }
            logger.error('查找船舶访问失败', { visitId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 根据船舶ID查找访问记录
     */
    async findByVesselId(vesselId) {
        try {
            const visits = [];
            for (const [id, dto] of this.vesselVisits) {
                if (dto.vesselId === vesselId) {
                    const { VesselVisit } = require('../domain/aggregates/VesselVisit');
                    visits.push(VesselVisit.fromDTO(dto));
                }
            }
            return visits;
        } catch (error) {
            logger.error('根据船舶ID查找访问失败', { vesselId, error: error.message });
            throw error;
        }
    }

    /**
     * 根据状态查找船舶访问
     */
    async findByStatus(status) {
        try {
            const visits = [];
            for (const [id, dto] of this.vesselVisits) {
                if (dto.status === status) {
                    const { VesselVisit } = require('../domain/aggregates/VesselVisit');
                    visits.push(VesselVisit.fromDTO(dto));
                }
            }
            return visits;
        } catch (error) {
            logger.error('根据状态查找船舶访问失败', { status, error: error.message });
            throw error;
        }
    }

    /**
     * 查找所有船舶访问（支持分页和过滤）
     */
    async findAll(options = {}) {
        try {
            const {
                page = 1,
                pageSize = 10,
                status,
                vesselId,
                startDate,
                endDate
            } = options;

            let visits = [];
            
            // 转换为聚合对象
            for (const [id, dto] of this.vesselVisits) {
                const { VesselVisit } = require('../domain/aggregates/VesselVisit');
                visits.push(VesselVisit.fromDTO(dto));
            }

            // 应用过滤条件
            if (status) {
                visits = visits.filter(visit => visit.status === status);
            }

            if (vesselId) {
                visits = visits.filter(visit => visit.vesselId === vesselId);
            }

            if (startDate || endDate) {
                visits = visits.filter(visit => {
                    const visitDate = new Date(visit.visitDetails.eta);
                    const start = startDate ? new Date(startDate) : null;
                    const end = endDate ? new Date(endDate) : null;
                    
                    if (start && visitDate < start) return false;
                    if (end && visitDate > end) return false;
                    return true;
                });
            }

            // 排序（按创建时间倒序）
            visits.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

            // 分页
            const total = visits.length;
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            const paginatedVisits = visits.slice(startIndex, endIndex);

            return {
                visits: paginatedVisits,
                pagination: {
                    page,
                    pageSize,
                    total,
                    totalPages: Math.ceil(total / pageSize)
                }
            };
        } catch (error) {
            logger.error('查找所有船舶访问失败', { options, error: error.message });
            throw error;
        }
    }

    /**
     * 删除船舶访问
     */
    async delete(id) {
        try {
            const exists = this.vesselVisits.has(id);
            if (!exists) {
                throw new BusinessError(
                    `船舶访问不存在: ${id}`,
                    ERROR_CODES.VESSEL_VISIT_NOT_FOUND
                );
            }

            this.vesselVisits.delete(id);
            this.eventStore.delete(id);

            logger.business('船舶访问已删除', { visitId: id });
            return true;
        } catch (error) {
            if (error instanceof BusinessError) {
                throw error;
            }
            logger.error('删除船舶访问失败', { visitId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 获取事件历史
     */
    async getEventHistory(aggregateId) {
        try {
            const events = this.eventStore.get(aggregateId) || [];
            return events;
        } catch (error) {
            logger.error('获取事件历史失败', { aggregateId, error: error.message });
            throw error;
        }
    }

    /**
     * 检查船舶访问是否存在
     */
    async exists(id) {
        return this.vesselVisits.has(id);
    }

    /**
     * 获取统计信息
     */
    async getStatistics() {
        try {
            const visits = Array.from(this.vesselVisits.values());
            
            const stats = {
                total: visits.length,
                byStatus: {},
                byVessel: {},
                averageDuration: 0
            };

            let totalDuration = 0;
            let durationCount = 0;

            for (const visit of visits) {
                // 按状态统计
                stats.byStatus[visit.status] = (stats.byStatus[visit.status] || 0) + 1;
                
                // 按船舶统计
                stats.byVessel[visit.vesselId] = (stats.byVessel[visit.vesselId] || 0) + 1;
                
                // 计算平均持续时间
                const start = new Date(visit.visitDetails.eta);
                const end = new Date(visit.visitDetails.etd);
                const duration = Math.ceil((end - start) / (1000 * 60 * 60));
                totalDuration += duration;
                durationCount++;
            }

            if (durationCount > 0) {
                stats.averageDuration = Math.round(totalDuration / durationCount);
            }

            return stats;
        } catch (error) {
            logger.error('获取统计信息失败', { error: error.message });
            throw error;
        }
    }
}

module.exports = {
    IVesselVisitRepository,
    InMemoryVesselVisitRepository
}; 