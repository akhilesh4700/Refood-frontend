import { Router } from 'express';
import * as authController from './auth.controller';
import { validateRequest } from '../../middleware/validateRequest';
import { registerSchema, loginSchema } from './auth.schemas';
import { authenticate } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/asyncHandler';

export const authRouter = Router();

authRouter.post('/register', validateRequest({ body: registerSchema }), asyncHandler(authController.register));
authRouter.post('/login', validateRequest({ body: loginSchema }), asyncHandler(authController.login));
authRouter.get('/me', asyncHandler(authenticate), asyncHandler(authController.me));
authRouter.post('/logout', asyncHandler(authController.logout));
