import { Request, Response, NextFunction } from 'express';
import { getFirebaseAuth } from './firebaseAdmin';
import { UserRole, SubscriptionPlanTier } from '../types/user';
import { ServerUserStore } from '../services/serverUserStore';
import { FirestoreUserStore } from './firestoreUserStore';
import { EntitlementService } from '../services/entitlementService';

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  role: UserRole;
  emailVerified?: boolean;
  account?: any;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

let authProviderForTests: (() => any) | null = null;

export function setAuthProviderForTests(provider: (() => any) | null): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Test auth injection is disabled in production.');
  }
  authProviderForTests = provider;
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
    const auth = authProviderForTests ? authProviderForTests() : getFirebaseAuth();
    let decodedToken: any;

    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (verifyError: any) {
      // In development strictly when NOT in production, support dev token for local workflow
      const isProduction = process.env.NODE_ENV === 'production';
      if (!isProduction && (token.startsWith('mkt_dev_') || token.startsWith('mkt_token_'))) {
        const prefix = token.startsWith('mkt_dev_') ? 'mkt_dev_' : 'mkt_token_';
        const devUid = token.slice(prefix.length) || 'dev_user_uid';
        let account = ServerUserStore.findById(devUid);
        if (!account) {
          account = ServerUserStore.getOrCreateUser({
            uid: devUid,
            email: `${devUid}@marketmind.ai`,
            role: devUid.includes('admin') ? 'admin' : 'user',
          });
        }
        decodedToken = {
          uid: devUid,
          email: account?.email || `${devUid}@marketmind.ai`,
          role: account?.role || (devUid.includes('admin') ? 'admin' : 'user'),
          email_verified: true,
        };
      } else {
        console.error('[AuthMiddleware] ID token verification failed:', verifyError?.message);
        return res.status(401).json({
          error: 'Unauthorized: Expired or invalid Firebase ID token.',
          code: 'AUTH_TOKEN_EXPIRED_OR_INVALID',
        });
      }
    }

    let account: any = null;
    try {
      account = await FirestoreUserStore.getOrCreateUser({
        uid: decodedToken.uid,
        email: decodedToken.email || `${decodedToken.uid}@marketmind.ai`,
        role: decodedToken.role,
      });
    } catch {}
    if (!account) {
      account = ServerUserStore.findById(decodedToken.uid);
    }

    const role: UserRole = (account?.role as UserRole) || (decodedToken.role as UserRole) || 'user';
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role,
      emailVerified: decodedToken.email_verified || false,
      account: account || undefined,
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
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.', code: 'AUTH_REQUIRED' });
    }

    const account = ServerUserStore.findById(req.user.uid);
    const userProfile = account ? ServerUserStore.convertToUserProfile(account) : null;
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
      ultra: 4,
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
