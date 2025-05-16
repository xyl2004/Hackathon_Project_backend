import { TeamService } from './services/teamService';
import { ContractEventService } from './services/contractEventService';
import contractUtils from './services/contractUtils';

const teamService = new TeamService();
const eventService = new ContractEventService();

// 查询函数导出
export async function getTeamInfo(teamId: number) {
  return await teamService.getTeamInfo(teamId);
}

export async function getTeamMembers(teamId: number) {
  return await teamService.getTeamMembers(teamId);
}

export async function getMemberInfo(memberId: number) {
  return await teamService.getMemberInfo(memberId);
}

// 启动事件监听
export async function startEventListening() {
  return await eventService.startEventListening();
}

// 主函数
async function main() {
  try {
    await startEventListening();
    
    // 保持程序运行
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      contractUtils.closeConnection();
      process.exit();
    });
  } catch (error) {
    console.error('Error in main:', error);
    contractUtils.closeConnection();
    process.exit(1);
  }
}

// 如果直接运行此文件，启动监听
if (require.main === module) {
  main();
}
