import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthenticatedRequest extends Request {
  user?: DecodedIdToken;
  isAdmin?: boolean;
}

const AUTHORIZED_ADMIN_EMAILS = new Set([
  'smileafricawebagency@gmail.com',
  'admin@boursefacile.ci',
  'contact@boursefacile.ci',
]);

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const adminKey = req.headers['x-admin-key'];

  // Check optional environment secret key
  const serverAdminKey = process.env.ADMIN_SECRET_KEY;
  if (serverAdminKey && adminKey === serverAdminKey) {
    req.isAdmin = true;
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Accès restreint. Jeton d\'authentification administrateur manquant.',
    });
  }

  const token = authHeader.split('Bearer ')[1]?.trim();
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED',
      message: 'Format du jeton Bearer invalide.',
    });
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;

    const email = (decodedToken.email || '').toLowerCase();
    const hasAdminClaim = Boolean(decodedToken.admin);
    const isAuthorizedEmail = AUTHORIZED_ADMIN_EMAILS.has(email);

    if (isAuthorizedEmail || hasAdminClaim) {
      req.isAdmin = true;
      return next();
    }

    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN',
      message: 'Privilèges administrateur insuffisants pour exécuter cette opération.',
    });
  } catch (error: any) {
    console.warn('[Server Auth] Échec de vérification du jeton Firebase:', error?.message);
    return res.status(401).json({
      success: false,
      error: 'INVALID_TOKEN',
      message: 'Jeton d\'authentification invalide ou expiré.',
    });
  }
};
