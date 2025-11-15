/**
 * POST /api/actions/request-action-voucher
 * 
 * 请求动作凭证（签名）用于链上操作
 * 
 * 功能：
 * 1. 验证用户是否可以执行该操作
 * 2. 从合约获取用户的 nonce
 * 3. 生成 EIP-712 签名
 * 4. 返回签名和相关数据
 * 
 * 请求：
 * - Method: POST
 * - Headers: Authorization: <wallet_address>
 * - Body: { actionType: string, data: object }
 * 
 * 响应：
 * - 200: { signature, nonce, actionType, data }
 * - 400: 验证失败
 * - 500: 服务器错误
 */

import { NextApiResponse } from 'next';
import { withAuth } from '@/middleware/withAuth';
import { AuthenticatedRequest } from '@/types/api';
import { validateAction } from '@/utils/actionValidation';
import {
  validateContractConfig,
  getUserNonce,
  generateActionSignature,
} from '@/utils/blockchain';
import { generateExchangeSignature, getPrizePoolBalance } from '@/utils/blockchain';

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
      message: '只支持 POST 请求',
    });
  }

  try {
    // 验证合约配置
    validateContractConfig();

    const user = req.user;
    const { actionType, data } = req.body;

    // 1. 验证请求参数
    if (!actionType || typeof actionType !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'actionType 是必需的',
      });
    }

    if (!data || typeof data !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'data 是必需的',
      });
    }

    console.log(
      `[POST /api/actions/request-action-voucher] User ${user.wallet_address} ` +
      `requesting voucher for action: ${actionType}`
    );

    // 2. 验证操作是否合法
    const validationResult = validateAction(user, actionType, data);

    if (!validationResult.valid) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: validationResult.error,
      });
    }

    const actionData = validationResult.actionData!;
    // 3. 从合约获取用户的 nonce
    const userAddress = user.wallet_address as `0x${string}`;
    const nonce = await getUserNonce(userAddress);

    console.log(
      `[POST /api/actions/request-action-voucher] User nonce: ${nonce.toString()}`
    );

    // 如果是 exchange，需要区分兑换目标（zeta 或 tickets）
    if (actionType === 'exchange') {
      // actionData 格式：amount (高位) | targetFlag (低16位)
      const targetFlag = Number(actionData & 0xFFFFn);
      const coinsAmount = Number(actionData >> 16n);

      // 如果兑换目标是 zeta，则我们必须生成 EXCHANGE 类型的签名（合约会直接转 ZETA）
      if (targetFlag === 0) {
  // coins -> zeta 的汇率（与前端保持一致）
  const ZETA_EXCHANGE_RATE = 20; // 20 coins -> 1 ZETA
        const zetaAmount = Math.floor(coinsAmount / ZETA_EXCHANGE_RATE);

        if (zetaAmount <= 0) {
          return res.status(400).json({ success: false, error: 'Invalid amount', message: '兑换后 ZETA 数量为 0' });
        }

        // 将 ZETA 转换为 wei 单位（合约以 wei 保存/prize pool 以 wei）
        const amountWei = BigInt(zetaAmount) * 10n ** 18n;

        // 检查合约池余额
        const pool = await getPrizePoolBalance();
        if (pool < amountWei) {
          return res.status(400).json({ success: false, error: 'prize_pool_insufficient', message: '合约奖池余额不足' });
        }

        // 4a. 生成 EXCHANGE 签名
        const signature = await generateExchangeSignature(userAddress, amountWei, nonce);

        console.log(`[POST /api/actions/request-action-voucher] Exchange signature generated`);

        const response = {
          success: true,
          signature,
          nonce: nonce.toString(),
          actionType,
          amount: amountWei.toString(), // wei
          coins: coinsAmount.toString(),
          zeta: zetaAmount.toString(),
          user: userAddress,
        };

        console.log(`[POST /api/actions/request-action-voucher] Exchange voucher issued for ${userAddress}`);
        return res.status(200).json(response);
      }
      // 如果 targetFlag === 1 (tickets)，走 recordAction 的签名流程
    }

    // 4. 生成 EIP-712 签名 (RecordAction)
    const signature = await generateActionSignature(
      userAddress,
      actionType,
      actionData,
      nonce
    );

    console.log(
      `[POST /api/actions/request-action-voucher] Signature generated: ${signature.substring(0, 20)}...`
    );

    // 5. 返回签名和相关数据
    const response = {
      success: true,
      signature,
      nonce: nonce.toString(),
      actionType,
      data: actionData.toString(),
      user: userAddress,
      timestamp: Math.floor(Date.now() / 1000), // 使用当前时间作为 timestamp（Unix 秒）
    };

    console.log(
      `[POST /api/actions/request-action-voucher] Voucher issued successfully for ${actionType}`
    );

    return res.status(200).json(response);

  } catch (error) {
    console.error('[POST /api/actions/request-action-voucher] Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : '生成签名失败',
    });
  }
}

// 导出带认证的 handler
export default withAuth(handler);
