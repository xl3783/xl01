/**
 * 作业指令路由
 * 处理作业指令相关的HTTP请求
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

// 临时占位路由
router.get('/', asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: '作业指令功能开发中',
        data: []
    });
}));

module.exports = router; 