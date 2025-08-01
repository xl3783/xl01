/**
 * TOS日志工具
 * 基于Winston的结构化日志记录
 */

const winston = require('winston');
const path = require('path');

// 日志格式配置
const logFormat = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
);

// 控制台格式
const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
            msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
    })
);

// 创建logger实例
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: logFormat,
    defaultMeta: { service: 'tos-server' },
    transports: [
        // 错误日志文件
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/error.log'),
            level: 'error',
            maxsize: 5242880, // 5MB
            maxFiles: 5
        }),
        
        // 所有日志文件
        new winston.transports.File({
            filename: path.join(__dirname, '../../logs/combined.log'),
            maxsize: 5242880, // 5MB
            maxFiles: 5
        })
    ]
});

// 开发环境添加控制台输出
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: consoleFormat
    }));
}

// 业务日志方法
logger.business = (message, data = {}) => {
    logger.info(message, { ...data, type: 'business' });
};

logger.operation = (message, data = {}) => {
    logger.info(message, { ...data, type: 'operation' });
};

logger.security = (message, data = {}) => {
    logger.warn(message, { ...data, type: 'security' });
};

logger.performance = (message, data = {}) => {
    logger.info(message, { ...data, type: 'performance' });
};

module.exports = { logger }; 