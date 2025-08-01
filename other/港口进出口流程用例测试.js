// 港口进出口流程用例测试
// 基于TOS系统的领域驱动设计测试

const {
    VesselArrivalNotificationUseCase,
    BerthAllocationUseCase,
    DischargeOperationPlanningUseCase,
    ContainerDischargeExecutionUseCase,
    ContainerInspectionApplicationUseCase,
    ContainerInspectionExecutionUseCase,
    ContainerPickupApplicationUseCase,
    ContainerPickupExecutionUseCase
} = require('./港口进出口流程用例实现示例.js');

// ==================== 1. 船舶调度上下文测试 ====================

describe('船舶调度上下文用例测试', () => {
    
    describe('UC-001: 船舶到港通知', () => {
        let useCase;
        let mockVesselRepository;
        let mockBerthRepository;
        let mockNotificationService;

        beforeEach(() => {
            // 创建模拟依赖
            mockVesselRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockBerthRepository = {
                findAvailableAnchorage: jest.fn()
            };
            
            mockNotificationService = {
                notifyDepartments: jest.fn()
            };

            useCase = new VesselArrivalNotificationUseCase(
                mockVesselRepository,
                mockBerthRepository,
                mockNotificationService
            );
        });

        test('应该成功处理船舶到港通知', async () => {
            // 准备测试数据
            const vesselInfo = {
                vesselId: 'VESSEL-001',
                name: 'COSCO SHIPPING UNIVERSE',
                imoNumber: '1234567'
            };
            
            const arrivalTime = new Date('2024-01-15T08:00:00Z');

            // 模拟船舶对象
            const mockVessel = {
                id: 'VESSEL-001',
                status: 'APPROACHING',
                hasValidArrivalPermission: jest.fn().mockReturnValue(true),
                needsAnchorage: jest.fn().mockReturnValue(false),
                changeStatus: jest.fn()
            };

            mockVesselRepository.findById.mockResolvedValue(mockVessel);
            mockVesselRepository.save.mockResolvedValue(true);
            mockNotificationService.notifyDepartments.mockResolvedValue(true);

            // 执行用例
            const result = await useCase.execute(vesselInfo, arrivalTime);

            // 验证结果
            expect(result.success).toBe(true);
            expect(result.vesselId).toBe('VESSEL-001');
            expect(mockVesselRepository.findById).toHaveBeenCalledWith('VESSEL-001');
            expect(mockVessel.changeStatus).toHaveBeenCalledWith('ANCHORED');
            expect(mockNotificationService.notifyDepartments).toHaveBeenCalledWith({
                type: 'VESSEL_ARRIVAL',
                vesselId: 'VESSEL-001',
                arrivalTime: arrivalTime
            });
        });

        test('应该拒绝无效的船舶信息', async () => {
            const vesselInfo = { vesselId: 'INVALID-001' };
            const arrivalTime = new Date();

            mockVesselRepository.findById.mockResolvedValue(null);

            await expect(useCase.execute(vesselInfo, arrivalTime))
                .rejects.toThrow('船舶信息无效或进港许可不存在');
        });

        test('应该拒绝没有进港许可的船舶', async () => {
            const vesselInfo = { vesselId: 'VESSEL-001' };
            const arrivalTime = new Date();

            const mockVessel = {
                id: 'VESSEL-001',
                hasValidArrivalPermission: jest.fn().mockReturnValue(false)
            };

            mockVesselRepository.findById.mockResolvedValue(mockVessel);

            await expect(useCase.execute(vesselInfo, arrivalTime))
                .rejects.toThrow('船舶信息无效或进港许可不存在');
        });
    });

    describe('UC-002: 泊位分配', () => {
        let useCase;
        let mockVesselRepository;
        let mockBerthRepository;
        let mockScheduleService;

        beforeEach(() => {
            mockVesselRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockBerthRepository = {
                findAvailableBerths: jest.fn(),
                save: jest.fn()
            };
            
            mockScheduleService = {
                checkTimeWindowConflict: jest.fn()
            };

            useCase = new BerthAllocationUseCase(
                mockVesselRepository,
                mockBerthRepository,
                mockScheduleService
            );
        });

        test('应该成功分配泊位', async () => {
            // 准备测试数据
            const vesselId = 'VESSEL-001';
            const requestedTimeWindow = {
                startTime: new Date('2024-01-15T10:00:00Z'),
                endTime: new Date('2024-01-15T18:00:00Z')
            };

            // 模拟船舶
            const mockVessel = {
                id: 'VESSEL-001',
                status: 'ANCHORED',
                vesselType: 'CONTAINER',
                dimensions: { length: 300, beam: 40, draft: 15 },
                assignToBerth: jest.fn()
            };

            // 模拟可用泊位
            const mockBerths = [
                {
                    id: 'BERTH-001',
                    berthNumber: 'A1',
                    type: 'CONTAINER',
                    length: 350,
                    depth: 18,
                    distanceToAnchorage: 500,
                    hasRequiredEquipment: jest.fn().mockReturnValue(true),
                    reserveForVessel: jest.fn()
                },
                {
                    id: 'BERTH-002',
                    berthNumber: 'A2',
                    type: 'CONTAINER',
                    length: 320,
                    depth: 16,
                    distanceToAnchorage: 800,
                    hasRequiredEquipment: jest.fn().mockReturnValue(true),
                    reserveForVessel: jest.fn()
                }
            ];

            mockVesselRepository.findById.mockResolvedValue(mockVessel);
            mockBerthRepository.findAvailableBerths.mockResolvedValue(mockBerths);
            mockScheduleService.checkTimeWindowConflict.mockResolvedValue(false);
            mockVesselRepository.save.mockResolvedValue(true);
            mockBerthRepository.save.mockResolvedValue(true);

            // 执行用例
            const result = await useCase.execute(vesselId, requestedTimeWindow);

            // 验证结果
            expect(result.success).toBe(true);
            expect(result.berthId).toBe('BERTH-001'); // 应该选择最优泊位
            expect(mockVessel.assignToBerth).toHaveBeenCalledWith(mockBerths[0], requestedTimeWindow);
            expect(mockBerths[0].reserveForVessel).toHaveBeenCalledWith(mockVessel, requestedTimeWindow);
        });

        test('应该拒绝状态不正确的船舶', async () => {
            const vesselId = 'VESSEL-001';
            const requestedTimeWindow = {
                startTime: new Date(),
                endTime: new Date()
            };

            const mockVessel = {
                id: 'VESSEL-001',
                status: 'OPERATING' // 错误状态
            };

            mockVesselRepository.findById.mockResolvedValue(mockVessel);

            await expect(useCase.execute(vesselId, requestedTimeWindow))
                .rejects.toThrow('船舶状态不允许分配泊位');
        });

        test('应该拒绝没有可用泊位的情况', async () => {
            const vesselId = 'VESSEL-001';
            const requestedTimeWindow = {
                startTime: new Date(),
                endTime: new Date()
            };

            const mockVessel = {
                id: 'VESSEL-001',
                status: 'ANCHORED',
                vesselType: 'CONTAINER',
                dimensions: { length: 300, beam: 40, draft: 15 }
            };

            mockVesselRepository.findById.mockResolvedValue(mockVessel);
            mockBerthRepository.findAvailableBerths.mockResolvedValue([]);

            await expect(useCase.execute(vesselId, requestedTimeWindow))
                .rejects.toThrow('没有可用的合适泊位');
        });
    });
});

// ==================== 2. 集装箱作业上下文测试 ====================

describe('集装箱作业上下文用例测试', () => {
    
    describe('UC-004: 卸船作业计划制定', () => {
        let useCase;
        let mockContainerRepository;
        let mockOperationPlanRepository;
        let mockEquipmentService;

        beforeEach(() => {
            mockContainerRepository = {
                findById: jest.fn()
            };
            
            mockOperationPlanRepository = {
                save: jest.fn()
            };
            
            mockEquipmentService = {
                findAvailableEquipment: jest.fn()
            };

            useCase = new DischargeOperationPlanningUseCase(
                mockContainerRepository,
                mockOperationPlanRepository,
                mockEquipmentService
            );
        });

        test('应该成功制定卸船作业计划', async () => {
            // 准备测试数据
            const vesselId = 'VESSEL-001';
            const containerList = [
                {
                    id: 'CONT-001',
                    containerNumber: 'ABCD1234567',
                    type: 'GENERAL',
                    weight: 15,
                    isDangerousGoods: false,
                    isRefrigerated: false
                },
                {
                    id: 'CONT-002',
                    containerNumber: 'EFGH1234567',
                    type: 'REFRIGERATED',
                    weight: 18,
                    isDangerousGoods: false,
                    isRefrigerated: true
                },
                {
                    id: 'CONT-003',
                    containerNumber: 'IJKL1234567',
                    type: 'DANGEROUS',
                    weight: 12,
                    isDangerousGoods: true,
                    isRefrigerated: false
                }
            ];

            // 模拟设备分配
            mockEquipmentService.findAvailableEquipment.mockResolvedValue([
                { id: 'EQ-001', type: 'BRIDGE_CRANE', capacity: 50 }
            ]);

            mockOperationPlanRepository.save.mockResolvedValue(true);

            // 执行用例
            const result = await useCase.execute(vesselId, containerList);

            // 验证结果
            expect(result.success).toBe(true);
            expect(result.containerCount).toBe(3);
            expect(mockOperationPlanRepository.save).toHaveBeenCalled();
        });

        test('应该正确处理危险品集装箱优先级', async () => {
            const vesselId = 'VESSEL-001';
            const containerList = [
                {
                    id: 'CONT-001',
                    containerNumber: 'ABCD1234567',
                    type: 'GENERAL',
                    weight: 15,
                    isDangerousGoods: false,
                    isRefrigerated: false
                },
                {
                    id: 'CONT-002',
                    containerNumber: 'EFGH1234567',
                    type: 'DANGEROUS',
                    weight: 12,
                    isDangerousGoods: true,
                    isRefrigerated: false
                }
            ];

            mockEquipmentService.findAvailableEquipment.mockResolvedValue([
                { id: 'EQ-001', type: 'BRIDGE_CRANE', capacity: 50 }
            ]);

            mockOperationPlanRepository.save.mockResolvedValue(true);

            const result = await useCase.execute(vesselId, containerList);

            expect(result.success).toBe(true);
            // 验证危险品集装箱被优先处理
            expect(mockOperationPlanRepository.save).toHaveBeenCalledWith(
                expect.objectContaining({
                    steps: expect.arrayContaining([
                        expect.objectContaining({
                            containerId: 'CONT-002',
                            priority: 'HIGH'
                        })
                    ])
                })
            );
        });
    });

    describe('UC-005: 集装箱卸船执行', () => {
        let useCase;
        let mockOperationPlanRepository;
        let mockContainerRepository;
        let mockEquipmentService;

        beforeEach(() => {
            mockOperationPlanRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockContainerRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockEquipmentService = {
                findAvailableEquipment: jest.fn()
            };

            useCase = new ContainerDischargeExecutionUseCase(
                mockOperationPlanRepository,
                mockContainerRepository,
                mockEquipmentService
            );
        });

        test('应该成功执行卸船作业', async () => {
            // 准备测试数据
            const planId = 'PLAN-001';
            const stepId = 'STEP-001';

            // 模拟作业计划
            const mockPlan = {
                id: 'PLAN-001',
                status: 'IN_PROGRESS',
                getStep: jest.fn(),
                isCompleted: jest.fn().mockReturnValue(false)
            };

            // 模拟作业步骤
            const mockStep = {
                id: 'STEP-001',
                status: 'PENDING',
                containerId: 'CONT-001',
                startExecution: jest.fn(),
                completeExecution: jest.fn()
            };

            // 模拟集装箱
            const mockContainer = {
                id: 'CONT-001',
                containerNumber: 'ABCD1234567',
                weight: 15,
                type: 'GENERAL',
                updateStatus: jest.fn()
            };

            mockOperationPlanRepository.findById.mockResolvedValue(mockPlan);
            mockPlan.getStep.mockReturnValue(mockStep);
            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockOperationPlanRepository.save.mockResolvedValue(true);
            mockContainerRepository.save.mockResolvedValue(true);

            // 执行用例
            const result = await useCase.execute(planId, stepId);

            // 验证结果
            expect(result.success).toBe(true);
            expect(mockStep.startExecution).toHaveBeenCalled();
            expect(mockStep.completeExecution).toHaveBeenCalled();
            expect(mockContainer.updateStatus).toHaveBeenCalled();
        });

        test('应该拒绝状态不正确的作业计划', async () => {
            const planId = 'PLAN-001';
            const stepId = 'STEP-001';

            const mockPlan = {
                id: 'PLAN-001',
                status: 'DRAFT' // 错误状态
            };

            mockOperationPlanRepository.findById.mockResolvedValue(mockPlan);

            await expect(useCase.execute(planId, stepId))
                .rejects.toThrow('作业计划不存在或状态不正确');
        });
    });
});

// ==================== 3. 通关流程测试 ====================

describe('通关流程用例测试', () => {
    
    describe('UC-007: 集装箱查验申请', () => {
        let useCase;
        let mockContainerRepository;
        let mockInspectionRepository;
        let mockNotificationService;

        beforeEach(() => {
            mockContainerRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockInspectionRepository = {
                saveApplication: jest.fn()
            };
            
            mockNotificationService = {
                notifyCustoms: jest.fn()
            };

            useCase = new ContainerInspectionApplicationUseCase(
                mockContainerRepository,
                mockInspectionRepository,
                mockNotificationService
            );
        });

        test('应该成功提交查验申请', async () => {
            // 准备测试数据
            const containerId = 'CONT-001';
            const applicationData = {
                applicantId: 'AGENT-001',
                inspectionType: 'PHYSICAL',
                reason: '随机查验，确保货物安全'
            };

            // 模拟集装箱
            const mockContainer = {
                id: 'CONT-001',
                status: 'DISCHARGED',
                isDangerousGoods: false,
                isRefrigerated: false,
                updateStatus: jest.fn()
            };

            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockInspectionRepository.saveApplication.mockResolvedValue(true);
            mockContainerRepository.save.mockResolvedValue(true);
            mockNotificationService.notifyCustoms.mockResolvedValue(true);

            // 执行用例
            const result = await useCase.execute(containerId, applicationData);

            // 验证结果
            expect(result.success).toBe(true);
            expect(result.status).toBe('PENDING');
            expect(mockContainer.updateStatus).toHaveBeenCalledWith('INSPECTION_REQUESTED');
            expect(mockNotificationService.notifyCustoms).toHaveBeenCalled();
        });

        test('应该正确处理危险品集装箱优先级', async () => {
            const containerId = 'CONT-001';
            const applicationData = {
                applicantId: 'AGENT-001',
                inspectionType: 'PHYSICAL',
                reason: '危险品查验'
            };

            const mockContainer = {
                id: 'CONT-001',
                status: 'DISCHARGED',
                isDangerousGoods: true,
                isRefrigerated: false,
                updateStatus: jest.fn()
            };

            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockInspectionRepository.saveApplication.mockResolvedValue(true);
            mockContainerRepository.save.mockResolvedValue(true);
            mockNotificationService.notifyCustoms.mockResolvedValue(true);

            const result = await useCase.execute(containerId, applicationData);

            expect(result.success).toBe(true);
            // 验证危险品集装箱获得高优先级
            expect(mockInspectionRepository.saveApplication).toHaveBeenCalledWith(
                expect.objectContaining({
                    priority: 'HIGH'
                })
            );
        });

        test('应该拒绝状态不正确的集装箱', async () => {
            const containerId = 'CONT-001';
            const applicationData = {
                applicantId: 'AGENT-001',
                inspectionType: 'PHYSICAL',
                reason: '查验申请'
            };

            const mockContainer = {
                id: 'CONT-001',
                status: 'IN_TRANSIT' // 错误状态
            };

            mockContainerRepository.findById.mockResolvedValue(mockContainer);

            await expect(useCase.execute(containerId, applicationData))
                .rejects.toThrow('集装箱状态不允许申请查验');
        });
    });

    describe('UC-008: 集装箱查验执行', () => {
        let useCase;
        let mockInspectionRepository;
        let mockContainerRepository;
        let mockEquipmentService;

        beforeEach(() => {
            mockInspectionRepository = {
                findById: jest.fn(),
                saveRecord: jest.fn()
            };
            
            mockContainerRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockEquipmentService = {
                findAvailableEquipment: jest.fn()
            };

            useCase = new ContainerInspectionExecutionUseCase(
                mockInspectionRepository,
                mockContainerRepository,
                mockEquipmentService
            );
        });

        test('应该成功执行查验', async () => {
            // 准备测试数据
            const applicationId = 'APP-001';
            const inspectorId = 'INSPECTOR-001';

            // 模拟查验申请
            const mockApplication = {
                id: 'APP-001',
                status: 'APPROVED',
                containerId: 'CONT-001',
                inspectionType: 'PHYSICAL'
            };

            // 模拟集装箱
            const mockContainer = {
                id: 'CONT-001',
                containerNumber: 'ABCD1234567',
                updateStatus: jest.fn()
            };

            mockInspectionRepository.findById.mockResolvedValue(mockApplication);
            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockInspectionRepository.saveRecord.mockResolvedValue(true);
            mockContainerRepository.save.mockResolvedValue(true);

            // 执行用例
            const result = await useCase.execute(applicationId, inspectorId);

            // 验证结果
            expect(result.success).toBe(true);
            expect(mockContainer.updateStatus).toHaveBeenCalledWith('INSPECTED');
            expect(mockInspectionRepository.saveRecord).toHaveBeenCalled();
        });

        test('应该正确处理查验失败的情况', async () => {
            const applicationId = 'APP-001';
            const inspectorId = 'INSPECTOR-001';

            const mockApplication = {
                id: 'APP-001',
                status: 'APPROVED',
                containerId: 'CONT-001',
                inspectionType: 'PHYSICAL'
            };

            const mockContainer = {
                id: 'CONT-001',
                containerNumber: 'ABCD1234567',
                updateStatus: jest.fn()
            };

            mockInspectionRepository.findById.mockResolvedValue(mockApplication);
            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockInspectionRepository.saveRecord.mockResolvedValue(true);
            mockContainerRepository.save.mockResolvedValue(true);

            // 模拟查验失败
            jest.spyOn(useCase, 'performInspection').mockResolvedValue({
                passed: false,
                findings: [{ type: '外观检查', issue: '集装箱外观存在损坏', severity: 'HIGH' }],
                recommendations: ['需要进一步检查'],
                riskLevel: 'HIGH'
            });

            const result = await useCase.execute(applicationId, inspectorId);

            expect(result.success).toBe(true);
            expect(result.result.passed).toBe(false);
            expect(result.result.findings.length).toBeGreaterThan(0);
        });
    });
});

// ==================== 4. 提货流程测试 ====================

describe('提货流程用例测试', () => {
    
    describe('UC-010: 提货申请', () => {
        let useCase;
        let mockContainerRepository;
        let mockPickupRepository;
        let mockBillingService;

        beforeEach(() => {
            mockContainerRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockPickupRepository = {
                saveApplication: jest.fn()
            };
            
            mockBillingService = {
                checkBillingStatus: jest.fn()
            };

            useCase = new ContainerPickupApplicationUseCase(
                mockContainerRepository,
                mockPickupRepository,
                mockBillingService
            );
        });

        test('应该成功提交提货申请', async () => {
            // 准备测试数据
            const containerId = 'CONT-001';
            const pickupData = {
                applicantId: 'AGENT-001',
                pickupTime: new Date('2024-01-16T10:00:00Z'),
                vehicleInfo: {
                    licensePlate: '京A12345',
                    maxLoad: 30
                },
                driverInfo: {
                    driverLicense: 'DL123456789',
                    name: '张三'
                }
            };

            // 模拟集装箱
            const mockContainer = {
                id: 'CONT-001',
                status: 'RELEASED',
                updateStatus: jest.fn()
            };

            // 模拟费用状态
            const mockBillingStatus = {
                isSettled: true,
                outstandingAmount: 0
            };

            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockBillingService.checkBillingStatus.mockResolvedValue(mockBillingStatus);
            mockPickupRepository.saveApplication.mockResolvedValue(true);
            mockContainerRepository.save.mockResolvedValue(true);

            // 执行用例
            const result = await useCase.execute(containerId, pickupData);

            // 验证结果
            expect(result.success).toBe(true);
            expect(result.status).toBe('PENDING');
            expect(mockContainer.updateStatus).toHaveBeenCalledWith('PICKUP_REQUESTED');
        });

        test('应该拒绝费用未结算的申请', async () => {
            const containerId = 'CONT-001';
            const pickupData = {
                applicantId: 'AGENT-001',
                pickupTime: new Date('2024-01-16T10:00:00Z'),
                vehicleInfo: { licensePlate: '京A12345' },
                driverInfo: { driverLicense: 'DL123456789' }
            };

            const mockContainer = {
                id: 'CONT-001',
                status: 'RELEASED'
            };

            const mockBillingStatus = {
                isSettled: false,
                outstandingAmount: 1500
            };

            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockBillingService.checkBillingStatus.mockResolvedValue(mockBillingStatus);

            await expect(useCase.execute(containerId, pickupData))
                .rejects.toThrow('费用未结算: 1500元');
        });

        test('应该拒绝信息不完整的申请', async () => {
            const containerId = 'CONT-001';
            const pickupData = {
                applicantId: 'AGENT-001',
                pickupTime: new Date('2024-01-16T10:00:00Z'),
                vehicleInfo: {}, // 缺少车牌号
                driverInfo: { driverLicense: 'DL123456789' }
            };

            const mockContainer = {
                id: 'CONT-001',
                status: 'RELEASED'
            };

            mockContainerRepository.findById.mockResolvedValue(mockContainer);

            await expect(useCase.execute(containerId, pickupData))
                .rejects.toThrow('车辆信息不完整');
        });
    });

    describe('UC-011: 集装箱提货', () => {
        let useCase;
        let mockContainerRepository;
        let mockPickupRepository;
        let mockYardService;

        beforeEach(() => {
            mockContainerRepository = {
                findById: jest.fn(),
                save: jest.fn()
            };
            
            mockPickupRepository = {
                findById: jest.fn(),
                save: jest.fn(),
                saveExitRecord: jest.fn()
            };
            
            mockYardService = {
                moveContainer: jest.fn()
            };

            useCase = new ContainerPickupExecutionUseCase(
                mockContainerRepository,
                mockPickupRepository,
                mockYardService
            );
        });

        test('应该成功执行集装箱提货', async () => {
            // 准备测试数据
            const applicationId = 'APP-001';
            const operatorId = 'OPERATOR-001';

            // 模拟提货申请
            const mockApplication = {
                id: 'APP-001',
                status: 'APPROVED',
                containerId: 'CONT-001',
                vehicleInfo: {
                    licensePlate: '京A12345',
                    maxLoad: 30
                },
                driverInfo: {
                    driverLicense: 'DL123456789',
                    name: '张三'
                },
                complete: jest.fn()
            };

            // 模拟集装箱
            const mockContainer = {
                id: 'CONT-001',
                containerNumber: 'ABCD1234567',
                weight: 15,
                type: 'GENERAL',
                updateStatus: jest.fn(),
                updateLocation: jest.fn()
            };

            mockPickupRepository.findById.mockResolvedValue(mockApplication);
            mockContainerRepository.findById.mockResolvedValue(mockContainer);
            mockContainerRepository.save.mockResolvedValue(true);
            mockPickupRepository.save.mockResolvedValue(true);
            mockPickupRepository.saveExitRecord.mockResolvedValue(true);

            // 模拟身份验证
            jest.spyOn(useCase, 'validatePickupIdentity').mockResolvedValue({ isValid: true });

            // 执行用例
            const result = await useCase.execute(applicationId, operatorId);

            // 验证结果
            expect(result.success).toBe(true);
            expect(result.containerId).toBe('CONT-001');
            expect(mockContainer.updateStatus).toHaveBeenCalledWith('PICKED_UP');
            expect(mockApplication.complete).toHaveBeenCalled();
            expect(mockPickupRepository.saveExitRecord).toHaveBeenCalled();
        });

        test('应该拒绝身份验证失败的提货', async () => {
            const applicationId = 'APP-001';
            const operatorId = 'OPERATOR-001';

            const mockApplication = {
                id: 'APP-001',
                status: 'APPROVED',
                containerId: 'CONT-001',
                vehicleInfo: { licensePlate: '京A12345' },
                driverInfo: { driverLicense: 'DL123456789' }
            };

            const mockContainer = {
                id: 'CONT-001',
                containerNumber: 'ABCD1234567',
                weight: 15
            };

            mockPickupRepository.findById.mockResolvedValue(mockApplication);
            mockContainerRepository.findById.mockResolvedValue(mockContainer);

            // 模拟身份验证失败
            jest.spyOn(useCase, 'validatePickupIdentity').mockResolvedValue({
                isValid: false,
                reason: '司机身份验证失败'
            });

            await expect(useCase.execute(applicationId, operatorId))
                .rejects.toThrow('身份验证失败: 司机身份验证失败');
        });
    });
});

// ==================== 5. 集成测试 ====================

describe('港口进出口流程集成测试', () => {
    
    test('完整的进口流程测试', async () => {
        // 模拟完整的进口流程
        const vesselId = 'VESSEL-001';
        const containerId = 'CONT-001';
        
        // 1. 船舶到港
        const arrivalUseCase = new VesselArrivalNotificationUseCase(
            mockVesselRepository,
            mockBerthRepository,
            mockNotificationService
        );
        
        const arrivalResult = await arrivalUseCase.execute(
            { vesselId, name: 'COSCO SHIPPING UNIVERSE' },
            new Date()
        );
        
        expect(arrivalResult.success).toBe(true);
        
        // 2. 泊位分配
        const berthAllocationUseCase = new BerthAllocationUseCase(
            mockVesselRepository,
            mockBerthRepository,
            mockScheduleService
        );
        
        const berthResult = await berthAllocationUseCase.execute(
            vesselId,
            { startTime: new Date(), endTime: new Date() }
        );
        
        expect(berthResult.success).toBe(true);
        
        // 3. 卸船作业
        const dischargeUseCase = new DischargeOperationPlanningUseCase(
            mockContainerRepository,
            mockOperationPlanRepository,
            mockEquipmentService
        );
        
        const dischargeResult = await dischargeUseCase.execute(vesselId, [
            { id: containerId, weight: 15, type: 'GENERAL' }
        ]);
        
        expect(dischargeResult.success).toBe(true);
        
        // 4. 查验申请
        const inspectionUseCase = new ContainerInspectionApplicationUseCase(
            mockContainerRepository,
            mockInspectionRepository,
            mockNotificationService
        );
        
        const inspectionResult = await inspectionUseCase.execute(containerId, {
            applicantId: 'AGENT-001',
            inspectionType: 'PHYSICAL',
            reason: '随机查验'
        });
        
        expect(inspectionResult.success).toBe(true);
        
        // 5. 提货申请
        const pickupUseCase = new ContainerPickupApplicationUseCase(
            mockContainerRepository,
            mockPickupRepository,
            mockBillingService
        );
        
        const pickupResult = await pickupUseCase.execute(containerId, {
            applicantId: 'AGENT-001',
            pickupTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
            vehicleInfo: { licensePlate: '京A12345', maxLoad: 30 },
            driverInfo: { driverLicense: 'DL123456789', name: '张三' }
        });
        
        expect(pickupResult.success).toBe(true);
    });
});

// ==================== 6. 性能测试 ====================

describe('性能测试', () => {
    
    test('泊位分配性能测试', async () => {
        const useCase = new BerthAllocationUseCase(
            mockVesselRepository,
            mockBerthRepository,
            mockScheduleService
        );
        
        const startTime = Date.now();
        
        // 模拟大量泊位分配请求
        const promises = [];
        for (let i = 0; i < 100; i++) {
            promises.push(useCase.execute(`VESSEL-${i}`, {
                startTime: new Date(),
                endTime: new Date()
            }));
        }
        
        await Promise.all(promises);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 验证性能要求：100个请求应在5秒内完成
        expect(duration).toBeLessThan(5000);
    });
    
    test('作业计划制定性能测试', async () => {
        const useCase = new DischargeOperationPlanningUseCase(
            mockContainerRepository,
            mockOperationPlanRepository,
            mockEquipmentService
        );
        
        const startTime = Date.now();
        
        // 模拟大量集装箱的作业计划制定
        const containerList = [];
        for (let i = 0; i < 1000; i++) {
            containerList.push({
                id: `CONT-${i}`,
                weight: Math.random() * 30 + 5,
                type: ['GENERAL', 'REFRIGERATED', 'DANGEROUS'][Math.floor(Math.random() * 3)],
                isDangerousGoods: Math.random() > 0.9,
                isRefrigerated: Math.random() > 0.8
            });
        }
        
        await useCase.execute('VESSEL-001', containerList);
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        // 验证性能要求：1000个集装箱的作业计划应在10秒内完成
        expect(duration).toBeLessThan(10000);
    });
});

// ==================== 7. 错误处理测试 ====================

describe('错误处理测试', () => {
    
    test('应该正确处理系统异常', async () => {
        const useCase = new VesselArrivalNotificationUseCase(
            mockVesselRepository,
            mockBerthRepository,
            mockNotificationService
        );
        
        // 模拟数据库连接异常
        mockVesselRepository.findById.mockRejectedValue(new Error('数据库连接失败'));
        
        await expect(useCase.execute({ vesselId: 'VESSEL-001' }, new Date()))
            .rejects.toThrow('数据库连接失败');
    });
    
    test('应该正确处理业务规则异常', async () => {
        const useCase = new BerthAllocationUseCase(
            mockVesselRepository,
            mockBerthRepository,
            mockScheduleService
        );
        
        // 模拟时间窗口冲突
        mockScheduleService.checkTimeWindowConflict.mockResolvedValue(true);
        
        await expect(useCase.execute('VESSEL-001', {
            startTime: new Date(),
            endTime: new Date()
        })).rejects.toThrow('时间窗口存在冲突');
    });
});

// 导出测试模块
module.exports = {
    describe,
    test,
    expect,
    beforeEach,
    jest
}; 