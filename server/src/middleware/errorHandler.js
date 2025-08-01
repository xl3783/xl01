/**
 * TOS错误处理中间件
 * 统一处理应用错误和异常
 */

const { logger } = require('../utils/logger');
const { ApiResponse, ERROR_CODES } = require('../shared/apiContracts');

/**
 * 业务错误类
 */
class BusinessError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'BusinessError';
        this.code = code;
        this.details = details;
        this.timestamp = new Date();
    }
}

/**
 * 验证错误类
 */
class ValidationError extends BusinessError {
    constructor(message, field, value) {
        super(message, ERROR_CODES.VALIDATION_ERROR, { field, value });
        this.name = 'ValidationError';
    }
}

/**
 * 全局错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
    // 记录错误日志
    logger.error('应用错误', {
        error: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    // 业务错误处理
    if (err instanceof BusinessError) {
        return res.status(400).json(ApiResponse.error(err.message, err.code, err.details));
    }

    // 验证错误处理
    if (err instanceof ValidationError) {
        return res.status(400).json(ApiResponse.validationError(err.details, err.message));
    }

    // Joi验证错误
    if (err.isJoi) {
        const errors = err.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
            value: detail.context?.value
        }));
        return res.status(400).json(ApiResponse.validationError(errors, '数据验证失败'));
    }

    // 数据库错误处理
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json(ApiResponse.error('数据已存在', ERROR_CODES.CONFLICT));
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json(ApiResponse.error('关联数据不存在', ERROR_CODES.VALIDATION_ERROR));
    }

    // 默认错误处理
    const statusCode = err.statusCode || 500;
    const message = process.env.NODE_ENV === 'production' 
        ? '服务器内部错误' 
        : err.message;

    res.status(statusCode).json(ApiResponse.error(message, ERROR_CODES.UNKNOWN_ERROR));
};

/**
 * 异步错误包装器
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * 404错误处理
 */
const notFoundHandler = (req, res) => {
    res.status(404).json(ApiResponse.notFound('请求的资源不存在'));
};

module.exports = {
    errorHandler,
    asyncHandler,
    notFoundHandler,
    BusinessError,
    ValidationError
}; 