/**
 * withAuth 认证中间件
 * 从 Authorization header 获取钱包地址，查找或创建用户
 */

import { NextApiRequest, NextApiResponse } from 'next';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { AuthenticatedRequest } from '@/types/api';

export type ApiHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void> | void;

/**
 * withAuth 高阶函数
 * 用于保护 API 路由并自动注入用户对象
 */
export function withAuth(handler: ApiHandler) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      // 1. 从 Authorization header 获取钱包地址
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.status(401).json({ 
          error: 'Missing Authorization header',
          message: '请提供 Authorization header' 
        });
      }

      // 支持两种格式：
      // 1. "Bearer 0x123..."
      // 2. "0x123..."
      const wallet_address = authHeader.startsWith('Bearer ')
        ? authHeader.substring(7)
        : authHeader;

      // 验证钱包地址格式（基本验证）
      if (!wallet_address || wallet_address.length < 10) {
        return res.status(401).json({ 
          error: 'Invalid wallet address',
          message: '无效的钱包地址格式' 
        });
      }

      // 转换为小写以确保一致性
      const normalizedAddress = wallet_address.toLowerCase();

      // 2. 连接数据库
      await connectDB();

      // 3. 查找用户
      let user = await User.findOne({ 
        wallet_address: normalizedAddress 
      });

      // 4. 如果用户不存在，创建新用户
      if (!user) {
        console.log(`[withAuth] Creating new user: ${normalizedAddress}`);
        
        user = await User.create({
          wallet_address: normalizedAddress,
          // 其他字段将使用 Schema 默认值
          // plots_list 将通过 pre('save') 钩子自动初始化
        });

        console.log(`[withAuth] New user created with ${user.plots_list.length} plots`);
      }

      // 5. 将用户对象附加到 request
      (req as AuthenticatedRequest).user = user;

      // 6. 调用实际的 API handler
      return handler(req as AuthenticatedRequest, res);

    } catch (error) {
      console.error('[withAuth] Error:', error);
      return res.status(500).json({ 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : '服务器内部错误'
      });
    }
  };
}

/**
 * 从请求中提取钱包地址（工具函数）
 */
export function getWalletAddress(req: NextApiRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader) return null;

  const wallet_address = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader;

  return wallet_address.toLowerCase();
}
