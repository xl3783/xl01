/**
 * 服务器测试脚本
 * 用于验证TOS Express后端的基本功能
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testHealthCheck() {
    try {
        console.log('🔍 测试健康检查...');
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ 健康检查通过:', response.data);
        return true;
    } catch (error) {
        console.error('❌ 健康检查失败:', error.message);
        return false;
    }
}

async function testCreateVesselVisit() {
    try {
        console.log('🚢 测试创建船舶访问...');
        const vesselVisitData = {
            vesselId: 'TEST_VESSEL_001',
            visitDetails: {
                eta: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 明天
                etd: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 后天
                berthId: 'TEST_BERTH_01',
                agent: 'TEST_AGENT',
                remarks: '测试船舶访问'
            }
        };

        const response = await axios.post(`${BASE_URL}/api/vessel-visits`, vesselVisitData);
        console.log('✅ 船舶访问创建成功:', response.data.data.id);
        return response.data.data.id;
    } catch (error) {
        console.error('❌ 创建船舶访问失败:', error.response?.data || error.message);
        return null;
    }
}

async function testGetVesselVisits() {
    try {
        console.log('📋 测试获取船舶访问列表...');
        const response = await axios.get(`${BASE_URL}/api/vessel-visits`);
        console.log('✅ 获取船舶访问列表成功:', response.data.data.length, '条记录');
        return true;
    } catch (error) {
        console.error('❌ 获取船舶访问列表失败:', error.response?.data || error.message);
        return false;
    }
}

async function testGetStatistics() {
    try {
        console.log('📊 测试获取统计信息...');
        const response = await axios.get(`${BASE_URL}/api/vessel-visits/statistics`);
        console.log('✅ 获取统计信息成功:', response.data.data);
        return true;
    } catch (error) {
        console.error('❌ 获取统计信息失败:', error.response?.data || error.message);
        return false;
    }
}

async function testVesselVisitLifecycle(visitId) {
    if (!visitId) {
        console.log('⚠️ 跳过生命周期测试（无有效的访问ID）');
        return;
    }

    try {
        console.log('🔄 测试船舶访问生命周期...');

        // 开始访问
        console.log('  → 开始船舶访问...');
        await axios.post(`${BASE_URL}/api/vessel-visits/${visitId}/start`);
        console.log('  ✅ 船舶访问已开始');

        // 完成访问
        console.log('  → 完成船舶访问...');
        await axios.post(`${BASE_URL}/api/vessel-visits/${visitId}/complete`);
        console.log('  ✅ 船舶访问已完成');

        console.log('✅ 船舶访问生命周期测试完成');
    } catch (error) {
        console.error('❌ 船舶访问生命周期测试失败:', error.response?.data || error.message);
    }
}

async function runTests() {
    console.log('🚀 开始TOS服务器测试...\n');

    // 测试健康检查
    const healthOk = await testHealthCheck();
    if (!healthOk) {
        console.log('\n❌ 服务器未启动或健康检查失败，请确保服务器正在运行');
        return;
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 测试船舶访问功能
    const visitId = await testCreateVesselVisit();
    await testGetVesselVisits();
    await testGetStatistics();
    await testVesselVisitLifecycle(visitId);

    console.log('\n' + '='.repeat(50));
    console.log('🎉 所有测试完成！');
}

// 运行测试
if (require.main === module) {
    runTests().catch(console.error);
}

module.exports = {
    testHealthCheck,
    testCreateVesselVisit,
    testGetVesselVisits,
    testGetStatistics,
    testVesselVisitLifecycle
}; 