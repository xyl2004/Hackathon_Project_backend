require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// 加载合约ABI
const nftFactoryAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../Abi/NFTFactory.json'), 'utf8'));

// Supabase配置
const supabaseUrl = 'https://raautdvmjylvbjisqosg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

// 确保有SUPABASE_KEY环境变量
if (!process.env.SUPABASE_KEY) {
  console.error('错误: 缺少SUPABASE_KEY环境变量。请创建.env文件并设置SUPABASE_KEY=您的服务端API密钥');
  process.exit(1);
}

// 区块链配置 - 请替换为实际的配置
const RPC_URL = process.env.RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/cKsGKndbjjbgerDIj7dlAjh9LtEWCMvD';  // 替换为你的节点URL
const NFT_FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0x6d1EafbDa84661AC37b8398404197bAc1146380D';  // 替换为NFT工厂合约地址

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

// 初始化ethers提供者和合约
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const nftFactoryContract = new ethers.Contract(NFT_FACTORY_ADDRESS, nftFactoryAbi, provider);

// 测试Supabase连接
async function testConnection() {
  try {
    const { data, error } = await supabase.from('teams').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log('Supabase连接成功！');
    return true;
  } catch (error) {
    console.error('Supabase连接错误:', error.message);
    return false;
  }
}

// 处理TeamCreated事件
async function handleTeamCreated(captain, teamId, name, tokenURI, event) {
  try {
    console.log(`检测到新队伍创建: TeamID=${teamId}, Captain=${captain}, Name=${name}`);

    // 插入队伍数据
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert([{
        id: Number(teamId),
        name,
        token_uri: tokenURI,
        captain_address: captain
      }])
      .select();

    if (teamError) {
      throw teamError;
    }

    console.log(`队伍数据已保存: TeamID=${teamId}`);
    return teamData;
  } catch (error) {
    console.error(`保存队伍数据失败: TeamID=${teamId}`, error);
  }
}

// 处理MemberAdded事件
async function handleMemberAdded(member, teamId, name, role, memberId, tokenURI, event) {
  try {
    console.log(`检测到新成员加入: MemberID=${memberId}, Member=${member}, TeamID=${teamId}, Role=${role},tokenURI=${tokenURI}`);

    // 插入成员数据
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .insert([{
        id: Number(memberId),
        name,
        token_uri: tokenURI,
        address: member,
        role: Number(role),
        team_id: Number(teamId)
      }])
      .select();

    if (memberError) {
      throw memberError;
    }

    console.log(`成员数据已保存: MemberID=${memberId}, TeamID=${teamId}`);
    return memberData;
  } catch (error) {
    console.error(`保存成员数据失败: MemberID=${memberId}, TeamID=${teamId}`, error);
  }
}

// 处理TeamURIsUpdated事件
async function handleTeamURIsUpdated(memberId, tokenURI, event) {
  try {
    console.log(`检测到队员tokenURI更新: MemberID=${memberId}, tokenURI=${tokenURI}`);

    // 更新队员tokenURI
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .update({ token_uri: tokenURI })
      .eq('id', Number(memberId))
      .select();

    if (memberError) {
      throw memberError;
    }
    return memberData;
  } catch (error) {
    console.error(`更新队员数据失败: MemberID=${memberId}`, error);
  }
}

// 开始监听事件
async function startEventListener() {
  // 测试数据库连接
  const connected = await testConnection();
  if (!connected) {
    console.error('无法连接到数据库，退出监听器');
    process.exit(1);
  }

  console.log('开始监听合约事件...');
  
  // 监听TeamCreated事件
  nftFactoryContract.on('TeamCreated', handleTeamCreated);
  
  // 监听MemberAdded事件
  nftFactoryContract.on('MemberAdded', handleMemberAdded);
  
  // 监听TeamURIsUpdated事件
  nftFactoryContract.on('TeamURIsUpdated', handleTeamURIsUpdated);
  

  console.log(`监听器已启动，监听合约地址: ${NFT_FACTORY_ADDRESS}`);
}

// 处理进程中断
process.on('SIGINT', async () => {
  console.log('正在关闭监听器...');
  
  // 移除所有事件监听器
  nftFactoryContract.removeAllListeners();
  
  console.log('监听器已关闭');
  process.exit(0);
});

// 运行监听器
startEventListener().catch(error => {
  console.error('启动监听器时出错:', error);
  process.exit(1);
}); 