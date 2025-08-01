# 船体结构与积载计划集成设计文档

## 一、概述

本文档详细说明船体结构定义如何与积载计划系统集成，实现精确的容量管理和位置可用性判断。

## 二、船体结构在积载计划中的作用

### 2.1 容量管理
- **物理容量限制**: 基于船体结构的实际物理空间
- **重量容量限制**: 基于船舶结构强度的重量承载能力
- **类型容量限制**: 基于设备配置的特殊集装箱类型支持

### 2.2 位置可用性判断
- **结构约束**: 船体结构对集装箱位置的物理限制
- **设备约束**: 导槽系统对集装箱尺寸和类型的限制
- **操作约束**: 装卸设备对位置可访问性的限制

## 三、积载计划验证流程

### 3.1 位置验证流程
```
1. 获取目标位置 (bay, row, tier, slot)
2. 查询船体结构配置
3. 验证位置是否存在
4. 检查位置类型兼容性
5. 验证重量限制
6. 检查特殊要求
7. 验证可访问性
8. 返回验证结果
```

### 3.2 容量检查流程
```
1. 获取当前积载状态
2. 查询船体结构容量配置
3. 计算已使用容量
4. 计算剩余容量
5. 检查重量分布
6. 验证稳定性要求
7. 返回容量状态
```

## 四、关键业务规则

### 4.1 位置分配规则
- **贝位规则**: 集装箱必须分配到有效的贝位
- **行规则**: 集装箱尺寸必须与行类型匹配
- **层规则**: 重量必须符合层重量限制
- **槽位规则**: 特殊要求必须满足槽位约束

### 4.2 重量分布规则
- **纵向平衡**: 前后重量分布必须在允许范围内
- **横向平衡**: 左右重量分布必须平衡
- **垂直稳定性**: 各层重量必须符合堆叠限制
- **动态稳定性**: 考虑船舶运动对稳定性的影响

### 4.3 特殊集装箱规则
- **冷藏箱**: 只能放置在支持冷藏的位置
- **危险品**: 必须符合危险品积载要求
- **超限箱**: 必须验证尺寸和重量限制
- **特殊箱**: 必须满足特殊操作要求

## 五、技术实现要点

### 5.1 数据结构设计
```javascript
// 位置验证接口
interface PositionValidator {
  validatePosition(
    vesselId: string,
    position: ContainerPosition,
    container: Container
  ): ValidationResult;
  
  checkCapacity(
    vesselId: string,
    bayNumber: number
  ): CapacityStatus;
  
  validateStability(
    vesselId: string,
    stowagePlan: StowagePlan
  ): StabilityResult;
}
```

### 5.2 验证算法
```javascript
// 位置验证算法
function validateContainerPosition(vessel, position, container) {
  // 1. 获取船体结构配置
  const hullStructure = vessel.hullStructure;
  const bayConfig = vessel.bayConfiguration;
  
  // 2. 验证贝位存在性
  const bay = bayConfig.bayDefinitions.find(b => b.bayNumber === position.bay);
  if (!bay) return { valid: false, error: 'INVALID_BAY' };
  
  // 3. 验证行配置
  const row = bay.rowConfiguration.find(r => r.rowNumber === position.row);
  if (!row) return { valid: false, error: 'INVALID_ROW' };
  
  // 4. 验证层配置
  const tier = bay.tierConfiguration.find(t => t.tierNumber === position.tier);
  if (!tier) return { valid: false, error: 'INVALID_TIER' };
  
  // 5. 验证重量限制
  if (container.weight > tier.maxWeight) {
    return { valid: false, error: 'WEIGHT_EXCEEDED' };
  }
  
  // 6. 验证特殊要求
  if (container.type === 'REEFER' && !tier.isReeferCapable) {
    return { valid: false, error: 'REEFER_NOT_SUPPORTED' };
  }
  
  return { valid: true };
}
```

### 5.3 容量计算算法
```javascript
// 容量计算算法
function calculateBayCapacity(vessel, bayNumber) {
  const bayConfig = vessel.bayConfiguration;
  const bay = bayConfig.bayDefinitions.find(b => b.bayNumber === bayNumber);
  
  if (!bay) return null;
  
  let totalCapacity = 0;
  let usedCapacity = 0;
  
  // 计算总容量
  bay.rowConfiguration.forEach(row => {
    totalCapacity += row.maxTiers;
  });
  
  // 计算已使用容量
  const currentStowage = getCurrentStowage(vessel.id, bayNumber);
  usedCapacity = currentStowage.length;
  
  return {
    totalCapacity,
    usedCapacity,
    availableCapacity: totalCapacity - usedCapacity,
    utilizationRate: (usedCapacity / totalCapacity) * 100
  };
}
```

## 六、性能优化策略

### 6.1 缓存策略
- **船体结构缓存**: 船舶结构配置缓存到内存
- **容量状态缓存**: 实时容量状态缓存
- **验证结果缓存**: 常用验证结果缓存

### 6.2 索引优化
- **位置索引**: 基于bay-row-tier-slot的复合索引
- **重量索引**: 基于重量范围的索引
- **类型索引**: 基于集装箱类型的索引

### 6.3 批量处理
- **批量验证**: 多个位置同时验证
- **批量更新**: 积载计划批量更新
- **批量计算**: 容量状态批量计算

## 七、错误处理机制

### 7.1 验证错误类型
- **结构错误**: 船体结构配置错误
- **约束错误**: 位置约束违反
- **容量错误**: 容量超限
- **稳定性错误**: 稳定性要求不满足

### 7.2 错误处理策略
- **实时验证**: 积载计划创建时实时验证
- **批量验证**: 计划提交前批量验证
- **错误报告**: 详细的错误报告和建议
- **自动修正**: 简单的错误自动修正

## 八、监控和日志

### 8.1 性能监控
- **验证响应时间**: 位置验证响应时间监控
- **容量计算时间**: 容量计算性能监控
- **错误率统计**: 验证错误率统计

### 8.2 业务监控
- **容量利用率**: 各贝位容量利用率监控
- **重量分布**: 船舶重量分布监控
- **稳定性指标**: 船舶稳定性指标监控

### 8.3 日志记录
- **验证日志**: 详细的位置验证日志
- **错误日志**: 验证错误详细日志
- **性能日志**: 性能相关日志记录

## 九、扩展性设计

### 9.1 新船型支持
- **配置模板**: 新船型配置模板
- **验证规则**: 可扩展的验证规则
- **约束定义**: 灵活的约束定义

### 9.2 新集装箱类型
- **类型注册**: 新集装箱类型注册机制
- **约束扩展**: 新类型约束扩展
- **验证扩展**: 新类型验证逻辑扩展

### 9.3 新业务规则
- **规则引擎**: 可配置的业务规则引擎
- **规则版本**: 业务规则版本管理
- **规则测试**: 业务规则测试框架

## 十、总结

通过船体结构的详细定义和与积载计划的深度集成，系统能够：

1. **精确管理容量**: 基于实际船体结构的精确容量管理
2. **智能位置分配**: 基于约束的智能位置分配
3. **实时验证**: 积载计划的实时验证和错误检测
4. **稳定性保证**: 确保船舶装载的稳定性
5. **操作安全**: 保证装卸操作的安全性

这种设计确保了TOS系统在船舶积载计划方面的准确性和可靠性，为港口作业提供了强有力的技术支撑。 