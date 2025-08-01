/**
 * 船舶访问应用服务
 * 编排领域对象和外部服务，实现业务用例
 */

const { logger } = require('../utils/logger');
const { BusinessError } = require('../middleware/errorHandler');
const { VesselVisit, VesselVisitFactory } = require('../domain/aggregates/VesselVisit');
const { InMemoryVesselVisitRepository } = require('../repositories/VesselVisitRepository');
const { ApiResponse, PaginatedResponse, ERROR_CODES } = require('../shared/apiContracts');

/**
 * 船舶访问应用服务
 */
class VesselVisitService {
    constructor() {
        this.repository = new InMemoryVesselVisitRepository();
    }

    /**
     * 创建船舶访问
     */
    async createVesselVisit(vesselId, visitDetails) {
        try {
            logger.business('开始创建船舶访问', { vesselId, visitDetails });

            // 验证输入数据
            this.validateVisitDetails(visitDetails);

            // 检查时间冲突
            const existingVisits = await this.repository.findByVesselId(vesselId);
            VesselVisit.validateTimeConflict(visitDetails.eta, visitDetails.etd, existingVisits);

            // 创建船舶访问聚合
            const vesselVisit = VesselVisitFactory.create(vesselId, visitDetails);

            // 保存到仓储
            await this.repository.save(vesselVisit);

            logger.business('船舶访问创建成功', {
                visitId: vesselVisit.id,
                vesselId: vesselVisit.vesselId,
                status: vesselVisit.status
            });

            return ApiResponse.success(vesselVisit.toDTO(), '船舶访问创建成功');
        } catch (error) {
            logger.error('创建船舶访问失败', {
                vesselId,
                visitDetails,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 获取船舶访问详情
     */
    async getVesselVisit(id) {
        try {
            logger.operation('获取船舶访问详情', { visitId: id });

            const vesselVisit = await this.repository.findById(id);
            
            return ApiResponse.success(vesselVisit.toDTO(), '获取船舶访问详情成功');
        } catch (error) {
            logger.error('获取船舶访问详情失败', { visitId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 获取船舶访问列表
     */
    async getVesselVisits(options = {}) {
        try {
            logger.operation('获取船舶访问列表', { options });

            const result = await this.repository.findAll(options);
            
            return new PaginatedResponse(
                result.visits.map(visit => visit.toDTO()),
                result.pagination
            );
        } catch (error) {
            logger.error('获取船舶访问列表失败', { options, error: error.message });
            throw error;
        }
    }

    /**
     * 开始船舶访问
     */
    async startVesselVisit(id) {
        try {
            logger.business('开始船舶访问', { visitId: id });

            const vesselVisit = await this.repository.findById(id);
            vesselVisit.startVisit();
            await this.repository.save(vesselVisit);

            logger.business('船舶访问已开始', {
                visitId: vesselVisit.id,
                vesselId: vesselVisit.vesselId,
                status: vesselVisit.status
            });

            return ApiResponse.success(vesselVisit.toDTO(), '船舶访问已开始');
        } catch (error) {
            logger.error('开始船舶访问失败', { visitId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 完成船舶访问
     */
    async completeVesselVisit(id) {
        try {
            logger.business('完成船舶访问', { visitId: id });

            const vesselVisit = await this.repository.findById(id);
            vesselVisit.completeVisit();
            await this.repository.save(vesselVisit);

            logger.business('船舶访问已完成', {
                visitId: vesselVisit.id,
                vesselId: vesselVisit.vesselId,
                status: vesselVisit.status
            });

            return ApiResponse.success(vesselVisit.toDTO(), '船舶访问已完成');
        } catch (error) {
            logger.error('完成船舶访问失败', { visitId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 取消船舶访问
     */
    async cancelVesselVisit(id, reason) {
        try {
            logger.business('取消船舶访问', { visitId: id, reason });

            const vesselVisit = await this.repository.findById(id);
            vesselVisit.cancelVisit(reason);
            await this.repository.save(vesselVisit);

            logger.business('船舶访问已取消', {
                visitId: vesselVisit.id,
                vesselId: vesselVisit.vesselId,
                status: vesselVisit.status,
                reason
            });

            return ApiResponse.success(vesselVisit.toDTO(), '船舶访问已取消');
        } catch (error) {
            logger.error('取消船舶访问失败', { visitId: id, reason, error: error.message });
            throw error;
        }
    }

    /**
     * 更新船舶访问详情
     */
    async updateVesselVisit(id, newDetails) {
        try {
            logger.business('更新船舶访问详情', { visitId: id, newDetails });

            const vesselVisit = await this.repository.findById(id);
            vesselVisit.updateVisitDetails(newDetails);
            await this.repository.save(vesselVisit);

            logger.business('船舶访问详情已更新', {
                visitId: vesselVisit.id,
                vesselId: vesselVisit.vesselId,
                updatedDetails: newDetails
            });

            return ApiResponse.success(vesselVisit.toDTO(), '船舶访问详情已更新');
        } catch (error) {
            logger.error('更新船舶访问详情失败', { visitId: id, newDetails, error: error.message });
            throw error;
        }
    }

    /**
     * 删除船舶访问
     */
    async deleteVesselVisit(id) {
        try {
            logger.business('删除船舶访问', { visitId: id });

            await this.repository.delete(id);

            logger.business('船舶访问已删除', { visitId: id });

            return ApiResponse.success(null, '船舶访问已删除');
        } catch (error) {
            logger.error('删除船舶访问失败', { visitId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 获取船舶访问统计信息
     */
    async getVesselVisitStatistics() {
        try {
            logger.operation('获取船舶访问统计信息');

            const statistics = await this.repository.getStatistics();

            return ApiResponse.success(statistics, '获取统计信息成功');
        } catch (error) {
            logger.error('获取统计信息失败', { error: error.message });
            throw error;
        }
    }

    /**
     * 获取船舶访问事件历史
     */
    async getVesselVisitEventHistory(id) {
        try {
            logger.operation('获取船舶访问事件历史', { visitId: id });

            const events = await this.repository.getEventHistory(id);

            return ApiResponse.success(events, '获取事件历史成功');
        } catch (error) {
            logger.error('获取事件历史失败', { visitId: id, error: error.message });
            throw error;
        }
    }

    /**
     * 验证访问详情
     */
    validateVisitDetails(visitDetails) {
        const { eta, etd, berthId } = visitDetails;

        if (!eta || !etd || !berthId) {
            throw new BusinessError(
                '访问详情不完整，必须包含ETA、ETD和泊位ID',
                ERROR_CODES.VALIDATION_ERROR
            );
        }

        const etaDate = new Date(eta);
        const etdDate = new Date(etd);

        if (isNaN(etaDate.getTime()) || isNaN(etdDate.getTime())) {
            throw new BusinessError(
                'ETA或ETD日期格式不正确',
                ERROR_CODES.VALIDATION_ERROR
            );
        }

        if (etaDate >= etdDate) {
            throw new BusinessError(
                'ETA必须早于ETD',
                ERROR_CODES.VALIDATION_ERROR
            );
        }

        if (etaDate < new Date()) {
            throw new BusinessError(
                'ETA不能早于当前时间',
                ERROR_CODES.VALIDATION_ERROR
            );
        }
    }

    /**
     * 批量创建船舶访问
     */
    async batchCreateVesselVisits(vesselVisitsData) {
        try {
            logger.business('批量创建船舶访问', { count: vesselVisitsData.length });

            const results = [];
            const errors = [];

            for (const data of vesselVisitsData) {
                try {
                    const result = await this.createVesselVisit(data.vesselId, data.visitDetails);
                    results.push(result.data);
                } catch (error) {
                    errors.push({
                        vesselId: data.vesselId,
                        error: error.message
                    });
                }
            }

            const response = {
                success: results.length,
                failed: errors.length,
                results,
                errors
            };

            logger.business('批量创建船舶访问完成', response);

            return ApiResponse.success(response, '批量创建船舶访问完成');
        } catch (error) {
            logger.error('批量创建船舶访问失败', { error: error.message });
            throw error;
        }
    }
}

module.exports = VesselVisitService; 