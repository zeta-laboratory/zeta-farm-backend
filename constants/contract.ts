/**
 * 智能合约配置
 * FarmTreasury 合约地址和 ABI
 */

export const FARM_TREASURY_ADDRESS = process.env.FARM_TREASURY_ADDRESS as `0x${string}`;

export const CHAIN_ID = parseInt(process.env.CHAIN_ID || '7001'); // ZetaChain Testnet

/**
 * FarmTreasury 合约 ABI (简化版)
 * 只包含我们需要的函数和事件
 */
export const FARM_TREASURY_ABI = [
  {
    name: 'userNonces',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'recordActionWithSignature',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'actionType', type: 'string' },
      { name: 'data', type: 'uint256' },
      { name: 'nonce', type: 'uint256' },
      { name: 'signature', type: 'bytes' },
    ],
    outputs: [],
  },
  {
    name: 'ActionRecorded',
    type: 'event',
    inputs: [
      { name: 'user', type: 'address', indexed: true },
      { name: 'actionType', type: 'string', indexed: false },
      { name: 'data', type: 'uint256', indexed: false },
      { name: 'timestamp', type: 'uint256', indexed: false },
    ],
  },
] as const;

/**
 * EIP-712 Domain
 */
export const EIP712_DOMAIN = {
  name: 'ZetaFarmTreasury',
  version: '1',
  chainId: CHAIN_ID,
  verifyingContract: FARM_TREASURY_ADDRESS,
} as const;

/**
 * EIP-712 Types
 */
export const EIP712_TYPES = {
  RecordAction: [
    { name: 'user', type: 'address' },
    { name: 'actionType', type: 'string' },
    { name: 'data', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const;
