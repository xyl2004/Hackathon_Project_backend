require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');

// 加载合约ABI
const nftFactoryAbi = JSON.parse(fs.readFileSync(path.join(__dirname, '../Abi/NFTFactory.json'), 'utf8')).abi;

// Supabase配置
const supabaseUrl = 'https://raautdvmjylvbjisqosg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

// 确保有SUPABASE_KEY环境变量
if (!process.env.SUPABASE_KEY) {
  console.error('错误: 缺少SUPABASE_KEY环境变量。请创建.env文件并设置SUPABASE_KEY=您的服务端API密钥');
  process.exit(1);
}

// 区块链配置
const RPC_URL = process.env.RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY';  // 替换为你的节点URL
const NFT_FACTORY_ADDRESS = process.env.NFT_FACTORY_ADDRESS || '0xYourContractAddress';  // 替换为NFT工厂合约地址
const STARTING_BLOCK = parseInt(process.env.STARTING_BLOCK || '0');  // 开始扫描的区块号

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
    console.log(`检测到历史队伍创建: TeamID=${teamId}, Captain=${captain}, Name=${name}, 区块=${event.blockNumber}`);

    // 插入队伍数据
    const { data: teamData, error: teamError } = await supabase
      .from('teams')
      .insert([{
        id: Number(teamId),
        name,
        token_uri: tokenURI,
        captain_address: captain,
        created_at: new Date().toISOString() // 注意: 这里使用的是当前时间，而不是区块时间
      }])
      .select();

    if (teamError) {
      // 如果是唯一约束错误（队伍已存在），则跳过
      if (teamError.code === '23505') {
        console.log(`队伍已存在，跳过: TeamID=${teamId}`);
        return;
      }
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
    console.log(`检测到历史成员加入: MemberID=${memberId}, Member=${member}, TeamID=${teamId}, Role=${role}, 区块=${event.blockNumber}`);

    // 插入成员数据
    const { data: memberData, error: memberError } = await supabase
      .from('members')
      .insert([{
        id: Number(memberId),
        name,
        token_uri: tokenURI,
        address: member,
        role: Number(role),
        team_id: Number(teamId),
        created_at: new Date().toISOString() // 使用当前时间
      }])
      .select();

    if (memberError) {
      // 如果是唯一约束错误（成员已存在），则跳过
      if (memberError.code === '23505') {
        console.log(`成员已存在，跳过: MemberID=${memberId}`);
        return;
      }
      throw memberError;
    }

    console.log(`成员数据已保存: MemberID=${memberId}, TeamID=${teamId}`);
    return memberData;
  } catch (error) {
    console.error(`保存成员数据失败: MemberID=${memberId}, TeamID=${teamId}`, error);
  }
}

// 查询并处理历史事件
async function syncHistoricalEvents(fromBlock, toBlock) {
  console.log(`开始同步历史事件，从区块 ${fromBlock} 到 ${toBlock}...`);

  // 查询TeamCreated事件
  console.log('查询TeamCreated事件...');
  const teamCreatedEvents = await nftFactoryContract.queryFilter(
    nftFactoryContract.filters.TeamCreated(),
    fromBlock,
    toBlock
  );
  console.log(`找到 ${teamCreatedEvents.length} 个TeamCreated事件`);

  // 查询MemberAdded事件
  console.log('查询MemberAdded事件...');
  const memberAddedEvents = await nftFactoryContract.queryFilter(
    nftFactoryContract.filters.MemberAdded(),
    fromBlock,
    toBlock
  );
  console.log(`找到 ${memberAddedEvents.length} 个MemberAdded事件`);

  // 处理TeamCreated事件
  console.log('处理TeamCreated事件...');
  for (let i = 0; i < teamCreatedEvents.length; i++) {
    const event = teamCreatedEvents[i];
    const { captain, teamId, name, tokenURI } = event.args;
    await handleTeamCreated(captain, teamId, name, tokenURI, event);
  }

  // 处理MemberAdded事件
  console.log('处理MemberAdded事件...');
  for (let i = 0; i < memberAddedEvents.length; i++) {
    const event = memberAddedEvents[i];
    const { member, teamId, name, role, memberId, tokenURI } = event.args;
    await handleMemberAdded(member, teamId, name, role, memberId, tokenURI, event);
  }

  console.log('历史事件同步完成');
}

// 启动历史事件同步
async function start() {
  // 测试数据库连接
  const connected = await testConnection();
  if (!connected) {
    console.error('无法连接到数据库，退出同步器');
    process.exit(1);
  }

  try {
    // 获取当前区块
    const currentBlock = await provider.getBlockNumber();
    console.log(`当前区块高度: ${currentBlock}`);

    // 同步历史事件
    await syncHistoricalEvents(STARTING_BLOCK, currentBlock);

    console.log('同步完成，程序退出');
    process.exit(0);
  } catch (error) {
    console.error('同步历史事件时出错:', error);
    process.exit(1);
  }
}

// 运行同步程序
start().catch(console.error); 