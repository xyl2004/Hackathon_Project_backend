import { PrismaClient, RequestStatus } from '@prisma/client';
import { ethers } from 'ethers';
import contractUtils, { validateAndFormatAddress } from './contractUtils';
import { TeamService } from './teamService';

const prisma = new PrismaClient();
const teamService = new TeamService();

export class TeamJoinRequestService {
    // 创建入队申请
    async createJoinRequest(
        applicantAddress: string,
        teamId: number,
        name: string,
        role: number,
    ) {
        // 确保地址格式正确
        const formattedAddress = validateAndFormatAddress(applicantAddress);
        
        // 检查申请人是否已经是队员或队长
        const isExistingMember = await teamService.isAlreadyMember(formattedAddress);
        const isExistingCaptain = await teamService.isAlreadyCaptain(formattedAddress);

        if (isExistingMember || isExistingCaptain) {
            throw new Error('Applicant is already a member or captain of a team');
        }

        // 检查是否有待处理的申请
        const pendingRequest = await prisma.teamJoinRequest.findFirst({
            where: {
                applicant: formattedAddress.toLowerCase(),
                status: RequestStatus.PENDING
            }
        });

        if (pendingRequest) {
            throw new Error('Applicant already has a pending request');
        }

        // 创建新的申请
        return await prisma.teamJoinRequest.create({
            data: {
                applicant: formattedAddress.toLowerCase(),
                teamId,
                name,
                role,
            }
        });
    }

    // 获取队伍的所有申请
    async getTeamRequests(teamId: number) {
        return await prisma.teamJoinRequest.findMany({
            where: { teamId }
        });
    }

    // 获取待处理的申请
    async getPendingRequests(teamId: number) {
        return await prisma.teamJoinRequest.findMany({
            where: {
                teamId,
                status: RequestStatus.PENDING
            }
        });
    }

    // 处理申请
    async handleRequest(
        requestId: number,
        approved: boolean,
        signer: ethers.Signer
    ) {
        const request = await prisma.teamJoinRequest.findUnique({
            where: { id: requestId },
            include: { team: true }
        });

        if (!request) {
            throw new Error('Request not found');
        }

        if (request.status !== RequestStatus.PENDING) {
            throw new Error('Request has already been processed');
        }

        // 连接合约
        const factoryWithSigner = contractUtils.getContractWithSigner(signer);

        if (approved) {
            try {
                // 获取当前gas价格
                const gasPrice = await contractUtils.getGasPrice();
                
                // 确保地址格式正确
                const formattedAddress = validateAndFormatAddress(request.applicant);
                
                console.log('添加成员参数:', {
                    applicant: formattedAddress,
                    teamId: request.teamId,
                    name: request.name,
                    role: request.role
                });
                
                // 调用合约添加成员
                const tx = await (factoryWithSigner as any).addMember(
                    formattedAddress,
                    request.teamId,
                    request.name,
                    request.role,
                    `ipfs://member-${formattedAddress.substring(2, 10)}-metadata`,
                    {
                        gasLimit: 500000,
                        maxFeePerGas: gasPrice.maxFeePerGas,
                        maxPriorityFeePerGas: gasPrice.maxPriorityFeePerGas
                    }
                );
                
                console.log('添加成员交易已提交:', tx.hash);
                
                // 等待交易确认
                const receipt = await tx.wait();
                console.log('交易已确认，区块号:', receipt?.blockNumber);

                // 更新申请状态为已通过
                await prisma.teamJoinRequest.update({
                    where: { id: requestId },
                    data: { status: RequestStatus.APPROVED }
                });
            } catch (error) {
                console.error('Error adding member:', error);
                throw error;
            }
        } else {
            // 直接更新申请状态为已拒绝
            await prisma.teamJoinRequest.update({
                where: { id: requestId },
                data: { status: RequestStatus.REJECTED }
            });
        }

        return await prisma.teamJoinRequest.findUnique({
            where: { id: requestId }
        });
    }
} 