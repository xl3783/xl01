/**
 * TOS共享API契约
 * 前后端通用的API接口定义、请求响应格式和错误码
 */

// ==================== 通用响应格式 ====================

/**
 * 标准API响应格式
 */
class ApiResponse {
    constructor(success, data = null, message = '', code = 'SUCCESS') {
        this.success = success;
        this.data = data;
        this.message = message;
        this.code = code;
        this.timestamp = new Date().toISOString();
    }

    static success(data, message = '操作成功') {
        return new ApiResponse(true, data, message, 'SUCCESS');
    }

    static error(message, code = 'ERROR', data = null) {
        return new ApiResponse(false, data, message, code);
    }

    static validationError(errors, message = '数据验证失败') {
        return new ApiResponse(false, { errors }, message, 'VALIDATION_ERROR');
    }

    static notFound(message = '资源不存在') {
        return new ApiResponse(false, null, message, 'NOT_FOUND');
    }

    static unauthorized(message = '未授权访问') {
        return new ApiResponse(false, null, message, 'UNAUTHORIZED');
    }

    static forbidden(message = '禁止访问') {
        return new ApiResponse(false, null, message, 'FORBIDDEN');
    }
}

/**
 * 分页响应格式
 */
class PaginatedResponse extends ApiResponse {
    constructor(data, pagination) {
        super(true, data, '查询成功');
        this.pagination = {
            page: pagination.page,
            pageSize: pagination.pageSize,
            total: pagination.total,
            totalPages: Math.ceil(pagination.total / pagination.pageSize)
        };
    }
}

// ==================== 错误码定义 ====================

const ERROR_CODES = {
    // 通用错误
    SUCCESS: 'SUCCESS',
    UNKNOWN_ERROR: 'UNKNOWN_ERROR',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    CONFLICT: 'CONFLICT',
    
    // 船舶访问相关错误
    VESSEL_VISIT_NOT_FOUND: 'VESSEL_VISIT_NOT_FOUND',
    VESSEL_VISIT_ALREADY_EXISTS: 'VESSEL_VISIT_ALREADY_EXISTS',
    VESSEL_VISIT_STATUS_INVALID: 'VESSEL_VISIT_STATUS_INVALID',
    VESSEL_VISIT_TIME_CONFLICT: 'VESSEL_VISIT_TIME_CONFLICT',
    
    // 积载计划相关错误
    STOWAGE_PLAN_NOT_FOUND: 'STOWAGE_PLAN_NOT_FOUND',
    STOWAGE_PLAN_INVALID_FORMAT: 'STOWAGE_PLAN_INVALID_FORMAT',
    STOWAGE_PLAN_POSITION_CONFLICT: 'STOWAGE_PLAN_POSITION_CONFLICT',
    
    // 作业指令相关错误
    WORK_INSTRUCTION_NOT_FOUND: 'WORK_INSTRUCTION_NOT_FOUND',
    WORK_INSTRUCTION_STATUS_INVALID: 'WORK_INSTRUCTION_STATUS_INVALID',
    WORK_INSTRUCTION_EXECUTION_FAILED: 'WORK_INSTRUCTION_EXECUTION_FAILED',
    
    // 集装箱相关错误
    CONTAINER_NOT_FOUND: 'CONTAINER_NOT_FOUND',
    CONTAINER_NUMBER_INVALID: 'CONTAINER_NUMBER_INVALID',
    CONTAINER_POSITION_OCCUPIED: 'CONTAINER_POSITION_OCCUPIED',
    
    // 设备相关错误
    CRANE_NOT_AVAILABLE: 'CRANE_NOT_AVAILABLE',
    CRANE_MAINTENANCE: 'CRANE_MAINTENANCE',
    CRANE_OVERLOAD: 'CRANE_OVERLOAD'
};

// ==================== 业务状态常量 ====================

const BUSINESS_STATUS = {
    // 船舶访问状态
    VESSEL_VISIT: {
        PLANNED: 'PLANNED',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED'
    },
    
    // 集装箱状态
    CONTAINER: {
        AVAILABLE: 'AVAILABLE',
        ALLOCATED: 'ALLOCATED',
        IN_TRANSIT: 'IN_TRANSIT',
        COMPLETED: 'COMPLETED'
    },
    
    // 作业指令状态
    WORK_INSTRUCTION: {
        DRAFT: 'DRAFT',
        ISSUED: 'ISSUED',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        CANCELLED: 'CANCELLED'
    }
};

// ==================== 业务类型常量 ====================

const BUSINESS_TYPES = {
    // 积载计划类型
    STOWAGE_PLAN: {
        IMPORT: 'IMPORT',
        EXPORT: 'EXPORT',
        TRANSIT: 'TRANSIT'
    },
    
    // 作业指令类型
    WORK_INSTRUCTION: {
        LOAD: 'LOAD',
        DISCHARGE: 'DISCHARGE',
        SHIFT: 'SHIFT'
    }
};

// ==================== 验证模式 ====================

const VALIDATION_SCHEMAS = {
    // 船舶访问创建验证
    VESSEL_VISIT_CREATE: {
        vesselId: { type: 'string', required: true, minLength: 1 },
        visitDetails: {
            eta: { type: 'date', required: true },
            etd: { type: 'date', required: true },
            berthId: { type: 'string', required: true },
            agent: { type: 'string', required: false },
            remarks: { type: 'string', required: false, maxLength: 500 }
        }
    },

    // 积载计划导入验证
    STOWAGE_PLAN_IMPORT: {
        vesselVisitId: { type: 'string', required: true },
        planType: { type: 'enum', values: Object.values(BUSINESS_TYPES.STOWAGE_PLAN), required: true },
        containerPositions: { type: 'array', required: true, minLength: 1 },
        groupCodes: { type: 'array', required: true, minLength: 1 }
    },

    // 作业指令创建验证
    WORK_INSTRUCTION_CREATE: {
        vesselVisitId: { type: 'string', required: true },
        instructionType: { type: 'enum', values: Object.values(BUSINESS_TYPES.WORK_INSTRUCTION), required: true },
        plannedMoves: { type: 'array', required: true, minLength: 1 },
        priority: { type: 'number', required: false, min: 1, max: 10 },
        remarks: { type: 'string', required: false, maxLength: 500 }
    }
};

// ==================== WebSocket事件定义 ====================

const WEBSOCKET_EVENTS = {
    // 船舶访问事件
    VESSEL_VISIT_CREATED: 'vessel_visit_created',
    VESSEL_VISIT_STARTED: 'vessel_visit_started',
    VESSEL_VISIT_COMPLETED: 'vessel_visit_completed',
    VESSEL_VISIT_UPDATED: 'vessel_visit_updated',
    
    // 积载计划事件
    STOWAGE_PLAN_IMPORTED: 'stowage_plan_imported',
    STOWAGE_PLAN_MODIFIED: 'stowage_plan_modified',
    STOWAGE_ERROR_DETECTED: 'stowage_error_detected',
    
    // 作业指令事件
    WORK_INSTRUCTION_CREATED: 'work_instruction_created',
    WORK_INSTRUCTION_ISSUED: 'work_instruction_issued',
    WORK_INSTRUCTION_STARTED: 'work_instruction_started',
    WORK_INSTRUCTION_COMPLETED: 'work_instruction_completed',
    
    // 集装箱事件
    CONTAINER_MOVE_STARTED: 'container_move_started',
    CONTAINER_MOVE_COMPLETED: 'container_move_completed',
    CONTAINER_STATUS_UPDATED: 'container_status_updated'
};

module.exports = {
    ApiResponse,
    PaginatedResponse,
    ERROR_CODES,
    BUSINESS_STATUS,
    BUSINESS_TYPES,
    VALIDATION_SCHEMAS,
    WEBSOCKET_EVENTS
}; 