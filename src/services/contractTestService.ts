import { ethers } from 'ethers';
import contractUtils, { validateAndFormatAddress } from './contractUtils';

export class ContractTestService {
  // 获取合约实例
  getContractInstance(signer?: ethers.Signer) {
    if (signer) {
      return contractUtils.getContractWithSigner(signer);
    }
    return contractUtils.factory;
  }

  // 创建一个新团队
  async createTeam(
    signer: ethers.Signer, 
    teamName: string, 
    teamTokenURI: string
  ) {
    try {
      const contractWithSigner = contractUtils.getContractWithSigner(signer);
      
      // 获取当前gas价格
      const gasPrice = await contractUtils.getGasPrice();
      
      // 设置0.1 ETH作为转账金额
      const value = ethers.parseEther("0.1");
      console.log('转账金额:', ethers.formatEther(value), 'ETH');
      
      // 调用合约创建团队方法
      const tx = await (contractWithSigner as any).createTeam(
        teamName,
        teamTokenURI,
        {
          gasLimit: 500000,
          maxFeePerGas: gasPrice.maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas,
          value: value // 添加0.1 ETH作为msg.value
        }
      );
      
      console.log('交易已提交:', tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log('交易已确认，区块号:', receipt?.blockNumber);
      
      // 从事件中获取团队ID
      const teamCreatedEvent = contractUtils.parseEventFromLogs(receipt?.logs, 'TeamCreated');
      
      if (teamCreatedEvent) {
        const teamId = Number(teamCreatedEvent.args[1]); // 团队ID在事件参数中的位置
        console.log('团队创建成功! 团队ID:', teamId);
        return { teamId, txHash: tx.hash };
      }
      
      throw new Error('无法从交易收据中找到TeamCreated事件');
    } catch (error) {
      console.error('创建团队时出错:', error);
      throw error;
    }
  }
  
  
  // 更新团队成员URIs
  async updateTeamMemberURIs(
    signer: ethers.Signer,
    teamId: number,
    teamName: string,
    newTokenURIs: string[]
  ) {
    try {
      const contractWithSigner = contractUtils.getContractWithSigner(signer);
      
      // 获取当前gas价格
      const gasPrice = await contractUtils.getGasPrice();
      
      console.log('更新团队成员URIs参数:', {
        teamId,
        teamName,
        newTokenURIsCount: newTokenURIs.length
      });
      
      // 调用合约更新团队成员URIs方法
      const tx = await (contractWithSigner as any).updateTeamMemberURIs(
        teamId,
        teamName,
        newTokenURIs,
        {
          gasLimit: 1000000, // 增加gas限制，因为这可能是一个耗费gas的操作
          maxFeePerGas: gasPrice.maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
        }
      );
      
      console.log('交易已提交:', tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log('交易已确认，区块号:', receipt?.blockNumber);
      
      // 从事件中获取更新信息
      const teamURIsUpdatedEvent = contractUtils.parseEventFromLogs(receipt?.logs, 'TeamURIsUpdated');
      
      if (teamURIsUpdatedEvent) {
        const memberIds = teamURIsUpdatedEvent.args[2]; // 成员IDs在事件参数中的位置
        console.log('团队成员URIs更新成功! 更新的成员IDs:', memberIds);
        return { teamId, memberIds, txHash: tx.hash };
      }
      
      throw new Error('无法从交易收据中找到TeamURIsUpdated事件');
    } catch (error) {
      console.error('更新团队成员URIs时出错:', error);
      throw error;
    }
  }
} 