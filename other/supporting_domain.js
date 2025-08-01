/**
 * TOS港口操作系统 - 支撑领域模型设计
 * 实现支撑领域的DDD战术设计（聚合根和实体）
 */

// ==================== 堆场管理上下文 ====================

/**
 * 堆场区域实体
 */
class YardArea {
    constructor(id, name, areaType, location) {
        this.id = id;
        this.name = name;
        this.areaType = areaType;
        this.location = location;
        this.capacity = 0;
        this.currentUtilization = 0;
        this.utilizationThreshold = 0.8;
        this.classification = 'GENERAL';
        this.purpose = 'STORAGE';
        this.restrictions = [];
        this.priority = 'NORMAL';
        this.storageLocations = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateUtilization(utilization) {
        this.currentUtilization = utilization;
        this.updatedAt = new Date();
    }

    addStorageLocation(location) {
        this.storageLocations.push(location);
        this.capacity += location.capacity;
    }

    removeStorageLocation(locationId) {
        const index = this.storageLocations.findIndex(loc => loc.id === locationId);
        if (index !== -1) {
            const location = this.storageLocations[index];
            this.capacity -= location.capacity;
            this.storageLocations.splice(index, 1);
        }
    }

    isCapacityAlert() {
        return this.currentUtilization > this.utilizationThreshold;
    }

    canAccommodate(container) {
        return this.currentUtilization + container.weight.value <= this.capacity;
    }

    toString() {
        return `YardArea(${this.name})`;
    }
}

/**
 * 堆存位置实体
 */
class StorageLocation {
    constructor(id, coordinates, hierarchy, identifier) {
        this.id = id;
        this.coordinates = coordinates;
        this.hierarchy = hierarchy;
        this.identifier = identifier;
        this.status = 'AVAILABLE';
        this.capacity = 0;
        this.typeConstraints = [];
        this.safetyConstraints = [];
        this.accessConstraints = [];
        this.assignedContainer = null;
        this.statusHistory = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    assignContainer(container) {
        if (this.canAccommodate(container)) {
            this.assignedContainer = container;
            this.status = 'OCCUPIED';
            this.updateStatusHistory('OCCUPIED');
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    releaseContainer() {
        this.assignedContainer = null;
        this.status = 'AVAILABLE';
        this.updateStatusHistory('AVAILABLE');
        this.updatedAt = new Date();
    }

    canAccommodate(container) {
        return this.status === 'AVAILABLE' &&
               this.capacity >= container.weight.value &&
               this.validateTypeConstraints(container) &&
               this.validateSafetyConstraints(container) &&
               this.validateAccessConstraints(container);
    }

    validateTypeConstraints(container) {
        return this.typeConstraints.every(constraint => constraint.isSatisfied(container));
    }

    validateSafetyConstraints(container) {
        return this.safetyConstraints.every(constraint => constraint.isSatisfied(container));
    }

    validateAccessConstraints(container) {
        return this.accessConstraints.every(constraint => constraint.isSatisfied(container));
    }

    updateStatusHistory(status) {
        this.statusHistory.push({
            status,
            timestamp: new Date()
        });
    }

    toString() {
        return `StorageLocation(${this.identifier})`;
    }
}

/**
 * 堆存策略实体
 */
class StorageStrategy {
    constructor(id, strategyType, rules, parameters) {
        this.id = id;
        this.strategyType = strategyType;
        this.rules = rules;
        this.parameters = parameters;
        this.priority = 'NORMAL';
        this.selectionLogic = null;
        this.executionProcess = [];
        this.evaluationMechanism = null;
        this.adjustmentMechanism = null;
        this.optimizationObjective = null;
        this.optimizationAlgorithm = null;
        this.isActive = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    setSelectionLogic(logic) {
        this.selectionLogic = logic;
        this.updatedAt = new Date();
    }

    addExecutionStep(step) {
        this.executionProcess.push(step);
        this.updatedAt = new Date();
    }

    setEvaluationMechanism(mechanism) {
        this.evaluationMechanism = mechanism;
        this.updatedAt = new Date();
    }

    setOptimizationObjective(objective) {
        this.optimizationObjective = objective;
        this.updatedAt = new Date();
    }

    evaluatePerformance(metrics) {
        if (this.evaluationMechanism) {
            return this.evaluationMechanism.evaluate(metrics);
        }
        return null;
    }

    optimizeStrategy(performanceData) {
        if (this.optimizationAlgorithm) {
            return this.optimizationAlgorithm.optimize(this, performanceData);
        }
        return this;
    }

    toString() {
        return `StorageStrategy(${this.strategyType})`;
    }
}

/**
 * 堆场区域聚合根
 */
class YardAreaAggregate {
    constructor(yardArea) {
        this.yardArea = yardArea;
        this.storageStrategies = [];
        this.performanceMetrics = {
            utilizationRate: 0,
            turnoverRate: 0,
            efficiency: 0
        };
    }

    addStorageStrategy(strategy) {
        this.storageStrategies.push(strategy);
    }

    removeStorageStrategy(strategyId) {
        const index = this.storageStrategies.findIndex(s => s.id === strategyId);
        if (index !== -1) {
            this.storageStrategies.splice(index, 1);
        }
    }

    updatePerformanceMetrics(metrics) {
        this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    }

    getOptimalStorageLocation(container) {
        const availableLocations = this.yardArea.storageLocations.filter(
            loc => loc.canAccommodate(container)
        );

        if (availableLocations.length === 0) {
            return null;
        }

        // 应用存储策略选择最优位置
        for (const strategy of this.storageStrategies) {
            if (strategy.isActive && strategy.selectionLogic) {
                const selectedLocation = strategy.selectionLogic.select(availableLocations, container);
                if (selectedLocation) {
                    return selectedLocation;
                }
            }
        }

        // 默认选择第一个可用位置
        return availableLocations[0];
    }

    calculateUtilizationRate() {
        if (this.yardArea.capacity === 0) return 0;
        return this.yardArea.currentUtilization / this.yardArea.capacity;
    }

    toString() {
        return `YardAreaAggregate(${this.yardArea.toString()})`;
    }
}

/**
 * 堆存位置聚合根
 */
class StorageLocationAggregate {
    constructor(storageLocation) {
        this.storageLocation = storageLocation;
        this.assignmentHistory = [];
        this.performanceMetrics = {
            utilizationTime: 0,
            idleTime: 0,
            efficiency: 0
        };
    }

    assignContainer(container) {
        if (this.storageLocation.assignContainer(container)) {
            this.assignmentHistory.push({
                containerId: container.id,
                assignedAt: new Date(),
                status: 'ASSIGNED'
            });
            return true;
        }
        return false;
    }

    releaseContainer() {
        if (this.storageLocation.assignedContainer) {
            const containerId = this.storageLocation.assignedContainer.id;
            this.storageLocation.releaseContainer();
            
            const lastAssignment = this.assignmentHistory.find(
                assignment => assignment.containerId === containerId && assignment.status === 'ASSIGNED'
            );
            if (lastAssignment) {
                lastAssignment.status = 'RELEASED';
                lastAssignment.releasedAt = new Date();
            }
        }
    }

    updatePerformanceMetrics(metrics) {
        this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
    }

    getCurrentStatus() {
        return this.storageLocation.status;
    }

    getAssignmentHistory() {
        return this.assignmentHistory;
    }

    toString() {
        return `StorageLocationAggregate(${this.storageLocation.toString()})`;
    }
}

/**
 * 堆存策略聚合根
 */
class StorageStrategyAggregate {
    constructor(storageStrategy) {
        this.storageStrategy = storageStrategy;
        this.executionHistory = [];
        this.performanceHistory = [];
    }

    executeStrategy(context) {
        const executionResult = {
            strategyId: this.storageStrategy.id,
            executedAt: new Date(),
            context: context,
            result: null
        };

        try {
            // 执行策略逻辑
            for (const step of this.storageStrategy.executionProcess) {
                step.execute(context);
            }

            executionResult.result = 'SUCCESS';
        } catch (error) {
            executionResult.result = 'FAILED';
            executionResult.error = error.message;
        }

        this.executionHistory.push(executionResult);
        return executionResult;
    }

    evaluatePerformance(metrics) {
        const evaluation = this.storageStrategy.evaluatePerformance(metrics);
        this.performanceHistory.push({
            timestamp: new Date(),
            metrics: metrics,
            evaluation: evaluation
        });
        return evaluation;
    }

    optimizeStrategy(performanceData) {
        const optimizedStrategy = this.storageStrategy.optimizeStrategy(performanceData);
        if (optimizedStrategy !== this.storageStrategy) {
            this.storageStrategy = optimizedStrategy;
        }
        return optimizedStrategy;
    }

    getExecutionHistory() {
        return this.executionHistory;
    }

    getPerformanceHistory() {
        return this.performanceHistory;
    }

    toString() {
        return `StorageStrategyAggregate(${this.storageStrategy.toString()})`;
    }
}

// ==================== 设备管理上下文 ====================

/**
 * 设备实体
 */
class Equipment {
    constructor(id, equipmentNumber, equipmentType, specification, manufacturer) {
        this.id = id;
        this.equipmentNumber = equipmentNumber;
        this.equipmentType = equipmentType;
        this.specification = specification;
        this.manufacturer = manufacturer;
        this.status = 'AVAILABLE';
        this.efficiency = 1.0;
        this.availability = 1.0;
        this.reliability = 1.0;
        this.maintainability = 1.0;
        this.currentLoad = 0;
        this.maxLoad = specification.maxLoad || 1000;
        this.statusHistory = [];
        this.performanceHistory = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateStatus(newStatus) {
        this.status = newStatus;
        this.updateStatusHistory(newStatus);
        this.updatedAt = new Date();
    }

    updatePerformance(metrics) {
        this.efficiency = metrics.efficiency || this.efficiency;
        this.availability = metrics.availability || this.availability;
        this.reliability = metrics.reliability || this.reliability;
        this.maintainability = metrics.maintainability || this.maintainability;
        
        this.performanceHistory.push({
            timestamp: new Date(),
            metrics: metrics
        });
        
        this.updatedAt = new Date();
    }

    assignLoad(load) {
        if (this.currentLoad + load <= this.maxLoad) {
            this.currentLoad += load;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    releaseLoad(load) {
        this.currentLoad = Math.max(0, this.currentLoad - load);
        this.updatedAt = new Date();
    }

    isAvailable() {
        return this.status === 'AVAILABLE' && this.currentLoad < this.maxLoad;
    }

    updateStatusHistory(status) {
        this.statusHistory.push({
            status,
            timestamp: new Date()
        });
    }

    toString() {
        return `Equipment(${this.equipmentNumber})`;
    }
}

/**
 * 维护计划实体
 */
class MaintenancePlan {
    constructor(id, planType, equipmentId) {
        this.id = id;
        this.planType = planType;
        this.equipmentId = equipmentId;
        this.status = 'PENDING';
        this.priority = 'NORMAL';
        this.maintenanceCycle = 'REGULAR';
        this.maintenanceStrategy = 'PREVENTIVE';
        this.maintenanceStandard = 'STANDARD';
        this.maintenanceCost = 0;
        this.scheduledDate = null;
        this.estimatedDuration = 0;
        this.executionRecords = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    schedule(date, duration) {
        this.scheduledDate = date;
        this.estimatedDuration = duration;
        this.status = 'SCHEDULED';
        this.updatedAt = new Date();
    }

    start() {
        this.status = 'IN_PROGRESS';
        this.updatedAt = new Date();
    }

    complete(result) {
        this.status = 'COMPLETED';
        this.executionRecords.push({
            timestamp: new Date(),
            result: result
        });
        this.updatedAt = new Date();
    }

    cancel() {
        this.status = 'CANCELLED';
        this.updatedAt = new Date();
    }

    addExecutionRecord(record) {
        this.executionRecords.push({
            timestamp: new Date(),
            ...record
        });
    }

    toString() {
        return `MaintenancePlan(${this.id})`;
    }
}

/**
 * 设备聚合根
 */
class EquipmentAggregate {
    constructor(equipment) {
        this.equipment = equipment;
        this.maintenancePlans = [];
        this.operators = [];
    }

    addMaintenancePlan(plan) {
        this.maintenancePlans.push(plan);
    }

    removeMaintenancePlan(planId) {
        const index = this.maintenancePlans.findIndex(p => p.id === planId);
        if (index !== -1) {
            this.maintenancePlans.splice(index, 1);
        }
    }

    assignOperator(operator) {
        this.operators.push(operator);
    }

    removeOperator(operatorId) {
        const index = this.operators.findIndex(op => op.id === operatorId);
        if (index !== -1) {
            this.operators.splice(index, 1);
        }
    }

    getCurrentStatus() {
        return this.equipment.status;
    }

    getPerformanceMetrics() {
        return {
            efficiency: this.equipment.efficiency,
            availability: this.equipment.availability,
            reliability: this.equipment.reliability,
            maintainability: this.equipment.maintainability
        };
    }

    getActiveMaintenancePlans() {
        return this.maintenancePlans.filter(plan => 
            plan.status === 'SCHEDULED' || plan.status === 'IN_PROGRESS'
        );
    }

    toString() {
        return `EquipmentAggregate(${this.equipment.toString()})`;
    }
}

/**
 * 维护计划聚合根
 */
class MaintenancePlanAggregate {
    constructor(maintenancePlan) {
        this.maintenancePlan = maintenancePlan;
        this.qualityChecks = [];
        this.feedbackRecords = [];
    }

    addQualityCheck(check) {
        this.qualityChecks.push({
            timestamp: new Date(),
            ...check
        });
    }

    addFeedback(feedback) {
        this.feedbackRecords.push({
            timestamp: new Date(),
            ...feedback
        });
    }

    getExecutionRecords() {
        return this.maintenancePlan.executionRecords;
    }

    getQualityChecks() {
        return this.qualityChecks;
    }

    getFeedbackRecords() {
        return this.feedbackRecords;
    }

    calculateTotalCost() {
        return this.maintenancePlan.maintenanceCost + 
               this.qualityChecks.reduce((sum, check) => sum + (check.cost || 0), 0);
    }

    toString() {
        return `MaintenancePlanAggregate(${this.maintenancePlan.toString()})`;
    }
}

// ==================== 客户服务上下文 ====================

/**
 * 客户实体
 */
class Customer {
    constructor(id, name, customerType, contactInfo) {
        this.id = id;
        this.name = name;
        this.customerType = customerType;
        this.contactInfo = contactInfo;
        this.classification = 'REGULAR';
        this.level = 'STANDARD';
        this.value = 0;
        this.risk = 'LOW';
        this.serviceRecords = [];
        this.complaintRecords = [];
        this.satisfactionRatings = [];
        this.serviceFeedback = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateClassification(classification) {
        this.classification = classification;
        this.updatedAt = new Date();
    }

    updateLevel(level) {
        this.level = level;
        this.updatedAt = new Date();
    }

    updateValue(value) {
        this.value = value;
        this.updatedAt = new Date();
    }

    updateRisk(risk) {
        this.risk = risk;
        this.updatedAt = new Date();
    }

    addServiceRecord(record) {
        this.serviceRecords.push({
            timestamp: new Date(),
            ...record
        });
    }

    addComplaintRecord(complaint) {
        this.complaintRecords.push({
            timestamp: new Date(),
            ...complaint
        });
    }

    addSatisfactionRating(rating) {
        this.satisfactionRatings.push({
            timestamp: new Date(),
            rating: rating
        });
    }

    addServiceFeedback(feedback) {
        this.serviceFeedback.push({
            timestamp: new Date(),
            ...feedback
        });
    }

    getAverageSatisfactionRating() {
        if (this.satisfactionRatings.length === 0) return 0;
        const total = this.satisfactionRatings.reduce((sum, rating) => sum + rating.rating, 0);
        return total / this.satisfactionRatings.length;
    }

    toString() {
        return `Customer(${this.name})`;
    }
}

/**
 * 服务请求实体
 */
class ServiceRequest {
    constructor(id, requestType, customerId) {
        this.id = id;
        this.requestType = requestType;
        this.customerId = customerId;
        this.status = 'PENDING';
        this.priority = 'NORMAL';
        this.processFlow = [];
        this.processSteps = [];
        this.processor = null;
        this.processingTime = 0;
        this.statusHistory = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateStatus(newStatus) {
        this.status = newStatus;
        this.updateStatusHistory(newStatus);
        this.updatedAt = new Date();
    }

    assignProcessor(processor) {
        this.processor = processor;
        this.updatedAt = new Date();
    }

    addProcessStep(step) {
        this.processSteps.push({
            timestamp: new Date(),
            ...step
        });
    }

    updateProcessingTime(time) {
        this.processingTime = time;
        this.updatedAt = new Date();
    }

    isOverdue() {
        const maxProcessingTime = this.getMaxProcessingTime();
        return this.processingTime > maxProcessingTime;
    }

    getMaxProcessingTime() {
        const timeMap = {
            'HIGH': 24 * 60 * 60 * 1000, // 24小时
            'NORMAL': 72 * 60 * 60 * 1000, // 72小时
            'LOW': 168 * 60 * 60 * 1000 // 168小时
        };
        return timeMap[this.priority] || timeMap['NORMAL'];
    }

    updateStatusHistory(status) {
        this.statusHistory.push({
            status,
            timestamp: new Date()
        });
    }

    toString() {
        return `ServiceRequest(${this.id})`;
    }
}

/**
 * 计费规则实体
 */
class BillingRule {
    constructor(id, ruleType, conditions, actions) {
        this.id = id;
        this.ruleType = ruleType;
        this.conditions = conditions;
        this.actions = actions;
        this.rateTable = [];
        this.rateType = 'STANDARD';
        this.rateAdjustment = 0;
        this.rateValidity = {
            startDate: new Date(),
            endDate: null
        };
        this.calculationAlgorithm = null;
        this.calculationParameters = {};
        this.calculationPrecision = 2;
        this.isActive = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    addRateTableEntry(entry) {
        this.rateTable.push({
            timestamp: new Date(),
            ...entry
        });
    }

    setCalculationAlgorithm(algorithm) {
        this.calculationAlgorithm = algorithm;
        this.updatedAt = new Date();
    }

    setCalculationParameters(parameters) {
        this.calculationParameters = parameters;
        this.updatedAt = new Date();
    }

    calculateBilling(data) {
        if (this.calculationAlgorithm) {
            return this.calculationAlgorithm.calculate(data, this.calculationParameters);
        }
        return 0;
    }

    isRuleApplicable(context) {
        return this.conditions.every(condition => condition.evaluate(context));
    }

    executeActions(context) {
        return this.actions.map(action => action.execute(context));
    }

    toString() {
        return `BillingRule(${this.ruleType})`;
    }
}

/**
 * 客户聚合根
 */
class CustomerAggregate {
    constructor(customer) {
        this.customer = customer;
        this.serviceRequests = [];
        this.billingRules = [];
    }

    addServiceRequest(request) {
        this.serviceRequests.push(request);
    }

    removeServiceRequest(requestId) {
        const index = this.serviceRequests.findIndex(req => req.id === requestId);
        if (index !== -1) {
            this.serviceRequests.splice(index, 1);
        }
    }

    addBillingRule(rule) {
        this.billingRules.push(rule);
    }

    removeBillingRule(ruleId) {
        const index = this.billingRules.findIndex(rule => rule.id === ruleId);
        if (index !== -1) {
            this.billingRules.splice(index, 1);
        }
    }

    getActiveServiceRequests() {
        return this.serviceRequests.filter(req => 
            req.status === 'PENDING' || req.status === 'IN_PROGRESS'
        );
    }

    getServiceHistory() {
        return this.customer.serviceRecords;
    }

    getComplaintHistory() {
        return this.customer.complaintRecords;
    }

    getSatisfactionHistory() {
        return this.customer.satisfactionRatings;
    }

    calculateCustomerValue() {
        return this.customer.value;
    }

    assessCustomerRisk() {
        return this.customer.risk;
    }

    toString() {
        return `CustomerAggregate(${this.customer.toString()})`;
    }
}

/**
 * 服务请求聚合根
 */
class ServiceRequestAggregate {
    constructor(serviceRequest) {
        this.serviceRequest = serviceRequest;
        this.attachments = [];
        this.comments = [];
    }

    addAttachment(attachment) {
        this.attachments.push({
            timestamp: new Date(),
            ...attachment
        });
    }

    addComment(comment) {
        this.comments.push({
            timestamp: new Date(),
            ...comment
        });
    }

    getProcessHistory() {
        return this.serviceRequest.processSteps;
    }

    getStatusHistory() {
        return this.serviceRequest.statusHistory;
    }

    getAttachments() {
        return this.attachments;
    }

    getComments() {
        return this.comments;
    }

    isOverdue() {
        return this.serviceRequest.isOverdue();
    }

    getProcessingTime() {
        return this.serviceRequest.processingTime;
    }

    toString() {
        return `ServiceRequestAggregate(${this.serviceRequest.toString()})`;
    }
}

/**
 * 计费规则聚合根
 */
class BillingRuleAggregate {
    constructor(billingRule) {
        this.billingRule = billingRule;
        this.executionHistory = [];
        this.validationResults = [];
    }

    executeRule(context) {
        const executionResult = {
            ruleId: this.billingRule.id,
            executedAt: new Date(),
            context: context,
            result: null
        };

        try {
            if (this.billingRule.isRuleApplicable(context)) {
                executionResult.result = this.billingRule.executeActions(context);
            } else {
                executionResult.result = 'NOT_APPLICABLE';
            }
        } catch (error) {
            executionResult.result = 'FAILED';
            executionResult.error = error.message;
        }

        this.executionHistory.push(executionResult);
        return executionResult;
    }

    validateRule() {
        const validationResult = {
            ruleId: this.billingRule.id,
            validatedAt: new Date(),
            isValid: true,
            issues: []
        };

        // 验证规则条件
        if (!this.billingRule.conditions || this.billingRule.conditions.length === 0) {
            validationResult.isValid = false;
            validationResult.issues.push('No conditions defined');
        }

        // 验证规则动作
        if (!this.billingRule.actions || this.billingRule.actions.length === 0) {
            validationResult.isValid = false;
            validationResult.issues.push('No actions defined');
        }

        // 验证费率表
        if (!this.billingRule.rateTable || this.billingRule.rateTable.length === 0) {
            validationResult.isValid = false;
            validationResult.issues.push('No rate table defined');
        }

        this.validationResults.push(validationResult);
        return validationResult;
    }

    getExecutionHistory() {
        return this.executionHistory;
    }

    getValidationResults() {
        return this.validationResults;
    }

    calculateBilling(data) {
        return this.billingRule.calculateBilling(data);
    }

    toString() {
        return `BillingRuleAggregate(${this.billingRule.toString()})`;
    }
}

// ==================== 用户管理上下文 ====================

/**
 * 用户实体
 */
class User {
    constructor(id, username, userType) {
        this.id = id;
        this.username = username;
        this.userType = userType;
        this.status = 'ACTIVE';
        this.passwordPolicy = 'STANDARD';
        this.authenticationMethod = 'PASSWORD';
        this.loginHistory = [];
        this.securitySettings = {};
        this.organization = null;
        this.roles = [];
        this.permissions = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateStatus(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }

    setAuthenticationMethod(method) {
        this.authenticationMethod = method;
        this.updatedAt = new Date();
    }

    addLoginRecord(record) {
        this.loginHistory.push({
            timestamp: new Date(),
            ...record
        });
    }

    setSecuritySettings(settings) {
        this.securitySettings = settings;
        this.updatedAt = new Date();
    }

    assignToOrganization(organization) {
        this.organization = organization;
        this.updatedAt = new Date();
    }

    assignRole(role) {
        this.roles.push(role);
        this.updatedAt = new Date();
    }

    removeRole(roleId) {
        const index = this.roles.findIndex(role => role.id === roleId);
        if (index !== -1) {
            this.roles.splice(index, 1);
        }
    }

    addPermission(permission) {
        this.permissions.push(permission);
        this.updatedAt = new Date();
    }

    removePermission(permissionId) {
        const index = this.permissions.findIndex(perm => perm.id === permissionId);
        if (index !== -1) {
            this.permissions.splice(index, 1);
        }
    }

    hasPermission(permissionId) {
        return this.permissions.some(perm => perm.id === permissionId) ||
               this.roles.some(role => role.hasPermission(permissionId));
    }

    isActive() {
        return this.status === 'ACTIVE';
    }

    toString() {
        return `User(${this.username})`;
    }
}

/**
 * 角色实体
 */
class Role {
    constructor(id, name, roleType, description) {
        this.id = id;
        this.name = name;
        this.roleType = roleType;
        this.description = description;
        this.permissions = [];
        this.inheritedRoles = [];
        this.isActive = true;
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    addPermission(permission) {
        this.permissions.push(permission);
        this.updatedAt = new Date();
    }

    removePermission(permissionId) {
        const index = this.permissions.findIndex(perm => perm.id === permissionId);
        if (index !== -1) {
            this.permissions.splice(index, 1);
        }
    }

    inheritRole(role) {
        this.inheritedRoles.push(role);
        this.updatedAt = new Date();
    }

    removeInheritedRole(roleId) {
        const index = this.inheritedRoles.findIndex(role => role.id === roleId);
        if (index !== -1) {
            this.inheritedRoles.splice(index, 1);
        }
    }

    hasPermission(permissionId) {
        // 检查直接权限
        if (this.permissions.some(perm => perm.id === permissionId)) {
            return true;
        }

        // 检查继承权限
        return this.inheritedRoles.some(role => role.hasPermission(permissionId));
    }

    getAllPermissions() {
        const directPermissions = [...this.permissions];
        const inheritedPermissions = this.inheritedRoles.flatMap(role => role.getAllPermissions());
        return [...directPermissions, ...inheritedPermissions];
    }

    updateDescription(description) {
        this.description = description;
        this.updatedAt = new Date();
    }

    activate() {
        this.isActive = true;
        this.updatedAt = new Date();
    }

    deactivate() {
        this.isActive = false;
        this.updatedAt = new Date();
    }

    toString() {
        return `Role(${this.name})`;
    }
}

/**
 * 用户聚合根
 */
class UserAggregate {
    constructor(user) {
        this.user = user;
        this.auditLogs = [];
    }

    addAuditLog(log) {
        this.auditLogs.push({
            timestamp: new Date(),
            ...log
        });
    }

    getAuditLogs() {
        return this.auditLogs;
    }

    getRoles() {
        return this.user.roles;
    }

    getPermissions() {
        return this.user.permissions;
    }

    getAllPermissions() {
        const directPermissions = [...this.user.permissions];
        const rolePermissions = this.user.roles.flatMap(role => role.getAllPermissions());
        return [...directPermissions, ...rolePermissions];
    }

    hasPermission(permissionId) {
        return this.user.hasPermission(permissionId);
    }

    isActive() {
        return this.user.isActive();
    }

    getLoginHistory() {
        return this.user.loginHistory;
    }

    toString() {
        return `UserAggregate(${this.user.toString()})`;
    }
}

/**
 * 角色聚合根
 */
class RoleAggregate {
    constructor(role) {
        this.role = role;
        this.assignedUsers = [];
        this.auditLogs = [];
    }

    assignUser(user) {
        this.assignedUsers.push(user);
    }

    removeUser(userId) {
        const index = this.assignedUsers.findIndex(user => user.id === userId);
        if (index !== -1) {
            this.assignedUsers.splice(index, 1);
        }
    }

    addAuditLog(log) {
        this.auditLogs.push({
            timestamp: new Date(),
            ...log
        });
    }

    getAssignedUsers() {
        return this.assignedUsers;
    }

    getAuditLogs() {
        return this.auditLogs;
    }

    getPermissions() {
        return this.role.getAllPermissions();
    }

    hasPermission(permissionId) {
        return this.role.hasPermission(permissionId);
    }

    isActive() {
        return this.role.isActive;
    }

    toString() {
        return `RoleAggregate(${this.role.toString()})`;
    }
}

// ==================== 系统管理上下文 ====================

/**
 * 系统配置实体
 */
class SystemConfig {
    constructor(id, name, configType, configValue) {
        this.id = id;
        this.name = name;
        this.configType = configType;
        this.configValue = configValue;
        this.version = 1;
        this.environment = 'PRODUCTION';
        this.inheritance = null;
        this.isValid = true;
        this.changeRecords = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateValue(newValue) {
        this.configValue = newValue;
        this.version++;
        this.updatedAt = new Date();
    }

    setEnvironment(environment) {
        this.environment = environment;
        this.updatedAt = new Date();
    }

    setInheritance(inheritance) {
        this.inheritance = inheritance;
        this.updatedAt = new Date();
    }

    validate() {
        this.isValid = this.validateConfigValue();
        this.updatedAt = new Date();
        return this.isValid;
    }

    validateConfigValue() {
        // 简化的验证逻辑
        return this.configValue !== null && this.configValue !== undefined;
    }

    addChangeRecord(change) {
        this.changeRecords.push({
            timestamp: new Date(),
            version: this.version,
            ...change
        });
    }

    rollback(version) {
        const targetRecord = this.changeRecords.find(record => record.version === version);
        if (targetRecord) {
            this.configValue = targetRecord.oldValue;
            this.version++;
            this.updatedAt = new Date();
            return true;
        }
        return false;
    }

    toString() {
        return `SystemConfig(${this.name})`;
    }
}

/**
 * 日志记录实体
 */
class LogRecord {
    constructor(id, logLevel, logType, message) {
        this.id = id;
        this.logLevel = logLevel;
        this.logType = logType;
        this.logTime = new Date();
        this.logMessage = message;
        this.logContext = {};
        this.logTags = [];
        this.logMetadata = {};
        this.storageLocation = null;
        this.isRetrieved = false;
        this.isAnalyzed = false;
        this.isArchived = false;
    }

    setContext(context) {
        this.logContext = context;
    }

    addTag(tag) {
        this.logTags.push(tag);
    }

    setMetadata(metadata) {
        this.logMetadata = metadata;
    }

    setStorageLocation(location) {
        this.storageLocation = location;
    }

    markAsRetrieved() {
        this.isRetrieved = true;
    }

    markAsAnalyzed() {
        this.isAnalyzed = true;
    }

    markAsArchived() {
        this.isArchived = true;
    }

    getLogLevel() {
        return this.logLevel;
    }

    getLogType() {
        return this.logType;
    }

    getLogTime() {
        return this.logTime;
    }

    getLogMessage() {
        return this.logMessage;
    }

    toString() {
        return `LogRecord(${this.id})`;
    }
}

/**
 * 系统配置聚合根
 */
class SystemConfigAggregate {
    constructor(systemConfig) {
        this.systemConfig = systemConfig;
        this.approvalRecords = [];
        this.notificationRecords = [];
    }

    addApprovalRecord(approval) {
        this.approvalRecords.push({
            timestamp: new Date(),
            ...approval
        });
    }

    addNotificationRecord(notification) {
        this.notificationRecords.push({
            timestamp: new Date(),
            ...notification
        });
    }

    getChangeRecords() {
        return this.systemConfig.changeRecords;
    }

    getApprovalRecords() {
        return this.approvalRecords;
    }

    getNotificationRecords() {
        return this.notificationRecords;
    }

    getCurrentVersion() {
        return this.systemConfig.version;
    }

    isValid() {
        return this.systemConfig.isValid;
    }

    rollback(version) {
        return this.systemConfig.rollback(version);
    }

    toString() {
        return `SystemConfigAggregate(${this.systemConfig.toString()})`;
    }
}

/**
 * 日志记录聚合根
 */
class LogRecordAggregate {
    constructor(logRecord) {
        this.logRecord = logRecord;
        this.analysisResults = [];
        this.retrievalHistory = [];
    }

    addAnalysisResult(result) {
        this.analysisResults.push({
            timestamp: new Date(),
            ...result
        });
    }

    addRetrievalRecord(record) {
        this.retrievalHistory.push({
            timestamp: new Date(),
            ...record
        });
    }

    getAnalysisResults() {
        return this.analysisResults;
    }

    getRetrievalHistory() {
        return this.retrievalHistory;
    }

    isRetrieved() {
        return this.logRecord.isRetrieved;
    }

    isAnalyzed() {
        return this.logRecord.isAnalyzed;
    }

    isArchived() {
        return this.logRecord.isArchived;
    }

    getStorageLocation() {
        return this.logRecord.storageLocation;
    }

    toString() {
        return `LogRecordAggregate(${this.logRecord.toString()})`;
    }
}

// ==================== 数据管理上下文 ====================

/**
 * 数据表实体
 */
class DataTable {
    constructor(id, name, tableType, structure) {
        this.id = id;
        this.name = name;
        this.tableType = tableType;
        this.tableStructure = structure;
        this.version = 1;
        this.status = 'ACTIVE';
        this.permissions = [];
        this.auditRecords = [];
        this.createdAt = new Date();
        this.updatedAt = new Date();
    }

    updateStructure(newStructure) {
        this.tableStructure = newStructure;
        this.version++;
        this.updatedAt = new Date();
    }

    updateStatus(newStatus) {
        this.status = newStatus;
        this.updatedAt = new Date();
    }

    addPermission(permission) {
        this.permissions.push(permission);
        this.updatedAt = new Date();
    }

    removePermission(permissionId) {
        const index = this.permissions.findIndex(perm => perm.id === permissionId);
        if (index !== -1) {
            this.permissions.splice(index, 1);
        }
    }

    addAuditRecord(record) {
        this.auditRecords.push({
            timestamp: new Date(),
            ...record
        });
    }

    hasPermission(userId, operation) {
        return this.permissions.some(perm => 
            perm.userId === userId && perm.operation === operation
        );
    }

    isActive() {
        return this.status === 'ACTIVE';
    }

    toString() {
        return `DataTable(${this.name})`;
    }
}

/**
 * 备份策略实体
 */
class BackupStrategy {
    constructor(id, name, strategyType) {
        this.id = id;
        this.name = 