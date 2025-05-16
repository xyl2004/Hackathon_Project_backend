import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';
import { validateAndFormatAddress } from '../services/contractUtils';

const prisma = new PrismaClient()
  .$extends(withAccelerate());

export class TeamService {
  // 查询函数
  async getTeamInfo(teamId: number) {
    return await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true }
    });
  }

  async getTeamMembers(teamId: number) {
    return await prisma.member.findMany({
      where: { teamId }
    });
  }

  async getMemberInfo(memberId: number) {
    return await prisma.member.findUnique({
      where: { id: memberId },
      include: { team: true }
    });
  }
  
  // 检查地址是否已经是队长
  async isAlreadyCaptain(address: string): Promise<boolean> {
    // 规范化地址
    const formattedAddress = validateAndFormatAddress(address).toLowerCase();
    
    const existingTeam = await prisma.team.findFirst({
      where: {
        captainAddress: formattedAddress
      }
    });
    return !!existingTeam;
  }

  // 检查地址是否已经是队员
  async isAlreadyMember(address: string): Promise<boolean> {
    // 规范化地址
    const formattedAddress = validateAndFormatAddress(address).toLowerCase();
    
    const existingMember = await prisma.member.findFirst({
      where: {
        address: formattedAddress
      }
    });
    return !!existingMember;
  }
} 