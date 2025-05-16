import { TeamJoinRequestService } from '../services/teamJoinRequestService';
import { ContractTestService } from '../services/contractTestService';
import { ethers } from 'ethers';
import contractUtils from '../services/contractUtils';

// 初始化服务实例
const teamJoinRequestService = new TeamJoinRequestService();
const contractTestService = new ContractTestService();

// 钱包配置
const privateKeys = {
  captain: '0cfa3dff5e87974bff21af63c801c883686dc0b00036ab52267f66cc0b79b180',
  member1: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a',
  member2: '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6'
};

// 创建钱包实例
const captainWallet = new ethers.Wallet(privateKeys.captain, contractUtils.provider);
const member1Wallet = new ethers.Wallet(privateKeys.member1, contractUtils.provider);
const member2Wallet = new ethers.Wallet(privateKeys.member2, contractUtils.provider);

// IPFS网关前缀
const IPFS_GATEWAY = 'ipfs://';

async function main() {
  try {
    console.log('=== 开始测试流程 ===');
    
    // 0. 创建队伍
    console.log('\n[队长] 创建新队伍...');
    const teamName = '黑客马拉松测试队伍';
    const teamTokenURI = `${IPFS_GATEWAY}team-metadata-uri`;
    
    let TEAM_ID;
    try {
      const createTeamResult = await contractTestService.createTeam(
        captainWallet,
        teamName,
        teamTokenURI
      );
      
      console.log('队伍创建结果:', createTeamResult);
      TEAM_ID = createTeamResult.teamId;
      
      // 等待区块确认
      await new Promise(resolve => setTimeout(resolve, 10000));

    } catch (error) {
      // 如果创建失败，使用默认队伍ID
      TEAM_ID = 0;
      console.log('使用默认队伍ID:', TEAM_ID);
    }

    // 1. 队员1提交申请
    console.log('\n[队员1] 提交入队申请...');
    const member1Address = await member1Wallet.getAddress();
    console.log('队员1地址:', member1Address);
    const member1Request = await teamJoinRequestService.createJoinRequest(
      member1Address,
      TEAM_ID,
      '队员A',
      2 // 假设角色ID为2
    );
    console.log('申请创建成功:', member1Request);

    // 2. 队员2提交申请
    console.log('\n[队员2] 提交入队申请...');
    const member2Address = await member2Wallet.getAddress();
    console.log('队员2地址:', member2Address);
    const member2Request = await teamJoinRequestService.createJoinRequest(
      member2Address,
      TEAM_ID,
      '队员B',
      3 // 假设角色ID为3
    );
    console.log('申请创建成功:', member2Request);

    // 3. 队长查看所有待处理申请
    console.log('\n[队长] 查看待处理申请...');
    const pendingRequests = await teamJoinRequestService.getPendingRequests(TEAM_ID);
    console.log('当前待处理申请:', pendingRequests);

    // 4. 处理申请（批准队员1，拒绝队员2）
    console.log('\n[队长] 开始处理申请...');
    
    // 4.1 批准队员1
    console.log('处理申请ID:', pendingRequests[0].id, '(批准)');
    const approvedRequest = await teamJoinRequestService.handleRequest(
      pendingRequests[0].id,
      true,
      captainWallet
    );
    console.log('申请已批准:', approvedRequest);

    // 4.2 拒绝队员2
    console.log('\n处理申请ID:', pendingRequests[1].id, '(拒绝)');
    const rejectedRequest = await teamJoinRequestService.handleRequest(
      pendingRequests[1].id,
      false,
      captainWallet
    );
    console.log('申请已拒绝:', rejectedRequest);

    // 5. 最终状态验证
    console.log('\n=== 最终状态验证 ===');
    const allRequests = await teamJoinRequestService.getTeamRequests(TEAM_ID);
    console.log('队伍所有申请状态:');
    allRequests.forEach(req => {
      console.log(`ID: ${req.id}, 申请人: ${req.applicant}, 状态: ${req.status}`);
    });
   
    console.log('\n=== 测试完成 ===');
  } catch (error) {
    console.error('测试流程出错:', error);
  }
}

main();