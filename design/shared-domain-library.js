/**
 * TOS共享领域库
 * 前后端通用的领域模型、验证规则和工具函数
 * 减少代码重复，确保业务逻辑一致性
 */

// ==================== 共享常量定义 ====================

/**
 * 业务状态常量
 */
export const BUSINESS_STATUS = {
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

/**
 * 业务类型常量
 */
export const BUSINESS_TYPES = {
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

// ==================== 共享值对象 ====================

/**
 * 集装箱号值对象
 */
export class ContainerNumber extends String {
    constructor(value) {
        super(value);
        this.validate();
    }

    validate() {
        const pattern = /^[A-Z]{4}[0-9]{7}$/;
        if (!pattern.test(this)) {
            throw new Error('集装箱号格式不正确');
        }
    }

    getCheckDigit() {
        const weights = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512];
        let sum = 0;
        
        for (let i = 0; i < 10; i++) {
            const char = this[i];
            const value = char >= 'A' && char <= 'Z' ? char.charCodeAt(0) - 55 : parseInt(char);
            sum += value * weights[i];
        }
        
        return sum % 11;
    }

    equals(other) {
        return this.toString() === other.toString();
    }
}

/**
 * 船舶IMO号值对象
 */
export class IMONumber extends String {
    constructor(value) {
        super(value);
        this.validate();
    }

    validate() {
        const pattern = /^IMO[0-9]{7}$/;
        if (!pattern.test(this)) {
            throw new Error('IMO号格式不正确');
        }
    }

    equals(other) {
        return this.toString() === other.toString();
    }
}

/**
 * 位置坐标值对象
 */
export class Position extends Object {
    constructor(bay, row, tier) {
        super();
        this.bay = parseInt(bay);
        this.row = parseInt(row);
        this.tier = parseInt(tier);
        this.validate();
    }

    validate() {
        if (this.bay < 1 || this.row < 1 || this.tier < 1) {
            throw new Error('位置坐标必须为正整数');
        }
    }

    equals(other) {
        return this.bay === other.bay && this.row === other.row && this.tier === other.tier;
    }

    toString() {
        return `${this.bay.toString().padStart(2, '0')}${this.row.toString().padStart(2, '0')}${this.tier.toString().padStart(2, '0')}`;
    }

    static fromString(positionString) {
        const bay = parseInt(positionString.substring(0, 2));
        const row = parseInt(positionString.substring(2, 4));
        const tier = parseInt(positionString.substring(4, 6));
        return new Position(bay, row, tier);
    }
}

// ==================== 共享验证规则 ====================

/**
 * 业务验证规则
 */
export class BusinessValidator {
    /**
     * 验证船舶访问详情
     */
    static validateVesselVisitDetails(details) {
        const errors = [];
        
        if (!details.eta || !(details.eta instanceof Date)) {
            errors.push('预计到港时间不能为空且必须是有效日期');
        }
        
        if (!details.etd || !(details.etd instanceof Date)) {
            errors.push('预计离港时间不能为空且必须是有效日期');
        }
        
        if (details.eta >= details.etd) {
            errors.push('预计到港时间必须早于预计离港时间');
        }
        
        if (!details.berthId) {
            errors.push('泊位ID不能为空');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证积载计划数据
     */
    static validateStowagePlanData(containerPositions, groupCodes) {
        const errors = [];
        
        if (!Array.isArray(containerPositions) || containerPositions.length === 0) {
            errors.push('集装箱位置数据不能为空');
        }
        
        if (!Array.isArray(groupCodes) || groupCodes.length === 0) {
            errors.push('组代码数据不能为空');
        }
        
        // 验证集装箱位置格式
        containerPositions.forEach((pos, index) => {
            try {
                new Position(pos.bay, pos.row, pos.tier);
            } catch (error) {
                errors.push(`第${index + 1}个集装箱位置格式错误: ${error.message}`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 验证作业指令数据
     */
    static validateWorkInstructionData(instructionType, plannedMoves) {
        const errors = [];
        
        if (!Object.values(BUSINESS_TYPES.WORK_INSTRUCTION).includes(instructionType)) {
            errors.push('作业指令类型不正确');
        }
        
        if (!Array.isArray(plannedMoves) || plannedMoves.length === 0) {
            errors.push('计划移动数据不能为空');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

// ==================== 共享业务计算 ====================

/**
 * 业务计算工具
 */
export class BusinessCalculator {
    /**
     * 计算船舶访问时长（小时）
     */
    static calculateVisitDuration(eta, etd) {
        return Math.ceil((etd - eta) / (1000 * 60 * 60));
    }

    /**
     * 计算积载计划效率
     */
    static calculateStowageEfficiency(containerPositions, groupCodes) {
        const totalContainers = containerPositions.length;
        const groupedContainers = groupCodes.reduce((acc, group) => {
            acc[group.code] = (acc[group.code] || 0) + group.containerCount;
            return acc;
        }, {});
        
        const groupedCount = Object.values(groupedContainers).reduce((sum, count) => sum + count, 0);
        return totalContainers > 0 ? (groupedCount / totalContainers) * 100 : 0;
    }

    /**
     * 计算作业指令优先级
     */
    static calculateWorkPriority(instructionType, containerCount, urgency) {
        let basePriority = 1;
        
        // 根据指令类型调整优先级
        switch (instructionType) {
            case BUSINESS_TYPES.WORK_INSTRUCTION.DISCHARGE:
                basePriority = 3;
                break;
            case BUSINESS_TYPES.WORK_INSTRUCTION.LOAD:
                basePriority = 2;
                break;
            case BUSINESS_TYPES.WORK_INSTRUCTION.SHIFT:
                basePriority = 1;
                break;
        }
        
        // 根据集装箱数量调整
        const containerFactor = Math.min(containerCount / 100, 2);
        
        // 根据紧急程度调整
        const urgencyFactor = urgency || 1;
        
        return Math.round(basePriority * containerFactor * urgencyFactor);
    }
}

// ==================== 共享数据转换 ====================

/**
 * 数据转换工具
 */
export class DataTransformer {
    /**
     * 将领域对象转换为DTO
     */
    static toDTO(domainObject) {
        if (!domainObject) return null;
        
        const dto = { ...domainObject };
        
        // 处理日期
        if (dto.createdAt) dto.createdAt = dto.createdAt.toISOString();
        if (dto.updatedAt) dto.updatedAt = dto.updatedAt.toISOString();
        
        // 处理值对象
        if (dto.containerNumber instanceof ContainerNumber) {
            dto.containerNumber = dto.containerNumber.toString();
        }
        
        if (dto.imoNumber instanceof IMONumber) {
            dto.imoNumber = dto.imoNumber.toString();
        }
        
        if (dto.position instanceof Position) {
            dto.position = dto.position.toString();
        }
        
        return dto;
    }

    /**
     * 将DTO转换为领域对象
     */
    static fromDTO(dto, domainClass) {
        if (!dto) return null;
        
        const domainData = { ...dto };
        
        // 处理日期
        if (domainData.createdAt) domainData.createdAt = new Date(domainData.createdAt);
        if (domainData.updatedAt) domainData.updatedAt = new Date(domainData.updatedAt);
        
        // 处理值对象
        if (domainData.containerNumber) {
            domainData.containerNumber = new ContainerNumber(domainData.containerNumber);
        }
        
        if (domainData.imoNumber) {
            domainData.imoNumber = new IMONumber(domainData.imoNumber);
        }
        
        if (domainData.position) {
            domainData.position = Position.fromString(domainData.position);
        }
        
        return new domainClass(domainData);
    }

    /**
     * 批量转换
     */
    static batchToDTO(domainObjects) {
        return domainObjects.map(obj => this.toDTO(obj));
    }

    static batchFromDTO(dtos, domainClass) {
        return dtos.map(dto => this.fromDTO(dto, domainClass));
    }
}

// ==================== 共享错误处理 ====================

/**
 * 业务错误类
 */
export class BusinessError extends Error {
    constructor(message, code, details = {}) {
        super(message);
        this.name = 'BusinessError';
        this.code = code;
        this.details = details;
    }
}

/**
 * 验证错误类
 */
export class ValidationError extends BusinessError {
    constructor(message, field, value) {
        super(message, 'VALIDATION_ERROR', { field, value });
        this.name = 'ValidationError';
        this.field = field;
        this.value = value;
    }
}

/**
 * 错误处理工具
 */
export class ErrorHandler {
    /**
     * 统一错误处理
     */
    static handleError(error, context = '') {
        const errorInfo = {
            message: error.message,
            code: error.code || 'UNKNOWN_ERROR',
            context,
            timestamp: new Date().toISOString(),
            stack: error.stack
        };
        
        // 在开发环境下记录详细错误信息
        if (process.env.NODE_ENV === 'development') {
            console.error('Business Error:', errorInfo);
        }
        
        return errorInfo;
    }

    /**
     * 验证错误收集
     */
    static collectValidationErrors(validationResult) {
        return validationResult.errors.map(error => 
            new ValidationError(error, 'validation', null)
        );
    }
}

// ==================== 共享配置 ====================

/**
 * 业务配置
 */
export const BUSINESS_CONFIG = {
    // 分页配置
    PAGINATION: {
        DEFAULT_PAGE_SIZE: 20,
        MAX_PAGE_SIZE: 100
    },
    
    // 缓存配置
    CACHE: {
        DEFAULT_TTL: 300, // 5分钟
        LONG_TTL: 3600    // 1小时
    },
    
    // 业务限制
    LIMITS: {
        MAX_CONTAINERS_PER_VESSEL: 10000,
        MAX_WORK_INSTRUCTIONS_PER_VISIT: 100,
        MAX_CRANE_WORKSHIFTS_PER_DAY: 24
    }
};

// ==================== 导出模块 ====================

export default {
    BUSINESS_STATUS,
    BUSINESS_TYPES,
    ContainerNumber,
    IMONumber,
    Position,
    BusinessValidator,
    BusinessCalculator,
    DataTransformer,
    BusinessError,
    ValidationError,
    ErrorHandler,
    BUSINESS_CONFIG
}; 