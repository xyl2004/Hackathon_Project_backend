/**
 * 调试入队申请请求参数格式问题
 */
const axios = require('axios');
require('dotenv').config();

const API_URL = 'http://localhost:3000';

/**
 * 尝试不同的请求体格式
 */
async function testRequestFormats() {
  console.log('=== 入队申请请求参数格式调试 ===\n');
  
  // 尝试不同的请求格式
  const testCases = [
    {
      name: '✅ 正确格式(使用team_id，数字类型)',
      data: {
        applicant: '0x123456789abcdef0123456789abcdef01234beef',
        team_id: 0, 
        name: '测试申请者',
        role: 3
      }
    },
    {
      name: '使用team_id，字符串类型',
      data: {
        applicant: '0x123456789abcdef0123456789abcdef01234beef',
        team_id: '0',
        name: '测试申请者',
        role: 3
      }
    },
    {
      name: '使用驼峰命名法(teamId)',
      data: {
        applicant: '0x123456789abcdef0123456789abcdef01234beef',
        teamId: 0,
        name: '测试申请者',
        role: 3
      }
    },
    {
      name: '同时使用两种命名方式',
      data: {
        applicant: '0x123456789abcdef0123456789abcdef01234beef',
        teamId: 0,
        team_id: 0,
        name: '测试申请者',
        role: 3
      }
    }
  ];
  
  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n[测试${i+1}] ${testCase.name}`);
    console.log('请求数据:', JSON.stringify(testCase.data, null, 2));
    
    try {
      const headers = { 'Content-Type': 'application/json' };
      const response = await axios.post(`${API_URL}/api/join-requests`, testCase.data, { headers });
      
      console.log('✅ 成功! 状态码:', response.status);
      console.log('响应:', response.data);
    } catch (error) {
      console.error('❌ 失败!');
      
      if (error.response) {
        console.error('状态码:', error.response.status);
        console.error('错误信息:', error.response.data);
      } else {
        console.error('错误:', error.message);
      }
    }
    
    console.log('\n---');
  }
  
  console.log('\n=== 调试总结 ===');
  console.log('根据数据库表结构，应该使用 team_id 而不是 teamId 作为字段名');
  console.log('数据库字段名都是使用下划线命名法：applicant, team_id, name, role, status');
  console.log('虽然服务器有做兼容处理，但最好使用与数据库一致的下划线命名法');
}

/**
 * 检查团队是否存在
 */
async function checkTeamExists() {
  try {
    console.log('\n检查teamId=0的团队是否存在...');
    
    const response = await axios.get(`${API_URL}/api/teams/0`);
    
    console.log('✅ 团队存在!');
    console.log('团队信息:', response.data.data);
    
    return true;
  } catch (error) {
    console.error('❌ 团队不存在或查询出错:');
    
    if (error.response && error.response.status === 404) {
      console.error('团队ID=0不存在，这会导致入队申请失败。');
      console.error('请先运行 npm run test:full 创建测试团队。');
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
 * 运行调试测试
 */
async function runDebug() {
  console.log('👉 根据表结构 team_join_requests，字段名应使用下划线命名法：team_id\n');
  
  // 先检查团队是否存在
  const teamExists = await checkTeamExists();
  
  if (!teamExists) {
    console.log('\n⚠️ 警告: 团队不存在，此测试可能全部失败');
    console.log('请先运行 npm run test:full 创建测试团队\n');
  }
  
  // 测试不同的请求体格式
  await testRequestFormats();
}

// 执行
if (require.main === module) {
  runDebug().catch(err => {
    console.error('调试过程中发生未捕获的错误:', err);
    process.exit(1);
  });
}

module.exports = {
  testRequestFormats,
  checkTeamExists,
  runDebug
}; 