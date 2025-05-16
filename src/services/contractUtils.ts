import { ethers } from 'ethers';
import NFTFactoryABI from '../../../Project_backend/Abi/NFTFactory.json';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY || 'cKsGKndbjjbgerDIj7dlAjh9LtEWCMvD';
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0x6d1EafbDa84661AC37b8398404197bAc1146380D';

// 创建Web3提供者和合约实例
const provider = new ethers.WebSocketProvider(`wss://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}`);
const factory = new ethers.Contract(FACTORY_ADDRESS, NFTFactoryABI.abi, provider);

// 通用的地址处理工具
export function validateAndFormatAddress(address: string): string {
  if (!ethers.isAddress(address)) {
    throw new Error(`无效的地址: ${address}`);
  }
  return ethers.getAddress(address);
}

// 工具类导出
export default {
  provider,
  factory,
  FACTORY_ADDRESS,
  
  // 获取带签名者的合约实例
  getContractWithSigner(signer: ethers.Signer) {
    return factory.connect(signer);
  },
  
  // 获取Gas价格信息
  async getGasPrice() {
    return await provider.getFeeData();
  },
  
  // 从日志中提取事件
  parseEventFromLogs(logs: ethers.Log[], eventName: string) {
    return logs
      .map((log: ethers.Log) => {
        try {
          return factory.interface.parseLog(log);
        } catch (e) {
          return null;
        }
      })
      .filter((event: any) => event && event.name === eventName)
      .at(0);
  },
  
  // 关闭连接
  closeConnection() {
    provider.destroy();
  }
}; 