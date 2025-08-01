/**
 * 船舶访问单元测试
 */

const { VesselVisit, VesselVisitFactory } = require('../src/domain/aggregates/VesselVisit');
const VesselVisitService = require('../src/services/VesselVisitService');
const { BUSINESS_STATUS, ERROR_CODES } = require('../src/shared/apiContracts');

describe('VesselVisit Aggregate', () => {
    let vesselVisit;

    beforeEach(() => {
        const visitDetails = {
            eta: '2024-01-15T10:00:00Z',
            etd: '2024-01-16T18:00:00Z',
            berthId: 'BERTH01',
            agent: 'COSCO',
            remarks: '标准集装箱船'
        };
        vesselVisit = VesselVisitFactory.create('VESSEL001', visitDetails);
    });

    describe('创建船舶访问', () => {
        test('应该正确创建船舶访问', () => {
            expect(vesselVisit.vesselId).toBe('VESSEL001');
            expect(vesselVisit.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.PLANNED);
            expect(vesselVisit.visitDetails.berthId).toBe('BERTH01');
        });

        test('应该生成未提交事件', () => {
            const events = vesselVisit.getUncommittedEvents();
            expect(events.length).toBe(1);
            expect(events[0].eventType).toBe('VesselVisitCreated');
        });
    });

    describe('开始船舶访问', () => {
        test('应该成功开始访问', () => {
            vesselVisit.startVisit();
            expect(vesselVisit.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.IN_PROGRESS);
        });

        test('已开始的访问不能再次开始', () => {
            vesselVisit.startVisit();
            expect(() => vesselVisit.startVisit()).toThrow('船舶访问状态不正确');
        });

        test('已完成的访问不能开始', () => {
            vesselVisit.startVisit();
            vesselVisit.completeVisit();
            expect(() => vesselVisit.startVisit()).toThrow('船舶访问状态不正确');
        });
    });

    describe('完成船舶访问', () => {
        test('应该成功完成访问', () => {
            vesselVisit.startVisit();
            vesselVisit.completeVisit();
            expect(vesselVisit.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.COMPLETED);
        });

        test('未开始的访问不能完成', () => {
            expect(() => vesselVisit.completeVisit()).toThrow('船舶访问状态不正确');
        });
    });

    describe('取消船舶访问', () => {
        test('应该成功取消访问', () => {
            vesselVisit.cancelVisit('天气原因');
            expect(vesselVisit.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.CANCELLED);
            expect(vesselVisit.cancelReason).toBe('天气原因');
        });

        test('已完成的访问不能取消', () => {
            vesselVisit.startVisit();
            vesselVisit.completeVisit();
            expect(() => vesselVisit.cancelVisit('原因')).toThrow('已完成的船舶访问无法取消');
        });
    });

    describe('更新访问详情', () => {
        test('应该成功更新详情', () => {
            const newDetails = {
                eta: '2024-01-15T11:00:00Z',
                remarks: '更新后的备注'
            };
            vesselVisit.updateVisitDetails(newDetails);
            expect(vesselVisit.visitDetails.eta).toBe('2024-01-15T11:00:00Z');
            expect(vesselVisit.visitDetails.remarks).toBe('更新后的备注');
        });
    });

    describe('时间冲突验证', () => {
        test('应该检测到时间冲突', () => {
            const existingVisits = [
                {
                    id: '1',
                    visitDetails: {
                        eta: '2024-01-15T08:00:00Z',
                        etd: '2024-01-15T20:00:00Z'
                    }
                }
            ];

            expect(() => {
                VesselVisit.validateTimeConflict('2024-01-15T10:00:00Z', '2024-01-15T18:00:00Z', existingVisits);
            }).toThrow('船舶访问时间与现有访问冲突');
        });

        test('应该通过无冲突的时间', () => {
            const existingVisits = [
                {
                    id: '1',
                    visitDetails: {
                        eta: '2024-01-15T08:00:00Z',
                        etd: '2024-01-15T09:00:00Z'
                    }
                }
            ];

            expect(() => {
                VesselVisit.validateTimeConflict('2024-01-15T10:00:00Z', '2024-01-15T18:00:00Z', existingVisits);
            }).not.toThrow();
        });
    });

    describe('持续时间计算', () => {
        test('应该正确计算持续时间', () => {
            const duration = vesselVisit.calculateDuration();
            expect(duration).toBe(32); // 32小时
        });
    });

    describe('DTO转换', () => {
        test('应该正确转换为DTO', () => {
            const dto = vesselVisit.toDTO();
            expect(dto.id).toBe(vesselVisit.id);
            expect(dto.vesselId).toBe('VESSEL001');
            expect(dto.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.PLANNED);
            expect(dto.duration).toBe(32);
        });

        test('应该从DTO正确创建实例', () => {
            const dto = vesselVisit.toDTO();
            const newVisit = VesselVisit.fromDTO(dto);
            expect(newVisit.id).toBe(vesselVisit.id);
            expect(newVisit.vesselId).toBe(vesselVisit.vesselId);
            expect(newVisit.status).toBe(vesselVisit.status);
        });
    });
});

describe('VesselVisitService', () => {
    let service;

    beforeEach(() => {
        service = new VesselVisitService();
    });

    describe('创建船舶访问', () => {
        test('应该成功创建船舶访问', async () => {
            const visitDetails = {
                eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
                etd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 后天
                berthId: 'BERTH01',
                agent: 'COSCO'
            };

            const result = await service.createVesselVisit('VESSEL001', visitDetails);
            expect(result.success).toBe(true);
            expect(result.data.vesselId).toBe('VESSEL001');
            expect(result.data.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.PLANNED);
        });

        test('应该验证访问详情', async () => {
            const invalidDetails = {
                eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                // 缺少etd和berthId
            };

            await expect(service.createVesselVisit('VESSEL001', invalidDetails))
                .rejects.toThrow('访问详情不完整');
        });
    });

    describe('获取船舶访问', () => {
        test('应该成功获取船舶访问', async () => {
            // 先创建一个访问
            const visitDetails = {
                eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
                etd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 后天
                berthId: 'BERTH01'
            };
            const createResult = await service.createVesselVisit('VESSEL001', visitDetails);
            const visitId = createResult.data.id;

            // 获取访问详情
            const result = await service.getVesselVisit(visitId);
            expect(result.success).toBe(true);
            expect(result.data.id).toBe(visitId);
        });

        test('应该处理不存在的访问', async () => {
            await expect(service.getVesselVisit('nonexistent-id'))
                .rejects.toThrow('船舶访问不存在');
        });
    });

    describe('获取船舶访问列表', () => {
        test('应该返回分页列表', async () => {
            // 创建多个访问
            const visitDetails = {
                eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
                etd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 后天
                berthId: 'BERTH01'
            };

            await service.createVesselVisit('VESSEL001', visitDetails);
            await service.createVesselVisit('VESSEL002', visitDetails);

            const result = await service.getVesselVisits({ page: 1, pageSize: 10 });
            expect(result.success).toBe(true);
            expect(result.data.length).toBeGreaterThanOrEqual(2);
            expect(result.pagination).toBeDefined();
        });
    });

    describe('船舶访问状态变更', () => {
        let visitId;

        beforeEach(async () => {
            const visitDetails = {
                eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
                etd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 后天
                berthId: 'BERTH01'
            };
            const createResult = await service.createVesselVisit('VESSEL001', visitDetails);
            visitId = createResult.data.id;
        });

        test('应该成功开始访问', async () => {
            const result = await service.startVesselVisit(visitId);
            expect(result.success).toBe(true);
            expect(result.data.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.IN_PROGRESS);
        });

        test('应该成功完成访问', async () => {
            await service.startVesselVisit(visitId);
            const result = await service.completeVesselVisit(visitId);
            expect(result.success).toBe(true);
            expect(result.data.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.COMPLETED);
        });

        test('应该成功取消访问', async () => {
            const result = await service.cancelVesselVisit(visitId, '天气原因');
            expect(result.success).toBe(true);
            expect(result.data.status).toBe(BUSINESS_STATUS.VESSEL_VISIT.CANCELLED);
        });
    });
}); 