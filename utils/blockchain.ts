/**
 * 区块链交互工具函数
 * 用于与 FarmTreasury 合约交互
 */

import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { zetachainAthensTestnet } from 'viem/chains';
import {
  FARM_TREASURY_ADDRESS,
  FARM_TREASURY_ABI,
  EIP712_DOMAIN,
  EIP712_TYPES,
} from '@/constants/contract';

// RPC URL
const RPC_URL = process.env.RPC_URL || 'https://zetachain-athens-evm.blockpi.network/v1/rpc/public';

/**
 * Public Client (用于读取合约状态)
 */
export const publicClient = createPublicClient({
  chain: zetachainAthensTestnet,
  transport: http(RPC_URL),
});

/**
 * 获取 Wallet Client (用于签名)
 */
export function getWalletClient() {
  const privateKey = process.env.SIGNER_PRIVATE_KEY as `0x${string}`;
  
  if (!privateKey) {
    throw new Error('SIGNER_PRIVATE_KEY is not set in environment variables');
  }

  const account = privateKeyToAccount(privateKey);

  return createWalletClient({
    account,
    chain: zetachainAthensTestnet,
    transport: http(RPC_URL),
  });
}

/**
 * 获取用户的 nonce
 * @param userAddress - 用户钱包地址
 * @returns nonce (bigint)
 */
export async function getUserNonce(userAddress: `0x${string}`): Promise<bigint> {
  try {
    const nonce = await publicClient.readContract({
      address: FARM_TREASURY_ADDRESS,
      abi: FARM_TREASURY_ABI,
      functionName: 'userNonces',
      args: [userAddress],
    });

    return nonce as bigint;
  } catch (error) {
    console.error('[getUserNonce] Error:', error);
    throw new Error('Failed to get user nonce from contract');
  }
}

/**
 * 生成 EIP-712 签名
 * @param userAddress - 用户钱包地址
 * @param actionType - 操作类型
 * @param data - 操作数据 (打包为 uint256)
 * @param nonce - 用户当前 nonce
 * @returns 签名 (hex string)
 */
export async function generateActionSignature(
  userAddress: `0x${string}`,
  actionType: string,
  data: bigint,
  nonce: bigint
): Promise<`0x${string}`> {
  try {
    const walletClient = getWalletClient();

    const signature = await walletClient.signTypedData({
      domain: EIP712_DOMAIN,
      types: EIP712_TYPES,
      primaryType: 'RecordAction',
      message: {
        user: userAddress,
        actionType,
        data,
        nonce,
      },
    });

    return signature;
  } catch (error) {
    console.error('[generateActionSignature] Error:', error);
    throw new Error('Failed to generate signature');
  }
}

/**
 * 生成 EXCHANGE 类型的 EIP-712 签名（用于合约 exchangeCoinsForZeta）
 * @param userAddress - 用户地址
 * @param amountWei - 要发送的原生币数量（wei）
 * @param nonce - 用户 nonce
 */
export async function generateExchangeSignature(
  userAddress: `0x${string}`,
  amountWei: bigint,
  nonce: bigint
): Promise<`0x${string}`> {
  try {
    const walletClient = getWalletClient();

    const signature = await walletClient.signTypedData({
      domain: EIP712_DOMAIN,
      types: EIP712_TYPES,
      primaryType: 'Exchange',
      message: {
        user: userAddress,
        amount: amountWei,
        nonce,
      },
    });

    return signature;
  } catch (error) {
    console.error('[generateExchangeSignature] Error:', error);
    throw new Error('Failed to generate exchange signature');
  }
}

/**
 * 获取合约 prizePoolBalance
 */
export async function getPrizePoolBalance(): Promise<bigint> {
  try {
    const res = await publicClient.readContract({
      address: FARM_TREASURY_ADDRESS,
      abi: FARM_TREASURY_ABI,
      functionName: 'prizePoolBalance',
      args: [],
    });

    return res as bigint;
  } catch (error) {
    console.error('[getPrizePoolBalance] Error:', error);
    throw new Error('Failed to read prize pool balance');
  }
}

/**
 * 验证合约地址是否已配置
 */
export function validateContractConfig(): void {
  if (!FARM_TREASURY_ADDRESS || FARM_TREASURY_ADDRESS === '0x...') {
    throw new Error('FARM_TREASURY_ADDRESS is not properly configured');
  }

  if (!process.env.SIGNER_PRIVATE_KEY) {
    throw new Error('SIGNER_PRIVATE_KEY is not set');
  }
}
