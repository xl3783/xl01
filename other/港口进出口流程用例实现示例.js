// 港口进出口流程用例实现示例
// 基于TOS系统的领域驱动设计

// ==================== 1. 船舶调度上下文用例实现 ====================

// UC-001: 船舶到港通知
class VesselArrivalNotificationUseCase {
    constructor(vesselRepository, berthRepository, notificationService) {
        this.vesselRepository = vesselRepository;
        this.berthRepository = berthRepository;
        this.notificationService = notificationService;
    }

    async execute(vesselInfo, arrivalTime) {
        // 1. 验证船舶信息和进港许可
        const vessel = await this.vesselRepository.findById(vesselInfo.vesselId);
        if (!vessel || !vessel.hasValidArrivalPermission()) {
            throw new Error('船舶信息无效或进港许可不存在');
        }

        // 2. 创建船舶进港记录
        const arrivalRecord = new VesselArrivalRecord({
            vesselId: vessel.id,
            arrivalTime: arrivalTime,
            status: VesselStatus.APPROACHING
        });

        // 3. 分配锚泊位置（如需要）
        if (vessel.needsAnchorage()) {
            const anchorage = await this.berthRepository.findAvailableAnchorage();
            if (anchorage) {
                vessel.assignToAnchorage(anchorage);
            }
        }

        // 4. 更新船舶状态
        vessel.changeStatus(VesselStatus.ANCHORED);
        await this.vesselRepository.save(vessel);

        // 5. 通知相关业务部门
        await this.notificationService.notifyDepartments({
            type: 'VESSEL_ARRIVAL',
            vesselId: vessel.id,
            arrivalTime: arrivalTime
        });

        return {
            success: true,
            vesselId: vessel.id,
            status: vessel.status,
            message: '船舶到港通知处理成功'
        };
    }
}

// UC-002: 泊位分配
class BerthAllocationUseCase {
    constructor(vesselRepository, berthRepository, scheduleService) {
        this.vesselRepository = vesselRepository;
        this.berthRepository = berthRepository;
        this.scheduleService = scheduleService;
    }

    async execute(vesselId, requestedTimeWindow) {
        // 1. 获取船舶信息
        const vessel = await this.vesselRepository.findById(vesselId);
        if (!vessel || vessel.status !== VesselStatus.ANCHORED) {
            throw new Error('船舶状态不允许分配泊位');
        }

        // 2. 查找可用泊位
        const availableBerths = await this.berthRepository.findAvailableBerths({
            vesselType: vessel.vesselType,
            vesselDimensions: vessel.dimensions,
            timeWindow: requestedTimeWindow
        });

        if (availableBerths.length === 0) {
            throw new Error('没有可用的合适泊位');
        }

        // 3. 选择最优泊位
        const optimalBerth = this.selectOptimalBerth(availableBerths, vessel);
        
        // 4. 检查时间窗口冲突
        const hasConflict = await this.scheduleService.checkTimeWindowConflict(
            optimalBerth.id, 
            requestedTimeWindow
        );

        if (hasConflict) {
            throw new Error('时间窗口存在冲突');
        }

        // 5. 分配泊位
        vessel.assignToBerth(optimalBerth, requestedTimeWindow);
        optimalBerth.reserveForVessel(vessel, requestedTimeWindow);

        // 6. 保存状态
        await this.vesselRepository.save(vessel);
        await this.berthRepository.save(optimalBerth);

        // 7. 生成靠泊计划
        const berthingPlan = new BerthingPlan({
            vesselId: vessel.id,
            berthId: optimalBerth.id,
            timeWindow: requestedTimeWindow,
            status: PlanStatus.CONFIRMED
        });

        return {
            success: true,
            berthId: optimalBerth.id,
            timeWindow: requestedTimeWindow,
            berthingPlan: berthingPlan
        };
    }

    selectOptimalBerth(availableBerths, vessel) {
        // 根据距离、设备配置、水深等因素选择最优泊位
        return availableBerths.sort((a, b) => {
            const scoreA = this.calculateBerthScore(a, vessel);
            const scoreB = this.calculateBerthScore(b, vessel);
            return scoreB - scoreA;
        })[0];
    }

    calculateBerthScore(berth, vessel) {
        let score = 0;
        
        // 距离锚地距离
        score += (1000 - berth.distanceToAnchorage) / 10;
        
        // 设备匹配度
        if (berth.hasRequiredEquipment(vessel.requiredEquipment)) {
            score += 100;
        }
        
        // 水深匹配度
        if (berth.depth >= vessel.dimensions.draft + 2) {
            score += 50;
        }
        
        return score;
    }
}

// ==================== 2. 集装箱作业上下文用例实现 ====================

// UC-004: 卸船作业计划制定
class DischargeOperationPlanningUseCase {
    constructor(containerRepository, operationPlanRepository, equipmentService) {
        this.containerRepository = containerRepository;
        this.operationPlanRepository = operationPlanRepository;
        this.equipmentService = equipmentService;
    }

    async execute(vesselId, containerList) {
        // 1. 分析集装箱分布和重量
        const containerAnalysis = this.analyzeContainers(containerList);
        
        // 2. 制定卸船顺序
        const dischargeSequence = this.optimizeDischargeSequence(containerAnalysis);
        
        // 3. 分配装卸设备
        const equipmentAllocation = await this.allocateEquipment(dischargeSequence);
        
        // 4. 生成作业计划
        const operationPlan = new OperationPlan({
            planType: PlanType.DISCHARGE,
            vesselId: vesselId,
            containers: containerList,
            steps: dischargeSequence,
            resourceAllocation: equipmentAllocation,
            status: PlanStatus.DRAFT
        });

        // 5. 验证计划可行性
        const validationResult = await this.validateOperationPlan(operationPlan);
        if (!validationResult.isValid) {
            throw new Error(`作业计划验证失败: ${validationResult.errors.join(', ')}`);
        }

        // 6. 保存作业计划
        await this.operationPlanRepository.save(operationPlan);

        return {
            success: true,
            planId: operationPlan.id,
            estimatedDuration: operationPlan.estimatedDuration,
            containerCount: containerList.length
        };
    }

    analyzeContainers(containerList) {
        const analysis = {
            weightDistribution: {},
            typeDistribution: {},
            dangerousGoods: [],
            refrigeratedContainers: [],
            heavyContainers: []
        };

        containerList.forEach(container => {
            // 重量分布分析
            const weightRange = this.getWeightRange(container.weight);
            analysis.weightDistribution[weightRange] = 
                (analysis.weightDistribution[weightRange] || 0) + 1;

            // 类型分布分析
            analysis.typeDistribution[container.type] = 
                (analysis.typeDistribution[container.type] || 0) + 1;

            // 特殊集装箱识别
            if (container.isDangerousGoods) {
                analysis.dangerousGoods.push(container);
            }
            if (container.isRefrigerated) {
                analysis.refrigeratedContainers.push(container);
            }
            if (container.weight > 20) { // 20吨以上为重箱
                analysis.heavyContainers.push(container);
            }
        });

        return analysis;
    }

    optimizeDischargeSequence(containerAnalysis) {
        const steps = [];
        let stepOrder = 1;

        // 优先卸危险品集装箱
        containerAnalysis.dangerousGoods.forEach(container => {
            steps.push(new OperationStep({
                stepOrder: stepOrder++,
                stepType: StepType.DISCHARGE,
                containerId: container.id,
                priority: Priority.HIGH,
                estimatedDuration: Duration.minutes(15)
            }));
        });

        // 卸冷藏集装箱
        containerAnalysis.refrigeratedContainers.forEach(container => {
            steps.push(new OperationStep({
                stepOrder: stepOrder++,
                stepType: StepType.DISCHARGE,
                containerId: container.id,
                priority: Priority.MEDIUM,
                estimatedDuration: Duration.minutes(12)
            }));
        });

        // 按重量分布卸普通集装箱
        Object.entries(containerAnalysis.weightDistribution)
            .sort((a, b) => this.getWeightValue(b[0]) - this.getWeightValue(a[0]))
            .forEach(([weightRange, count]) => {
                // 这里需要根据实际集装箱列表来创建步骤
                for (let i = 0; i < count; i++) {
                    steps.push(new OperationStep({
                        stepOrder: stepOrder++,
                        stepType: StepType.DISCHARGE,
                        priority: Priority.NORMAL,
                        estimatedDuration: Duration.minutes(10)
                    }));
                }
            });

        return steps;
    }

    async allocateEquipment(dischargeSequence) {
        const equipmentAllocation = new ResourceAllocation();

        for (const step of dischargeSequence) {
            const availableEquipment = await this.equipmentService.findAvailableEquipment({
                equipmentType: EquipmentType.BRIDGE_CRANE,
                timeWindow: step.scheduledTimeWindow,
                capacity: step.requiredCapacity
            });

            if (availableEquipment.length === 0) {
                throw new Error(`步骤 ${step.stepOrder} 无法分配设备`);
            }

            // 选择最优设备
            const optimalEquipment = this.selectOptimalEquipment(availableEquipment, step);
            equipmentAllocation.allocateEquipment(step.id, optimalEquipment);
        }

        return equipmentAllocation;
    }
}

// UC-005: 集装箱卸船执行
class ContainerDischargeExecutionUseCase {
    constructor(operationPlanRepository, containerRepository, equipmentService) {
        this.operationPlanRepository = operationPlanRepository;
        this.containerRepository = containerRepository;
        this.equipmentService = equipmentService;
    }

    async execute(planId, stepId) {
        // 1. 获取作业计划
        const operationPlan = await this.operationPlanRepository.findById(planId);
        if (!operationPlan || operationPlan.status !== PlanStatus.IN_PROGRESS) {
            throw new Error('作业计划不存在或状态不正确');
        }

        // 2. 获取作业步骤
        const step = operationPlan.getStep(stepId);
        if (!step || step.status !== StepStatus.PENDING) {
            throw new Error('作业步骤不存在或状态不正确');
        }

        // 3. 验证前置条件
        const preconditions = await this.checkPreconditions(step);
        if (!preconditions.satisfied) {
            throw new Error(`前置条件不满足: ${preconditions.reasons.join(', ')}`);
        }

        // 4. 开始执行作业
        step.startExecution();
        await this.operationPlanRepository.save(operationPlan);

        // 5. 执行具体的卸船操作
        const executionResult = await this.executeDischargeOperation(step);

        // 6. 更新集装箱状态和位置
        await this.updateContainerStatus(step.containerId, executionResult);

        // 7. 完成作业步骤
        step.completeExecution(executionResult);
        await this.operationPlanRepository.save(operationPlan);

        // 8. 检查是否所有步骤都完成
        if (operationPlan.isCompleted()) {
            operationPlan.complete();
            await this.operationPlanRepository.save(operationPlan);
        }

        return {
            success: true,
            stepId: step.id,
            executionResult: executionResult,
            planCompleted: operationPlan.isCompleted()
        };
    }

    async executeDischargeOperation(step) {
        // 模拟卸船操作
        const startTime = new Date();
        
        // 获取集装箱信息
        const container = await this.containerRepository.findById(step.containerId);
        
        // 执行卸船
        await this.simulateDischargeOperation(container, step);
        
        const endTime = new Date();
        const actualDuration = Duration.between(startTime, endTime);

        return new ExecutionResult({
            startTime: startTime,
            endTime: endTime,
            actualDuration: actualDuration,
            success: true,
            qualityScore: this.calculateQualityScore(container, step)
        });
    }

    async simulateDischargeOperation(container, step) {
        // 模拟桥吊卸船过程
        console.log(`正在卸下集装箱 ${container.containerNumber}`);
        
        // 模拟操作时间
        const operationTime = this.calculateOperationTime(container, step);
        await this.delay(operationTime);
        
        // 模拟质量检查
        const qualityCheck = this.performQualityCheck(container);
        if (!qualityCheck.passed) {
            throw new Error(`质量检查失败: ${qualityCheck.reason}`);
        }
    }

    calculateOperationTime(container, step) {
        let baseTime = 600; // 基础时间10分钟
        
        // 根据集装箱重量调整时间
        if (container.weight > 20) {
            baseTime += 300; // 重箱增加5分钟
        }
        
        // 根据集装箱类型调整时间
        if (container.type === ContainerType.REFRIGERATED) {
            baseTime += 180; // 冷藏箱增加3分钟
        }
        
        return baseTime;
    }

    performQualityCheck(container) {
        // 模拟质量检查
        const checks = [
            { name: '外观检查', passed: Math.random() > 0.05 },
            { name: '重量检查', passed: Math.random() > 0.02 },
            { name: '密封检查', passed: Math.random() > 0.03 }
        ];

        const failedChecks = checks.filter(check => !check.passed);
        
        return {
            passed: failedChecks.length === 0,
            reason: failedChecks.length > 0 ? failedChecks[0].name : null
        };
    }
}

// ==================== 3. 通关流程用例实现 ====================

// UC-007: 集装箱查验申请
class ContainerInspectionApplicationUseCase {
    constructor(containerRepository, inspectionRepository, notificationService) {
        this.containerRepository = containerRepository;
        this.inspectionRepository = inspectionRepository;
        this.notificationService = notificationService;
    }

    async execute(containerId, applicationData) {
        // 1. 验证集装箱状态
        const container = await this.containerRepository.findById(containerId);
        if (!container || container.status !== ContainerStatus.DISCHARGED) {
            throw new Error('集装箱状态不允许申请查验');
        }

        // 2. 创建查验申请
        const inspectionApplication = new InspectionApplication({
            containerId: containerId,
            applicantId: applicationData.applicantId,
            inspectionType: applicationData.inspectionType,
            reason: applicationData.reason,
            priority: this.determinePriority(container, applicationData),
            status: ApplicationStatus.PENDING
        });

        // 3. 验证申请信息
        const validationResult = this.validateApplication(inspectionApplication);
        if (!validationResult.isValid) {
            throw new Error(`申请验证失败: ${validationResult.errors.join(', ')}`);
        }

        // 4. 保存申请
        await this.inspectionRepository.saveApplication(inspectionApplication);

        // 5. 更新集装箱状态
        container.updateStatus(ContainerStatus.INSPECTION_REQUESTED);
        await this.containerRepository.save(container);

        // 6. 通知海关
        await this.notificationService.notifyCustoms({
            type: 'INSPECTION_APPLICATION',
            applicationId: inspectionApplication.id,
            containerId: containerId,
            priority: inspectionApplication.priority
        });

        return {
            success: true,
            applicationId: inspectionApplication.id,
            status: inspectionApplication.status,
            estimatedProcessingTime: this.estimateProcessingTime(inspectionApplication)
        };
    }

    determinePriority(container, applicationData) {
        let priority = Priority.NORMAL;

        // 危险品集装箱优先
        if (container.isDangerousGoods) {
            priority = Priority.HIGH;
        }

        // 冷藏集装箱优先
        if (container.isRefrigerated) {
            priority = Priority.MEDIUM;
        }

        // 根据申请原因调整优先级
        if (applicationData.reason.includes('urgent') || applicationData.reason.includes('紧急')) {
            priority = this.increasePriority(priority);
        }

        return priority;
    }

    validateApplication(application) {
        const errors = [];

        if (!application.containerId) {
            errors.push('集装箱ID不能为空');
        }

        if (!application.applicantId) {
            errors.push('申请人ID不能为空');
        }

        if (!application.inspectionType) {
            errors.push('查验类型不能为空');
        }

        if (!application.reason || application.reason.length < 10) {
            errors.push('申请原因描述不充分');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// UC-008: 集装箱查验执行
class ContainerInspectionExecutionUseCase {
    constructor(inspectionRepository, containerRepository, equipmentService) {
        this.inspectionRepository = inspectionRepository;
        this.containerRepository = containerRepository;
        this.equipmentService = equipmentService;
    }

    async execute(applicationId, inspectorId) {
        // 1. 获取查验申请
        const application = await this.inspectionRepository.findById(applicationId);
        if (!application || application.status !== ApplicationStatus.APPROVED) {
            throw new Error('查验申请不存在或未获批准');
        }

        // 2. 获取集装箱
        const container = await this.containerRepository.findById(application.containerId);
        if (!container) {
            throw new Error('集装箱不存在');
        }

        // 3. 调出集装箱
        await this.moveContainerToInspectionArea(container);

        // 4. 执行查验
        const inspectionResult = await this.performInspection(container, application);

        // 5. 记录查验结果
        const inspectionRecord = new InspectionRecord({
            applicationId: applicationId,
            inspectorId: inspectorId,
            containerId: container.id,
            inspectionType: application.inspectionType,
            result: inspectionResult,
            inspectionTime: new Date()
        });

        await this.inspectionRepository.saveRecord(inspectionRecord);

        // 6. 更新集装箱状态
        container.updateStatus(ContainerStatus.INSPECTED);
        await this.containerRepository.save(container);

        // 7. 处理查验结果
        await this.handleInspectionResult(inspectionResult, container, application);

        return {
            success: true,
            inspectionId: inspectionRecord.id,
            result: inspectionResult,
            nextAction: this.determineNextAction(inspectionResult)
        };
    }

    async performInspection(container, application) {
        const inspectionResult = {
            passed: true,
            findings: [],
            recommendations: [],
            riskLevel: RiskLevel.LOW
        };

        // 根据查验类型执行不同的查验
        switch (application.inspectionType) {
            case InspectionType.PHYSICAL:
                await this.performPhysicalInspection(container, inspectionResult);
                break;
            case InspectionType.X_RAY:
                await this.performXRayInspection(container, inspectionResult);
                break;
            case InspectionType.DOCUMENTARY:
                await this.performDocumentaryInspection(container, inspectionResult);
                break;
            default:
                throw new Error(`不支持的查验类型: ${application.inspectionType}`);
        }

        return inspectionResult;
    }

    async performPhysicalInspection(container, result) {
        // 模拟物理查验
        const checks = [
            { name: '外观检查', weight: 0.3 },
            { name: '密封检查', weight: 0.3 },
            { name: '重量检查', weight: 0.2 },
            { name: '标签检查', weight: 0.2 }
        ];

        for (const check of checks) {
            const checkResult = await this.simulateCheck(check.name, container);
            if (!checkResult.passed) {
                result.passed = false;
                result.findings.push({
                    type: check.name,
                    issue: checkResult.issue,
                    severity: checkResult.severity
                });
            }
        }

        // 确定风险等级
        result.riskLevel = this.calculateRiskLevel(result.findings);
    }

    async simulateCheck(checkName, container) {
        // 模拟检查过程
        await this.delay(1000); // 模拟检查时间

        const randomValue = Math.random();
        let passed = true;
        let issue = null;
        let severity = Severity.LOW;

        switch (checkName) {
            case '外观检查':
                passed = randomValue > 0.1; // 10%失败率
                if (!passed) {
                    issue = '集装箱外观存在轻微损坏';
                    severity = Severity.MEDIUM;
                }
                break;
            case '密封检查':
                passed = randomValue > 0.05; // 5%失败率
                if (!passed) {
                    issue = '集装箱密封不完整';
                    severity = Severity.HIGH;
                }
                break;
            case '重量检查':
                passed = randomValue > 0.15; // 15%失败率
                if (!passed) {
                    issue = '集装箱重量与申报不符';
                    severity = Severity.MEDIUM;
                }
                break;
            case '标签检查':
                passed = randomValue > 0.08; // 8%失败率
                if (!passed) {
                    issue = '集装箱标签不清晰或缺失';
                    severity = Severity.LOW;
                }
                break;
        }

        return { passed, issue, severity };
    }
}

// ==================== 4. 提货流程用例实现 ====================

// UC-010: 提货申请
class ContainerPickupApplicationUseCase {
    constructor(containerRepository, pickupRepository, billingService) {
        this.containerRepository = containerRepository;
        this.pickupRepository = pickupRepository;
        this.billingService = billingService;
    }

    async execute(containerId, pickupData) {
        // 1. 验证集装箱状态
        const container = await this.containerRepository.findById(containerId);
        if (!container || container.status !== ContainerStatus.RELEASED) {
            throw new Error('集装箱状态不允许提货');
        }

        // 2. 验证提货人信息
        const pickupValidation = this.validatePickupData(pickupData);
        if (!pickupValidation.isValid) {
            throw new Error(`提货信息验证失败: ${pickupValidation.errors.join(', ')}`);
        }

        // 3. 检查费用结算状态
        const billingStatus = await this.billingService.checkBillingStatus(containerId);
        if (!billingStatus.isSettled) {
            throw new Error(`费用未结算: ${billingStatus.outstandingAmount}元`);
        }

        // 4. 创建提货申请
        const pickupApplication = new PickupApplication({
            containerId: containerId,
            applicantId: pickupData.applicantId,
            pickupTime: pickupData.pickupTime,
            vehicleInfo: pickupData.vehicleInfo,
            driverInfo: pickupData.driverInfo,
            status: ApplicationStatus.PENDING
        });

        // 5. 保存申请
        await this.pickupRepository.saveApplication(pickupApplication);

        // 6. 更新集装箱状态
        container.updateStatus(ContainerStatus.PICKUP_REQUESTED);
        await this.containerRepository.save(container);

        return {
            success: true,
            applicationId: pickupApplication.id,
            status: pickupApplication.status,
            pickupTime: pickupApplication.pickupTime
        };
    }

    validatePickupData(pickupData) {
        const errors = [];

        if (!pickupData.applicantId) {
            errors.push('申请人ID不能为空');
        }

        if (!pickupData.pickupTime) {
            errors.push('提货时间不能为空');
        }

        if (!pickupData.vehicleInfo || !pickupData.vehicleInfo.licensePlate) {
            errors.push('车辆信息不完整');
        }

        if (!pickupData.driverInfo || !pickupData.driverInfo.driverLicense) {
            errors.push('司机信息不完整');
        }

        // 验证提货时间是否在合理范围内
        const pickupTime = new Date(pickupData.pickupTime);
        const now = new Date();
        const minTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 最少2小时后
        const maxTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 最多7天后

        if (pickupTime < minTime || pickupTime > maxTime) {
            errors.push('提货时间必须在2小时后到7天内');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

// UC-011: 集装箱提货
class ContainerPickupExecutionUseCase {
    constructor(containerRepository, pickupRepository, yardService) {
        this.containerRepository = containerRepository;
        this.pickupRepository = pickupRepository;
        this.yardService = yardService;
    }

    async execute(applicationId, operatorId) {
        // 1. 获取提货申请
        const application = await this.pickupRepository.findById(applicationId);
        if (!application || application.status !== ApplicationStatus.APPROVED) {
            throw new Error('提货申请不存在或未获批准');
        }

        // 2. 获取集装箱
        const container = await this.containerRepository.findById(application.containerId);
        if (!container) {
            throw new Error('集装箱不存在');
        }

        // 3. 验证提货人身份
        const identityValidation = await this.validatePickupIdentity(application);
        if (!identityValidation.isValid) {
            throw new Error(`身份验证失败: ${identityValidation.reason}`);
        }

        // 4. 调出集装箱
        await this.moveContainerToPickupArea(container);

        // 5. 装载到车辆
        const loadingResult = await this.loadContainerToVehicle(container, application.vehicleInfo);

        // 6. 更新集装箱状态
        container.updateStatus(ContainerStatus.PICKED_UP);
        container.updateLocation(new Location('EXIT_GATE', '已提货'));
        await this.containerRepository.save(container);

        // 7. 完成提货申请
        application.complete(loadingResult);
        await this.pickupRepository.save(application);

        // 8. 生成出库记录
        const exitRecord = new ExitRecord({
            containerId: container.id,
            applicationId: applicationId,
            operatorId: operatorId,
            exitTime: new Date(),
            vehicleInfo: application.vehicleInfo
        });

        await this.pickupRepository.saveExitRecord(exitRecord);

        return {
            success: true,
            containerId: container.id,
            exitTime: exitRecord.exitTime,
            message: '集装箱提货完成'
        };
    }

    async validatePickupIdentity(application) {
        // 验证司机身份
        const driverValidation = await this.validateDriverIdentity(application.driverInfo);
        if (!driverValidation.isValid) {
            return { isValid: false, reason: driverValidation.reason };
        }

        // 验证车辆信息
        const vehicleValidation = await this.validateVehicleInfo(application.vehicleInfo);
        if (!vehicleValidation.isValid) {
            return { isValid: false, reason: vehicleValidation.reason };
        }

        // 验证提货单
        const documentValidation = this.validatePickupDocuments(application);
        if (!documentValidation.isValid) {
            return { isValid: false, reason: documentValidation.reason };
        }

        return { isValid: true };
    }

    async loadContainerToVehicle(container, vehicleInfo) {
        // 模拟装载过程
        console.log(`正在将集装箱 ${container.containerNumber} 装载到车辆 ${vehicleInfo.licensePlate}`);

        // 检查车辆承载能力
        if (container.weight > vehicleInfo.maxLoad) {
            throw new Error('车辆承载能力不足');
        }

        // 模拟装载时间
        const loadingTime = this.calculateLoadingTime(container);
        await this.delay(loadingTime);

        // 质量检查
        const qualityCheck = this.performLoadingQualityCheck(container, vehicleInfo);
        if (!qualityCheck.passed) {
            throw new Error(`装载质量检查失败: ${qualityCheck.reason}`);
        }

        return {
            loadingTime: loadingTime,
            qualityScore: qualityCheck.score,
            success: true
        };
    }

    calculateLoadingTime(container) {
        let baseTime = 300000; // 基础时间5分钟

        // 根据集装箱重量调整时间
        if (container.weight > 20) {
            baseTime += 120000; // 重箱增加2分钟
        }

        // 根据集装箱类型调整时间
        if (container.type === ContainerType.REFRIGERATED) {
            baseTime += 60000; // 冷藏箱增加1分钟
        }

        return baseTime;
    }
}

// ==================== 5. 辅助工具类 ====================

// 延迟函数
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 值对象类
class Duration {
    constructor(milliseconds) {
        this.milliseconds = milliseconds;
    }

    static minutes(minutes) {
        return new Duration(minutes * 60 * 1000);
    }

    static between(start, end) {
        return new Duration(end.getTime() - start.getTime());
    }
}

class Priority {
    static LOW = 'LOW';
    static NORMAL = 'NORMAL';
    static MEDIUM = 'MEDIUM';
    static HIGH = 'HIGH';
    static URGENT = 'URGENT';
}

class Severity {
    static LOW = 'LOW';
    static MEDIUM = 'MEDIUM';
    static HIGH = 'HIGH';
    static CRITICAL = 'CRITICAL';
}

class RiskLevel {
    static LOW = 'LOW';
    static MEDIUM = 'MEDIUM';
    static HIGH = 'HIGH';
}

// 导出用例类
module.exports = {
    VesselArrivalNotificationUseCase,
    BerthAllocationUseCase,
    DischargeOperationPlanningUseCase,
    ContainerDischargeExecutionUseCase,
    ContainerInspectionApplicationUseCase,
    ContainerInspectionExecutionUseCase,
    ContainerPickupApplicationUseCase,
    ContainerPickupExecutionUseCase
}; 