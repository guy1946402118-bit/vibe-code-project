const { spawn, exec } = require('child_process');
const fs = require('fs');

const COLORS = {
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  PURPLE: '\x1b[35m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m'
};

function log(msg, color = COLORS.WHITE) {
  console.log(color + msg + COLORS.RESET);
}

function logError(msg) {
  console.log(COLORS.RED + msg + COLORS.RESET);
}

function logSuccess(msg) {
  console.log(COLORS.GREEN + msg + COLORS.RESET);
}

function logInfo(msg) {
  console.log(COLORS.CYAN + msg + COLORS.RESET);
}

function logWarning(msg) {
  console.log(COLORS.YELLOW + msg + COLORS.RESET);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function checkAndBuildBackend() {
  const distPath = './server/dist/index.js';
  
  if (!fs.existsSync(distPath)) {
    logWarning(`⚠️  后端未编译，正在编译...`);
    logInfo(`📦 运行: npm run build (in server/)`);
    
    return new Promise((resolve, reject) => {
      const build = exec('npm run build', { cwd: './server' }, (error, stdout, stderr) => {
        if (error) {
          logError(`❌ 后端编译失败: ${error.message}`);
          reject(error);
          return;
        }
        if (stderr) {
          console.log(COLORS.YELLOW + stderr + COLORS.RESET);
        }
        logSuccess(`✅ 后端编译成功`);
        resolve();
      });
      
      build.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
    });
  } else {
    logSuccess(`✅ 后端已编译`);
  }
}

async function main() {
  try {
    log('\n🚀 启动 GrowthDashboard...\n', COLORS.PURPLE);
    
    // 检查并编译后端
    await checkAndBuildBackend();
    
    // 启动后端
    logInfo('\n🔧 启动后端服务...');
    const backend = spawn('node', ['server/dist/index.js'], {
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit'
    });
    
    backend.on('error', (err) => {
      logError(`❌ 后端启动失败: ${err.message}`);
      process.exit(1);
    });
    
    backend.on('close', (code) => {
      if (code !== 0) {
        logError(`❌ 后端进程异常退出，代码: ${code}`);
      }
    });
    
    // 等待后端启动
    logInfo('⏳ 等待后端启动...');
    await delay(3000);
    
    // 启动前端
    logInfo('\n🌐 启动前端服务...');
    const frontend = spawn('npm', ['run', 'dev'], {
      cwd: process.cwd(),
      shell: true,
      stdio: 'inherit'
    });
    
    frontend.on('error', (err) => {
      logError(`❌ 前端启动失败: ${err.message}`);
      process.exit(1);
    });
    
    frontend.on('close', (code) => {
      if (code !== 0) {
        logError(`❌ 前端进程异常退出，代码: ${code}`);
      }
    });
    
    // 输出访问信息
    await delay(2000);
    log('\n========================================', COLORS.GREEN);
    logSuccess('🎉 GrowthDashboard 启动成功！');
    logInfo('🌐 前端地址: http://localhost:5173');
    logInfo('🔧 后端地址: http://localhost:3000');
    logInfo('🛠️  CMS管理: http://localhost:5173/cms');
    log('========================================\n', COLORS.GREEN);
    
  } catch (error) {
    logError(`❌ 启动失败: ${error.message}`);
    process.exit(1);
  }
}

main();