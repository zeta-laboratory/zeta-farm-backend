/**
 * FarmTreasury 事件监听器
 * 
 * 这个脚本监听 FarmTreasury 合约的 ActionRecorded 事件
 * 并自动更新 MongoDB 中的用户数据
 * 
 * 运行方式:
 * npm run listener
 * 或
 * tsx scripts/listener.ts
 */

import { resolve } from 'path';

// Load environment variables as early as possible using require() so
// dotenv runs before any other module that reads process.env.
require('dotenv').config({ path: resolve(__dirname, '../.env') });

// Require modules after dotenv to avoid import-time env reads.
const connectDB = require('../lib/mongodb').default;
const User = require('../models/User').default;
const { publicClient } = require('../utils/blockchain');
const { FARM_TREASURY_ADDRESS, FARM_TREASURY_ABI } = require('../constants/contract');
const { onActionRecorded } = require('../utils/eventHandlers');

/**
 * 启动监听器
 */
async function startListener() {
  console.log('========================================');
  console.log('🚀 Starting FarmTreasury Event Listener');
  console.log('========================================');

  // 1. 连接数据库
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ Failed to connect to MongoDB:', error);
    process.exit(1);
  }

  // 2. 验证合约配置
  if (!FARM_TREASURY_ADDRESS || FARM_TREASURY_ADDRESS === '0x...') {
    console.error('❌ FARM_TREASURY_ADDRESS is not configured');
    process.exit(1);
  }

  console.log(`📋 Listening to contract: ${FARM_TREASURY_ADDRESS}`);
  console.log(`🔗 Chain ID: ${process.env.CHAIN_ID || '7001'}`);
  console.log('⏳ Waiting for events...\n');

  // 3. 监听 ActionRecorded 事件
  const unwatch = publicClient.watchContractEvent({
    address: FARM_TREASURY_ADDRESS,
    abi: FARM_TREASURY_ABI,
    eventName: 'ActionRecorded',
    onLogs: async (logs: any[]) => {
      for (const log of logs) {
        try {
          await processEvent(log);
        } catch (error) {
          console.error('❌ Error processing event:', error);
          // 继续处理其他事件，不中断监听器
        }
      }
    },
    onError: (error: Error) => {
      console.error('❌ Event listener error:', error);
      // 可选：实现重连逻辑
    },
  });

  // 4. 处理优雅关闭
  process.on('SIGINT', () => {
    console.log('\n\n⚠️  Received SIGINT, shutting down...');
    unwatch();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Received SIGTERM, shutting down...');
    unwatch();
    process.exit(0);
  });

  console.log('✅ Listener is running. Press Ctrl+C to stop.\n');
}

/**
 * 处理单个事件
 */
async function processEvent(log: any) {
  const { args, blockNumber, transactionHash } = log;

  if (!args) {
    console.warn('⚠️  Event has no args, skipping');
    return;
  }

  const { user, actionType, data, timestamp } = args;

  console.log('========================================');
  console.log(`📥 New Event Received`);
  console.log(`Block: ${blockNumber}`);
  console.log(`TX: ${transactionHash}`);
  console.log(`User: ${user}`);
  console.log(`Action: ${actionType}`);
  console.log(`Data: ${data.toString()}`);
  console.log(`Timestamp: ${timestamp.toString()}`);
  console.log('========================================\n');

  // 1. 查找或创建用户
  const userAddress = (user as string).toLowerCase();
  const userDoc = await User.findOneOrCreate(userAddress);

  console.log(`✅ User ${userAddress} loaded`);

  // 2. 处理事件
  try {
    await onActionRecorded(
      userDoc,
      actionType as string,
      data as bigint,
      Number(timestamp)
    );

    console.log(`✅ Event processed successfully for ${actionType}\n`);
  } catch (error) {
    console.error(`❌ Failed to process ${actionType} event:`, error);
    throw error;
  }
}

/**
 * 主函数
 */
async function main() {
  try {
    await startListener();
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// 启动监听器
main();
