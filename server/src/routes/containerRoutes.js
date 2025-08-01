/**
 * 集装箱路由
 * 处理集装箱相关的HTTP请求
 */

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { logger } = require('../utils/logger');

const router = express.Router();

// 临时占位路由
router.get('/', asyncHandler(async (req, res) => {
    res.json({
        success: true,
        message: '集装箱功能开发中',
        data: []
    });
}));

module.exports = router; 