#!/usr/bin/env node

const { spawn } = require('child_process');
const { config } = require('../src/config');

console.log('🚀 启动 OpenAPI 演示...\n');

// 启动服务器
const server = spawn('node', ['src/app.js'], {
  stdio: 'inherit'
});

server.on('error', (error) => {
  console.error('❌ 启动服务器失败:', error);
});

server.on('close', (code) => {
  console.log(`\n👋 服务器已停止 (退出码: ${code})`);
});

// 10秒后显示访问信息
setTimeout(() => {
  console.log('\n📚 OpenAPI 文档已生成！');
  console.log('🌐 访问地址：');
  console.log(`   http://localhost:${config.port}/api-docs/`);
  console.log('\n💡 提示：');
  console.log('   - 点击右上角的 "Authorize" 按钮，输入 JWT token 进行认证');
  console.log('   - 演示模式下，可以直接测试不需要认证的端点');
  console.log('   - 访问 http://localhost:${config.port}/api/v1/auth 查看认证模块信息');
  console.log('\n🔧 要停止服务器，请按 Ctrl+C');
}, 3000);