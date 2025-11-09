/**
 * TypeScript 类型扩展
 * 为 Next.js API Request 添加 user 属性
 */

import { NextApiRequest } from 'next';
import { IUser } from '@/models/User';

export interface AuthenticatedRequest extends NextApiRequest {
  user: IUser;
}
