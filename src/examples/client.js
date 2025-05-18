/**
 * 一个用于测试后端API的客户端示例
 */
const axios = require('axios');

const API_URL = 'http://localhost:3000';

/**
 * 获取所有团队
 */
async function getAllTeams() {
  try {
    const response = await axios.get(`${API_URL}/api/teams`);
    console.log('所有团队:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取团队列表失败:', error.response?.data || error.message);
  }
}

/**
 * 获取特定团队的详细信息
 * @param {number} teamId 团队ID
 */
async function getTeamDetails(teamId) {
  try {
    const response = await axios.get(`${API_URL}/api/teams/${teamId}`);
    console.log(`团队 ${teamId} 的详情:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`获取团队 ${teamId} 详情失败:`, error.response?.data || error.message);
  }
}

/**
 * 获取特定团队的所有成员
 * @param {number} teamId 团队ID
 */
async function getTeamMembers(teamId) {
  try {
    const response = await axios.get(`${API_URL}/api/members/team/${teamId}`);
    console.log(`团队 ${teamId} 的成员:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`获取团队 ${teamId} 成员失败:`, error.response?.data || error.message);
  }
}

/**
 * 创建入队申请
 * @param {Object} requestData 申请数据
 * @param {string} requestData.applicant 申请人地址
 * @param {number} requestData.teamId 团队ID
 * @param {string} requestData.name 申请人名称
 * @param {number} requestData.role 申请角色
 */
async function createJoinRequest(requestData) {
  try {
    const response = await axios.post(`${API_URL}/api/join-requests`, requestData);
    console.log('入队申请已创建:', response.data);
    return response.data;
  } catch (error) {
    console.error('创建入队申请失败:', error.response?.data || error.message);
  }
}

/**
 * 查看用户的入队申请
 * @param {string} address 用户地址
 */
async function getUserJoinRequests(address) {
  try {
    const response = await axios.get(`${API_URL}/api/join-requests/applicant/${address}`);
    console.log(`用户 ${address} 的入队申请:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`获取用户 ${address} 入队申请失败:`, error.response?.data || error.message);
  }
}

/**
 * 处理入队申请
 * @param {number} requestId 申请ID
 * @param {string} status 申请状态 'APPROVED' 或 'REJECTED'
 */
async function processJoinRequest(requestId, status) {
  try {
    const response = await axios.patch(`${API_URL}/api/join-requests/${requestId}`, { status });
    console.log(`入队申请 ${requestId} 已处理:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`处理入队申请 ${requestId} 失败:`, error.response?.data || error.message);
  }
}

// 演示使用
async function runDemo() {
  console.log('API客户端演示开始...\n');
  
  // 获取所有团队
  await getAllTeams();
  
  // 假设有一个ID为1的团队
  const teamId = 1;
  await getTeamDetails(teamId);
  await getTeamMembers(teamId);
  
  // 创建入队申请
  const demoAddress = '0x0000000000000000000000000000000000000001';
  await createJoinRequest({
    applicant: demoAddress,
    teamId: teamId,
    name: '测试用户',
    role: 3
  });
  
  // 查看用户申请
  await getUserJoinRequests(demoAddress);
  
  console.log('\nAPI客户端演示结束');
}

// 如果直接运行此文件，则执行演示
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = {
  getAllTeams,
  getTeamDetails,
  getTeamMembers,
  createJoinRequest,
  getUserJoinRequests,
  processJoinRequest,
  runDemo
}; 