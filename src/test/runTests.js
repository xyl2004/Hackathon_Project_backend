/**
 * 测试入口脚本 - 运行所有测试
 */
const { runTest: runSimpleTest } = require('./testJoinRequest');
const { runFullTest } = require('./testFullFlow');

/**
 * 打印帮助信息
 */
function printHelp() {
  console.log(`
测试脚本使用说明:
------------------
1. 简单测试（只测试入队申请）:
   node src/test/runTests.js simple

2. 完整测试（创建团队 + 入队申请 + 处理申请）:
   node src/test/runTests.js full

3. 完整测试并在测试后清理数据:
   node src/test/runTests.js full --cleanup

4. 帮助信息:
   node src/test/runTests.js --help
  `);
}

/**
 * 主函数
 */
async function main() {
  // 解析命令行参数
  const args = process.argv.slice(2);
  
  // 显示帮助信息
  if (args.includes('--help') || args.length === 0) {
    printHelp();
    return;
  }
  
  // 确保服务器正在运行
  console.log('⚠️ 请确保服务器已经启动，运行命令: npm run dev');
  console.log('⚠️ 请确保您已在.env文件中配置了正确的SUPABASE_KEY\n');
  
  // 等待3秒，让用户有时间取消测试
  console.log('将在3秒后开始测试...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // 运行选定的测试
  const testType = args[0];
  
  if (testType === 'simple') {
    console.log('\n开始执行简单测试（只测试入队申请）...\n');
    await runSimpleTest();
  } else if (testType === 'full') {
    const shouldCleanup = args.includes('--cleanup');
    console.log(`\n开始执行完整测试（创建团队+入队申请+处理申请）${shouldCleanup ? '并在测试后清理数据' : ''}...\n`);
    await runFullTest(shouldCleanup);
  } else {
    console.error(`❌ 未知的测试类型: ${testType}`);
    printHelp();
    process.exit(1);
  }
}

// 执行主函数
main().catch(err => {
  console.error('执行测试时发生错误:', err);
  process.exit(1);
}); 