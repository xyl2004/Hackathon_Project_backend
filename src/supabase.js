const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase配置
const supabaseUrl = 'https://raautdvmjylvbjisqosg.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY;

// 确保有SUPABASE_KEY环境变量
if (!process.env.SUPABASE_KEY) {
  console.error('错误: 缺少SUPABASE_KEY环境变量。请创建.env文件并设置SUPABASE_KEY=您的服务端API密钥');
}

// 初始化Supabase客户端
const supabase = createClient(supabaseUrl, supabaseKey);

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

module.exports = {
  supabase,
  testConnection
}; 