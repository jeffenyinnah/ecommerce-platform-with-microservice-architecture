import jwt from 'jsonwebtoken';

/**
 * Authentication Middleware
 * Verifies JWT token from Authorization header
 * Attaches user info to req.user
 */
export const authenticateToken = (req, res, next) => {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        // Verify token using the same JWT_SECRET as auth service
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user info to request
        req.user = decoded;
        
        next();
    } catch (error) {
        console.error('Token verification failed:', error.message);
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Access token expired',
                expired: true
            });
        }
        
        return res.status(403).json({
            success: false,
            message: 'Invalid access token'
        });
    }
};

/**
 * Optional Authentication Middleware
 * Verifies token if present, but allows request to proceed without it
 */
export const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
    } catch (error) {
        req.user = null;
    }
    
    next();
};

/**
 * Service-to-Service Authentication Middleware
 * Verifies API key for internal service calls
 */
export const authenticateService = (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
        return res.status(401).json({
            success: false,
            message: 'API key required'
        });
    }

    // Verify API key matches the configured service key
    if (apiKey !== process.env.SERVICE_API_KEY) {
        return res.status(403).json({
            success: false,
            message: 'Invalid API key'
        });
    }

    next();
};

