import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from './firebaseAdmin';
import { UserRole, SubscriptionPlanTier } from '../types/user';
import { FirestoreUserStore } from './firestoreUserStore';
import { StoredUserAccount } from '../services/serverUserStore';
import { EntitlementService } from '../services/entitlementService';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: UserRole;
  emailVerified?: boolean;
  account: StoredUserAccount;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

let authProvider: () => Pick<ReturnType<typeof getFirebaseAuth>, 'verifyIdToken'> = () => getFirebaseAuth();
export function setAuthProviderForTests(provider: (() => any) | null): void {
  if (process.env.NODE_ENV === 'production') throw new Error('Test authentication injection is disabled in production.');
  authProvider = provider || (() => getFirebaseAuth());
}

/**
 * Verifies Firebase ID token from Authorization: Bearer <token> header.
 * Attaches verified UID and claims to req.user.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Unauthorized: Bearer authentication token is required.',
      code: 'AUTH_TOKEN_MISSING',
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      error: 'Unauthorized: Invalid authorization header format.',
      code: 'AUTH_TOKEN_INVALID',
    });
  }

  try {
    const auth = authProvider();
    let decodedToken: any;

    try {
      decodedToken = await auth.verifyIdToken(token, true);
    } catch (verifyError: any) {
      console.error('[AuthMiddleware] ID token verification failed:', verifyError?.message);
      return res.status(401).json({
        error: 'Unauthorized: Expired, revoked, or invalid Firebase ID token.',
        code: 'AUTH_TOKEN_EXPIRED_OR_INVALID',
      });
    }

    const account = await FirestoreUserStore.getOrCreateUser({
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name,
    });
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: account.role,
      emailVerified: decodedToken.email_verified || false,
      account,
    };

    next();
  } catch (error: any) {
    console.error('[AuthMiddleware] Unexpected authentication error:', error);
    return res.status(500).json({ error: 'Internal authentication error.' });
  }
}

/**
 * Middleware ensuring the authenticated user has a specific privileged role.
 */
export function requireRole(allowedRole: UserRole) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
    }

    const userRole = req.user.role;
    const isSuper = userRole === 'super_admin';
    const hasRole = userRole === allowedRole || isSuper;

    if (!hasRole) {
      return res.status(403).json({
        error: `Forbidden: Requires '${allowedRole}' role privilege.`,
        code: 'INSUFFICIENT_PRIVILEGES',
      });
    }

    next();
  };
}

/**
 * Middleware ensuring the authenticated user has at least one of the allowed roles.
 */
export function requireAnyRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
    }

    const userRole = req.user.role;
    const isSuper = userRole === 'super_admin';
    const hasRole = allowedRoles.includes(userRole) || isSuper;

    if (!hasRole) {
      return res.status(403).json({
        error: `Forbidden: Requires one of [${allowedRoles.join(', ')}] role privileges.`,
        code: 'INSUFFICIENT_PRIVILEGES',
      });
    }

    next();
  };
}

/**
 * Middleware ensuring the authenticated user has the required subscription plan tier or entitlement.
 */
export function requireEntitlement(minPlanTier: SubscriptionPlanTier | ((user: AuthenticatedUser, account?: any) => boolean)) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
    }

    const account = await FirestoreUserStore.findById(req.user.uid);
    const plan = (account?.plan as SubscriptionPlanTier) || 'free';

    if (typeof minPlanTier === 'function') {
      const isAllowed = minPlanTier(req.user, account);
      if (!isAllowed) {
        return res.status(403).json({
          error: 'Forbidden: Feature requires an upgraded subscription plan.',
          code: 'UPGRADE_REQUIRED',
        });
      }
      return next();
    }

    const PLAN_WEIGHTS: Record<SubscriptionPlanTier, number> = {
      free: 0,
      basic: 1,
      pro: 2,
      premium: 3,
      institutional: 3,
      enterprise: 4,
    };

    const userWeight = PLAN_WEIGHTS[plan] || 0;
    const requiredWeight = PLAN_WEIGHTS[minPlanTier] || 0;

    if (userWeight < requiredWeight && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({
        error: `Forbidden: Feature requires minimum '${minPlanTier.toUpperCase()}' subscription plan tier.`,
        code: 'UPGRADE_REQUIRED',
        currentPlan: plan,
        requiredPlan: minPlanTier,
      });
    }

    next();
  };
}
