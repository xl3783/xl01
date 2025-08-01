/**
 * TOS Express 应用主入口
 * 基于领域驱动设计的港口业务系统后端
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { logger } = require('./utils/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { ApiResponse } = require('./shared/apiContracts');

// 路由导入
const vesselVisitRoutes = require('./routes/vesselVisitRoutes');
const stowagePlanRoutes = require('./routes/stowagePlanRoutes');
const workInstructionRoutes = require('./routes/workInstructionRoutes');
const cranePlanRoutes = require('./routes/cranePlanRoutes');
const containerRoutes = require('./routes/containerRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 中间件配置 ====================

// 安全中间件
app.use(helmet());

// CORS配置
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true
}));

// 请求限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: ApiResponse.error('请求过于频繁，请稍后再试', 'RATE_LIMIT_EXCEEDED')
});
app.use('/api/', limiter);

// 压缩响应
app.use(compression());

// 日志中间件
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// 解析请求体
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== 路由配置 ====================

// 健康检查
app.get('/health', (req, res) => {
    res.json(ApiResponse.success({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0'
    }));
});

// API路由
app.use('/api/vessel-visits', vesselVisitRoutes);
app.use('/api/stowage-plans', stowagePlanRoutes);
app.use('/api/work-instructions', workInstructionRoutes);
app.use('/api/crane-plans', cranePlanRoutes);
app.use('/api/containers', containerRoutes);

// 404处理
app.use('*', (req, res) => {
    res.status(404).json(ApiResponse.notFound('请求的资源不存在'));
});

// 错误处理中间件
app.use(errorHandler);

// ==================== 应用启动 ====================

const server = app.listen(PORT, () => {
    logger.info(`TOS服务器启动成功，端口: ${PORT}`);
    logger.info(`环境: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
    logger.info('收到SIGTERM信号，开始优雅关闭...');
    server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    logger.info('收到SIGINT信号，开始优雅关闭...');
    server.close(() => {
        logger.info('服务器已关闭');
        process.exit(0);
    });
});

module.exports = app; 