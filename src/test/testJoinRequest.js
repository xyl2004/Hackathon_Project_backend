/**
 * 测试入队申请API的脚本 - 专门测试teamId为0的情况
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000';

/**
 * 测试创建入队申请
 */
async function testCreateJoinRequest() {
  try {
    console.log('测试创建入队申请 (team_id=0)...');
    
    // 创建测试数据 - 使用数据库中的字段名称(team_id)
    const testData = {
      applicant: '0x123456789abcdef0123456789abcdef01234beef', // 测试用钱包地址
      team_id: 0,                                              // 使用正确的字段名，与数据库保持一致
      name: '测试申请者',
      role: 3  // 普通队员角色
    };
    
    console.log('请求数据:', JSON.stringify(testData, null, 2));
    console.log('参数类型检查:');
    console.log('- applicant: ', typeof testData.applicant);
    console.log('- team_id: ', typeof testData.team_id);
    console.log('- name: ', typeof testData.name);
    console.log('- role: ', typeof testData.role);
    
    // 增加请求头，确保JSON内容类型
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // 发送POST请求创建入队申请
    const response = await axios.post(`${API_URL}/api/join-requests`, testData, { headers });
    
    console.log('\n✅ 创建入队申请成功!');
    console.log('状态码:', response.status);
    console.log('响应数据:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('\n❌ 创建入队申请失败:');
    
    if (error.response) {
      // 服务器响应了错误状态码
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
      
      // 检查是否是参数问题
      if (error.response.status === 400) {
        console.log('\n🔍 参数问题诊断:');
        
        // 检查后端路由处理逻辑
        console.log('数据库表结构中的字段为: team_id (注意与teamId的区别)');
        console.log('确保使用下划线命名风格: team_id 而不是 teamId');
        
        console.log('\n📋 请求体验证:');
        console.log('发送的实际请求体:', JSON.stringify(testData, null, 2));
        
        console.log('\n💡 可能的解决方案:');
        console.log('1. 确保使用team_id作为字段名，与数据库字段匹配');
        console.log('2. 检查team_id的类型，应该是数字而非字符串');
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('未收到服务器响应。请确保API服务器正在运行。');
    } else {
      // 设置请求时发生错误
      console.error('错误:', error.message);
    }
  }
}

/**
 * 查询teamId=0的所有入队申请
 */
async function getTeamJoinRequests() {
  try {
    console.log('\n获取teamId=0的所有入队申请...');
    
    const response = await axios.get(`${API_URL}/api/join-requests/team/0`);
    
    console.log('\n✅ 获取入队申请成功!');
    console.log('申请数量:', response.data.data.length);
    console.log('申请列表:', response.data.data);
    
    return response.data;
  } catch (error) {
    console.error('\n❌ 获取入队申请失败:');
    
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
  }
}

/**
 * 检查团队是否存在
 */
async function checkTeamExists() {
  try {
    console.log('\n检查teamId=0的团队是否存在...');
    
    const response = await axios.get(`${API_URL}/api/teams/0`);
    
    console.log('\n✅ 团队存在!');
    console.log('团队信息:', response.data.data);
    
    return true;
  } catch (error) {
    console.error('\n❌ 团队不存在或查询出错:');
    
    if (error.response && error.response.status === 404) {
      console.error('团队ID=0不存在，这可能导致入队申请失败。');
      console.error('请先确保该团队在数据库中存在。');
      console.error('可以运行完整测试(npm run test:full)来自动创建团队。');
    } else if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('错误信息:', error.response.data);
    } else {
      console.error('错误:', error.message);
    }
    
    return false;
  }
}

/**
 * 运行完整测试流程
 */
async function runTest() {
  console.log('=== 入队申请测试脚本启动 ===\n');
  
  // 先检查团队是否存在
  const teamExists = await checkTeamExists();
  
  if (teamExists) {
    console.log('\n团队存在，继续测试...');
  } else {
    console.log('\n⚠️ 警告: 团队不存在，请先运行 npm run test:full 创建测试团队');
    console.log('仍将尝试创建申请（预期会失败）');
  }
  
  // 尝试创建入队申请
  await testCreateJoinRequest();
  
  // 查询该团队的所有申请
  await getTeamJoinRequests();
  
  console.log('\n=== 入队申请测试完成 ===');
}

// 执行测试
if (require.main === module) {
  runTest().catch(err => {
    console.error('测试过程中发生未捕获的错误:', err);
    process.exit(1);
  });
}

module.exports = {
  testCreateJoinRequest,
  getTeamJoinRequests,
  checkTeamExists,
  runTest
}; 