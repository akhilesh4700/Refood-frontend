import { Request, Response } from 'express';
import * as authService from './auth.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body);
  sendSuccess(res, result, 201, 'Organization and account registered successfully');
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body);
  sendSuccess(res, result, 200, 'Authenticated successfully');
}

export async function me(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
  }
  const user = await authService.getProfile(req.user.id);
  sendSuccess(res, user, 200);
}

export async function logout(req: Request, res: Response): Promise<void> {
  // Stateless JWT: logout is confirmed by server; client discards token
  sendSuccess(res, { loggedOut: true }, 200, 'Session ended successfully');
}
