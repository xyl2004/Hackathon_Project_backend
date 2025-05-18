/**
 * 完整测试流程：创建团队并测试入队申请
 */
const axios = require('axios');
const { supabase } = require('../supabase');
require('dotenv').config();

const API_URL = 'http://localhost:3000';

// 测试数据
const TEST_TEAM_ID = 0;  // 指定团队ID为0
const CAPTAIN_ADDRESS = '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1';
const APPLICANT_ADDRESS = '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1';

/**
 * 通过Supabase直接创建测试团队
 */
async function createTestTeam() {
  try {
    console.log('直接在数据库中创建测试团队(ID=0)...');
    
    // 检查团队是否已存在
    const { data: existingTeam, error: checkError } = await supabase
      .from('teams')
      .select('id')
      .eq('id', TEST_TEAM_ID)
      .maybeSingle();
    
    if (checkError) throw checkError;
    
    if (existingTeam) {
      console.log(`✅ 团队ID=${TEST_TEAM_ID}已存在，无需创建`);
      return existingTeam;
    }
    
    // 插入新团队
    const { data, error } = await supabase
      .from('teams')
      .insert([
        {
          id: TEST_TEAM_ID,
          name: '测试团队',
          token_uri: 'ipfs://test-team-uri',
          captain_address: CAPTAIN_ADDRESS
        }
      ])
      .select();
    
    if (error) throw error;
    
    console.log(`✅ 成功创建测试团队: ID=${TEST_TEAM_ID}`);
    console.log('团队数据:', data[0]);
    
    return data[0];
  } catch (error) {
    console.error('❌ 创建测试团队失败:', error.message);
    throw error;
  }
}

/**
 * 验证团队是否已创建
 */
async function verifyTeamExists() {
  try {
    console.log(`\n验证团队ID=${TEST_TEAM_ID}是否存在...`);
    
    const response = await axios.get(`${API_URL}/api/teams/${TEST_TEAM_ID}`);
    
    console.log('✅ 通过API验证团队存在');
    console.log('团队数据:', response.data.data);
    
    return response.data.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.error(`❌ 团队ID=${TEST_TEAM_ID}不存在`);
    } else {
      console.error('❌ 验证团队存在时出错:', error.message);
    }
    return null;
  }
}

/**
 * 创建入队申请
 */
async function createJoinRequest() {
  try {
    console.log(`\n创建入队申请(team_id=${TEST_TEAM_ID})...`);
    
    // 使用数据库的字段名格式
    const requestData = {
      applicant: APPLICANT_ADDRESS,
      team_id: TEST_TEAM_ID,  // 使用正确的字段名(下划线)
      name: '测试申请者',
      role: 3 // 普通队员
    };
    
    console.log('请求数据:', JSON.stringify(requestData, null, 2));
    console.log('参数类型检查:');
    console.log('- applicant: ', typeof requestData.applicant);
    console.log('- team_id: ', typeof requestData.team_id);
    console.log('- name: ', typeof requestData.name);
    console.log('- role: ', typeof requestData.role);
    
    // 明确设置Content-Type
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const response = await axios.post(
      `${API_URL}/api/join-requests`, 
      requestData,
      { headers }
    );
    
    console.log('✅ 成功创建入队申请');
    console.log('响应数据:', response.data);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ 创建入队申请失败:');
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
      
      // 详细的调试信息
      if (error.response.status === 400) {
        console.log('\n🔍 参数问题诊断:');
        console.log('发送的实际请求体:', JSON.stringify(requestData, null, 2));
      }
    } else {
      console.error('错误:', error.message);
    }
    
    return null;
  }
}

/**
 * 获取团队的入队申请
 */
async function getTeamJoinRequests() {
  try {
    console.log(`\n获取团队ID=${TEST_TEAM_ID}的入队申请...`);
    
    const response = await axios.get(`${API_URL}/api/join-requests/team/${TEST_TEAM_ID}`);
    
    console.log('✅ 成功获取入队申请');
    console.log('申请数量:', response.data.data.length);
    console.log('申请列表:', response.data.data);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ 获取入队申请失败:');
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    
    return [];
  }
}

/**
 * 处理入队申请
 */
async function processJoinRequest(requestId, status) {
  try {
    console.log(`\n处理入队申请(ID=${requestId}, 状态=${status})...`);
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    const response = await axios.patch(
      `${API_URL}/api/join-requests/${requestId}`, 
      { status },
      { headers }
    );
    
    console.log(`✅ 成功${status === 'APPROVED' ? '批准' : '拒绝'}入队申请`);
    console.log('响应数据:', response.data);
    
    return response.data.data;
  } catch (error) {
    console.error('❌ 处理入队申请失败:');
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    
    return null;
  }
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  try {
    console.log('\n清理测试数据...');
    
    // 删除入队申请
    const { error: requestsError } = await supabase
      .from('team_join_requests')
      .delete()
      .eq('team_id', TEST_TEAM_ID);
    
    if (requestsError) throw requestsError;
    
    console.log('✅ 已删除测试入队申请');
    
    // 删除团队成员
    const { error: membersError } = await supabase
      .from('members')
      .delete()
      .eq('team_id', TEST_TEAM_ID);
    
    if (membersError) throw membersError;
    
    console.log('✅ 已删除测试团队成员');
    
    // 删除团队
    const { error: teamError } = await supabase
      .from('teams')
      .delete()
      .eq('id', TEST_TEAM_ID);
    
    if (teamError) throw teamError;
    
    console.log('✅ 已删除测试团队');
    
    return true;
  } catch (error) {
    console.error('❌ 清理测试数据失败:', error.message);
    return false;
  }
}

/**
 * 执行完整测试流程
 */
async function runFullTest(shouldCleanup = false) {
  console.log('=== 完整测试流程开始 ===\n');
  
  try {
    // 创建测试团队
    const team = await createTestTeam();
    if (!team) throw new Error('创建测试团队失败');
    
    // 验证团队存在
    const verifiedTeam = await verifyTeamExists();
    if (!verifiedTeam) throw new Error('无法通过API验证团队');
    
    // 创建入队申请
    const request = await createJoinRequest();
    if (!request) throw new Error('创建入队申请失败');
    
    // 获取团队的入队申请
    const requests = await getTeamJoinRequests();
    if (!requests || requests.length === 0) throw new Error('获取不到入队申请');
    
    // 处理入队申请(批准)
    const processedRequest = await processJoinRequest(requests[0].id, 'APPROVED');
    if (!processedRequest) throw new Error('处理入队申请失败');
    
    console.log('\n✅ 完整测试流程成功!');
  } catch (error) {
    console.error('\n❌ 测试流程失败:', error.message);
  } finally {
    // 清理测试数据(如果需要)
    if (shouldCleanup) {
      await cleanupTestData();
    }
    
    console.log('\n=== 完整测试流程结束 ===');
  }
}

// 执行测试
if (require.main === module) {
  // 参数：是否在测试后清理数据
  const shouldCleanup = process.argv.includes('--cleanup');
  
  runFullTest(shouldCleanup).catch(err => {
    console.error('测试过程中发生未捕获的错误:', err);
    process.exit(1);
  });
}

module.exports = {
  createTestTeam,
  verifyTeamExists,
  createJoinRequest,
  getTeamJoinRequests,
  processJoinRequest,
  cleanupTestData,
  runFullTest
}; 