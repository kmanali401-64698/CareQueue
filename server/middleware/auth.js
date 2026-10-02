import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'carequeue-super-secret-production-jwt-key-2026';

/**
 * Middleware: Verify JWT and attach decoded user payload to req.user
 */
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

  if (!token) {
    return res.status(401).json({ error: 'Access denied: Authentication token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(403).json({ error: 'Invalid, expired, or malformed authentication token' });
  }
}

/**
 * Middleware: Check if req.user has one of the required roles
 */
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted. Required role(s): ${allowedRoles.join(', ')}. Current role: ${req.user.role}`,
      });
    }

    next();
  };
}
