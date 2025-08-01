/**
 * 起重机计划路由
 * 处理起重机计划相关的HTTP请求
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

// 临时占位路由
router.get('/', asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: '起重机计划功能开发中',
        data: []
    });
}));

module.exports = router; 