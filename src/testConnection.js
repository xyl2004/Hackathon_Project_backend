/**
 * 测试Supabase连接的脚本
 */
const { testConnection, supabase } = require('./supabase');
require('dotenv').config();

async function main() {
  try {
    console.log('测试Supabase连接...');
    const connected = await testConnection();
    
    if (connected) {
      console.log('✅ Supabase连接成功！');
      
      // 测试查询
      try {
        console.log('\n获取团队数据...');
        const { data: teams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .limit(5);
        
        if (teamsError) throw teamsError;
        
        console.log(`查询到 ${teams.length} 个团队:`);
        console.table(teams);
        
        console.log('\n获取成员数据...');
        const { data: members, error: membersError } = await supabase
          .from('members')
          .select('*')
          .limit(5);
        
        if (membersError) throw membersError;
        
        console.log(`查询到 ${members.length} 个成员:`);
        console.table(members);
        
        console.log('\n获取入队申请数据...');
        const { data: requests, error: requestsError } = await supabase
          .from('team_join_requests')
          .select('*')
          .limit(5);
        
        if (requestsError) throw requestsError;
        
        console.log(`查询到 ${requests.length} 个入队申请:`);
        console.table(requests);
        
      } catch (error) {
        console.error('查询数据时出错:', error.message);
      }
    } else {
      console.error('❌ Supabase连接失败！');
    }
  } catch (error) {
    console.error('执行测试时出错:', error);
  }
}

main().catch(console.error); 