import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { ethers } from 'ethers';
import contractUtils, { validateAndFormatAddress } from './contractUtils';
import { TeamService } from './teamService';

const prisma = new PrismaClient()
  .$extends(withAccelerate());

// 初始化服务
const teamService = new TeamService();

export class ContractEventService {
  // 处理队伍创建事件
  async handleTeamCreated(captain: string, teamId: number, name: string, tokenURI: string) {
    try {
      // 规范化地址
      const formattedCaptain = validateAndFormatAddress(captain);
      
      // 检查队长是否已有队伍
      if (await teamService.isAlreadyCaptain(formattedCaptain)) {
        console.log(`Address ${formattedCaptain} is already a captain of another team`);
        return;
      }

      await prisma.team.create({
        data: {
          id: teamId,
          name,
          tokenURI,
          captainAddress: formattedCaptain.toLowerCase(),
        }
      });
      console.log(`Team created - ID: ${teamId}, Captain: ${formattedCaptain}`);
    } catch (error) {
      console.error('Error handling TeamCreated event:', error);
    }
  }

  // 处理成员添加事件
  async handleMemberAdded(member: string, teamId: number, name: string, role: number, memberId: number, tokenURI: string) {
    try {
      // 规范化地址
      const formattedMember = validateAndFormatAddress(member);
      
      // 检查是否已经是队员或队长
      if (await teamService.isAlreadyMember(formattedMember) || await teamService.isAlreadyCaptain(formattedMember)) {
        console.log(`Address ${formattedMember} is already a member or captain`);
        return;
      }

      await prisma.member.create({
        data: {
          id: memberId,
          name,
          tokenURI,
          address: formattedMember.toLowerCase(),
          role,
          teamId
        }
      });
      console.log(`Member added - ID: ${memberId}, Team: ${teamId}, Member: ${formattedMember}`);
    } catch (error) {
      console.error('Error handling MemberAdded event:', error);
    }
  }

  // 处理队伍URI更新事件
  async handleTeamURIsUpdated(teamId: number, teamName: string, memberIds: number[]) {
    try {
      // 更新队伍名称
      await prisma.team.update({
        where: { id: teamId },
        data: { name: teamName }
      });
      console.log(`Team URIs updated - Team: ${teamId}`);
    } catch (error) {
      console.error('Error handling TeamURIsUpdated event:', error);
    }
  }

  // 处理队伍解散事件
  async handleTeamDissolved(teamId: number, captain: string, returnedAmount: ethers.BigNumberish) {
    try {
      // 删除队伍及其成员
      await prisma.$transaction([
        prisma.member.deleteMany({
          where: { teamId }
        }),
        prisma.team.delete({
          where: { id: teamId }
        })
      ]);
      console.log(`Team dissolved - Team: ${teamId}, Captain: ${captain}`);
    } catch (error) {
      console.error('Error handling TeamDissolved event:', error);
    }
  }

  // 启动事件监听
  async startEventListening() {
    console.log('Starting event listeners...');
    
    const factory = contractUtils.factory;

    // 监听队伍创建事件
    factory.on('TeamCreated', async (captain, teamId, name, tokenURI) => {
      await this.handleTeamCreated(captain, Number(teamId), name, tokenURI);
    });

    // 监听成员添加事件
    factory.on('MemberAdded', async (member, teamId, name, role, memberId, tokenURI) => {
      await this.handleMemberAdded(member, Number(teamId), name, Number(role), Number(memberId), tokenURI);
    });

    // 监听队伍URI更新事件
    factory.on('TeamURIsUpdated', async (teamId, teamName, memberIds) => {
      await this.handleTeamURIsUpdated(Number(teamId), teamName, memberIds.map((id: string) => Number(id)));
    });

    // 监听队伍解散事件
    factory.on('TeamDissolved', async (teamId, captain, returnedAmount) => {
      await this.handleTeamDissolved(Number(teamId), captain, returnedAmount);
    });

    console.log('Event listeners started');
  }
} 