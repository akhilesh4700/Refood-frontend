import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, Organization } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { env } from '../../config/env';
import { AppError } from '../../middleware/errorHandler';
import { RegisterInput, LoginInput } from './auth.schemas';

export interface FormattedUser {
  id: string;
  role: string;
  name: string;
  email: string;
  orgName: string;
  orgType: string;
  avatar: string;
  badge: string;
  subTitle: string;
  verified: boolean;
  organizationId: string;
}

export function formatSafeUser(user: User & { organization?: Organization | null }): FormattedUser {
  const roleLower = user.role.toLowerCase();
  const isVerified = user.organization?.verificationStatus === 'VERIFIED';
  return {
    id: user.id,
    role: roleLower,
    name: user.name,
    email: user.email,
    orgName: user.organization?.name || '',
    orgType: user.organization?.type || '',
    avatar: user.name ? user.name.slice(0, 2).toUpperCase() : 'RF',
    badge: isVerified ? 'Verified Partner' : 'Verification Pending',
    subTitle: `${user.organization?.type || 'Member'} · ${user.organization?.city || 'Bengaluru'}`,
    verified: isVerified,
    organizationId: user.organizationId,
  };
}

export function generateToken(user: { id: string; email: string; role: string; organizationId: string }): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as any }
  );
}

export async function register(input: RegisterInput): Promise<{ user: FormattedUser; token: string }> {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new AppError('An account with this email address already exists', 409, 'EMAIL_EXISTS');
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  // In an atomic transaction, create the organization then the associated user
  const result = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.create({
      data: {
        name: input.orgName,
        type: input.orgType,
        address: input.address,
        city: input.city,
        state: input.state,
        postalCode: input.postalCode,
        phone: input.phone,
        verificationStatus: 'PENDING',
      },
    });

    const user = await tx.user.create({
      data: {
        email: input.email,
        passwordHash,
        name: input.name,
        role: input.role,
        status: 'ACTIVE',
        organizationId: org.id,
      },
      include: {
        organization: true,
      },
    });

    return user;
  });

  const token = generateToken(result);
  return {
    user: formatSafeUser(result),
    token,
  };
}

export async function login(input: LoginInput): Promise<{ user: FormattedUser; token: string }> {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
    include: { organization: true },
  });

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (input.role && user.role !== input.role) {
    throw new AppError(
      `Role mismatch: your account is registered as ${user.role.toLowerCase()}, not ${input.role.toLowerCase()}`,
      403,
      'ROLE_MISMATCH'
    );
  }

  const token = generateToken(user);
  return {
    user: formatSafeUser(user),
    token,
  };
}

export async function getProfile(userId: string): Promise<FormattedUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { organization: true },
  });

  if (!user) {
    throw new AppError('User profile not found', 404, 'NOT_FOUND');
  }

  return formatSafeUser(user);
}
