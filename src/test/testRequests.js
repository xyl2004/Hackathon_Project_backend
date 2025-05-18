const axios = require('axios');
const { supabase } = require('../supabase');

// API基础URL
const API_URL = 'http://localhost:3000';

// 测试数据
const TEST_TEAM_ID = 0;
const CAPTAIN_ADDRESS = '0x65F11439C3a958b1beEAE65a245bf21C551B886d';
const TEST_APPLICANTS = [
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb1',
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb2',
  '0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb3',
];

// 创建测试团队
async function ensureTeamExists() {
  try {
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
    
    // 创建测试团队
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
    return data[0];
  } catch (error) {
    console.error('❌ 创建测试团队失败:', error.message);
    throw error;
  }
}

// 创建各种状态的测试申请
async function createTestRequests() {
  try {
    // 清除现有申请
    const { error: deleteError } = await supabase
      .from('team_join_requests')
      .delete()
      .eq('team_id', TEST_TEAM_ID);
      
    if (deleteError) throw deleteError;
    
    // 创建不同状态的申请
    const statuses = ['PENDING', 'APPROVED', 'REJECTED'];
    
    for (let i = 0; i < TEST_APPLICANTS.length; i++) {
      for (let j = 0; j < statuses.length; j++) {
        const { error } = await supabase
          .from('team_join_requests')
          .insert([
            {
              applicant: TEST_APPLICANTS[i],
              team_id: TEST_TEAM_ID,
              name: `测试申请人 ${i}-${j}`,
              role: 2,
              status: statuses[j]
            }
          ]);
        
        if (error) throw error;
      }
    }
    
    console.log(`✅ 成功创建共 ${TEST_APPLICANTS.length * statuses.length} 个测试申请`);
  } catch (error) {
    console.error('❌ 创建测试申请失败:', error.message);
    throw error;
  }
}

// 测试获取团队所有申请
async function testGetTeamRequests() {
  try {
    const response = await axios.get(`${API_URL}/api/teams/${TEST_TEAM_ID}/requests`);
    console.log(`✅ 团队申请列表:`, response.data);
    
    // 测试按状态筛选
    const pendingResponse = await axios.get(`${API_URL}/api/teams/${TEST_TEAM_ID}/requests?status=pending`);
    console.log(`✅ 团队待处理申请:`, pendingResponse.data);
  } catch (error) {
    console.error('❌ 测试获取团队申请失败:', error.response?.data || error.message);
  }
}

// 测试获取团队申请统计
async function testGetTeamRequestStats() {
  try {
    const response = await axios.get(`${API_URL}/api/join-requests/team/${TEST_TEAM_ID}/stats`);
    console.log(`✅ 团队申请统计:`, response.data);
  } catch (error) {
    console.error('❌ 测试获取团队申请统计失败:', error.response?.data || error.message);
  }
}

// 测试获取团队待处理申请数量
async function testGetPendingCount() {
  try {
    const response = await axios.get(`${API_URL}/api/teams/${TEST_TEAM_ID}/pending-count`);
    console.log(`✅ 团队待处理申请数量:`, response.data);
  } catch (error) {
    console.error('❌ 测试获取团队待处理申请数量失败:', error.response?.data || error.message);
  }
}

// 运行测试
async function runTests() {
  try {
    console.log('🧪 开始测试申请相关API...');
    
    // 确保测试团队和申请存在
    await ensureTeamExists();
    await createTestRequests();
    
    // 测试API
    await testGetTeamRequests();
    await testGetTeamRequestStats();
    await testGetPendingCount();
    
    console.log('🎉 测试完成!');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 执行测试
runTests(); 