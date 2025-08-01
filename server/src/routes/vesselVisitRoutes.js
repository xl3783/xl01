/**
 * 船舶访问路由
 * 处理船舶访问相关的HTTP请求
 */

const express = require('express');
const Joi = require('joi');
const { asyncHandler } = require('../middleware/errorHandler');
const VesselVisitService = require('../services/VesselVisitService');
const { logger } = require('../utils/logger');

const router = express.Router();
const vesselVisitService = new VesselVisitService();

// ==================== 验证模式 ====================

const createVesselVisitSchema = Joi.object({
    vesselId: Joi.string().required().min(1).max(50),
    visitDetails: Joi.object({
        eta: Joi.date().iso().required(),
        etd: Joi.date().iso().required(),
        berthId: Joi.string().required().min(1).max(50),
        agent: Joi.string().optional().max(100),
        remarks: Joi.string().optional().max(500)
    }).required()
});

const updateVesselVisitSchema = Joi.object({
    visitDetails: Joi.object({
        eta: Joi.date().iso().optional(),
        etd: Joi.date().iso().optional(),
        berthId: Joi.string().optional().min(1).max(50),
        agent: Joi.string().optional().max(100),
        remarks: Joi.string().optional().max(500)
    }).required()
});

const listVesselVisitsSchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    pageSize: Joi.number().integer().min(1).max(100).default(10),
    status: Joi.string().valid('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED').optional(),
    vesselId: Joi.string().optional(),
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional()
});

// ==================== 路由处理 ====================

/**
 * 创建船舶访问
 * POST /api/vessel-visits
 */
router.post('/', asyncHandler(async (req, res) => {
    logger.operation('创建船舶访问请求', { body: req.body });

    // 验证请求数据
    const { error, value } = createVesselVisitSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            code: 'VALIDATION_ERROR',
            data: { errors: error.details }
        });
    }

    const { vesselId, visitDetails } = value;
    const result = await vesselVisitService.createVesselVisit(vesselId, visitDetails);
    
    res.status(201).json(result);
}));

/**
 * 获取船舶访问列表
 * GET /api/vessel-visits
 */
router.get('/', asyncHandler(async (req, res) => {
    logger.operation('获取船舶访问列表请求', { query: req.query });

    // 验证查询参数
    const { error, value } = listVesselVisitsSchema.validate(req.query);
    if (error) {
        return res.status(400).json({
            success: false,
            message: '查询参数验证失败',
            code: 'VALIDATION_ERROR',
            data: { errors: error.details }
        });
    }

    const result = await vesselVisitService.getVesselVisits(value);
    res.json(result);
}));

/**
 * 获取船舶访问统计信息
 * GET /api/vessel-visits/statistics
 */
router.get('/statistics', asyncHandler(async (req, res) => {
    logger.operation('获取船舶访问统计信息请求');

    const result = await vesselVisitService.getVesselVisitStatistics();
    res.json(result);
}));

/**
 * 获取船舶访问详情
 * GET /api/vessel-visits/:id
 */
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.operation('获取船舶访问详情请求', { visitId: id });

    const result = await vesselVisitService.getVesselVisit(id);
    res.json(result);
}));

/**
 * 更新船舶访问
 * PUT /api/vessel-visits/:id
 */
router.put('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.operation('更新船舶访问请求', { visitId: id, body: req.body });

    // 验证请求数据
    const { error, value } = updateVesselVisitSchema.validate(req.body);
    if (error) {
        return res.status(400).json({
            success: false,
            message: '数据验证失败',
            code: 'VALIDATION_ERROR',
            data: { errors: error.details }
        });
    }

    const result = await vesselVisitService.updateVesselVisit(id, value.visitDetails);
    res.json(result);
}));

/**
 * 删除船舶访问
 * DELETE /api/vessel-visits/:id
 */
router.delete('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.operation('删除船舶访问请求', { visitId: id });

    const result = await vesselVisitService.deleteVesselVisit(id);
    res.json(result);
}));

/**
 * 开始船舶访问
 * POST /api/vessel-visits/:id/start
 */
router.post('/:id/start', asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.operation('开始船舶访问请求', { visitId: id });

    const result = await vesselVisitService.startVesselVisit(id);
    res.json(result);
}));

/**
 * 完成船舶访问
 * POST /api/vessel-visits/:id/complete
 */
router.post('/:id/complete', asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.operation('完成船舶访问请求', { visitId: id });

    const result = await vesselVisitService.completeVesselVisit(id);
    res.json(result);
}));

/**
 * 取消船舶访问
 * POST /api/vessel-visits/:id/cancel
 */
router.post('/:id/cancel', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;
    logger.operation('取消船舶访问请求', { visitId: id, reason });

    if (!reason) {
        return res.status(400).json({
            success: false,
            message: '取消原因不能为空',
            code: 'VALIDATION_ERROR'
        });
    }

    const result = await vesselVisitService.cancelVesselVisit(id, reason);
    res.json(result);
}));

/**
 * 获取船舶访问事件历史
 * GET /api/vessel-visits/:id/events
 */
router.get('/:id/events', asyncHandler(async (req, res) => {
    const { id } = req.params;
    logger.operation('获取船舶访问事件历史请求', { visitId: id });

    const result = await vesselVisitService.getVesselVisitEventHistory(id);
    res.json(result);
}));

/**
 * 批量创建船舶访问
 * POST /api/vessel-visits/batch
 */
router.post('/batch', asyncHandler(async (req, res) => {
    logger.operation('批量创建船舶访问请求', { count: req.body.length });

    if (!Array.isArray(req.body) || req.body.length === 0) {
        return res.status(400).json({
            success: false,
            message: '请求体必须是包含船舶访问数据的数组',
            code: 'VALIDATION_ERROR'
        });
    }

    // 验证每个船舶访问数据
    const validData = [];
    const invalidData = [];

    for (const item of req.body) {
        const { error, value } = createVesselVisitSchema.validate(item);
        if (error) {
            invalidData.push({
                data: item,
                errors: error.details
            });
        } else {
            validData.push(value);
        }
    }

    if (invalidData.length > 0) {
        return res.status(400).json({
            success: false,
            message: '部分数据验证失败',
            code: 'VALIDATION_ERROR',
            data: { invalidData }
        });
    }

    const result = await vesselVisitService.batchCreateVesselVisits(validData);
    res.status(201).json(result);
}));

module.exports = router; 