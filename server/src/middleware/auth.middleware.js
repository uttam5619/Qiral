import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'qiral-dev-secret-key-change-in-production';

/**
 * authenticate — Validates JWT from Authorization header.
 * Attaches req.user = { userId, orgId, role, email }
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required. Provide a valid Bearer token.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId: decoded.userId,
      orgId: decoded.orgId,
      role: decoded.role,
      email: decoded.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
}

/**
 * authorize — Role-based access control middleware.
 * Usage: authorize('admin', 'engineer')
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
}
