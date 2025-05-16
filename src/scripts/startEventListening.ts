import { ContractEventService } from '../services/contractEventService';
import { PrismaClient } from '@prisma/client';
import contractUtils from '../services/contractUtils';

const prisma = new PrismaClient();
const eventService = new ContractEventService();

// 主函数
async function main() {
  try {
    await eventService.startEventListening();
    
    // 保持程序运行
    process.on('SIGINT', async () => {
      console.log('Shutting down...');
      await prisma.$disconnect();
      contractUtils.closeConnection();
      process.exit();
    });
  } catch (error) {
    console.error('Error in main:', error);
    await prisma.$disconnect();
    contractUtils.closeConnection();
    process.exit(1);
  }
}

// 启动监听
if (require.main === module) {
  main();
} 