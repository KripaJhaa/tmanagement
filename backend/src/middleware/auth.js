const Admin = require('../models/admin');
const bcrypt = require('bcrypt');

const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' } 
    });
  }

  try {
    const base64Credentials = (authHeader.split(' ')[1] || '').trim();
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');

    // Credentials can be "username:password" or ":password" (legacy env-based)
    let username = null;
    let providedPassword = credentials;
    if (credentials.includes(':')) {
      const parts = credentials.split(':');
      username = parts[0] || null; // empty string becomes null
      providedPassword = parts.slice(1).join(':');
    }

    let admin;
    if (username) {
      // Database-backed admin authentication
      admin = await Admin.findByUsername(username);
      if (!admin) {
        return res.status(401).json({ 
          success: false, 
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } 
        });
      }

      const isValid = await Admin.verifyPassword(admin, providedPassword);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } 
        });
      }
    } else {
      // Legacy environment-based authentication
      const envPasswordHash = process.env.ADMIN_PASSWORD_HASH;
      if (!envPasswordHash) {
        return res.status(500).json({ 
          success: false, 
          error: { code: 'CONFIG_ERROR', message: 'Admin authentication not configured' } 
        });
      }

      const isValid = await bcrypt.compare(providedPassword, envPasswordHash);
      if (!isValid) {
        return res.status(401).json({ 
          success: false, 
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials' } 
        });
      }

      // Use first admin in database for legacy mode
      admin = await Admin.findByCompanyId(1);
      if (!admin) {
        return res.status(500).json({ 
          success: false, 
          error: { code: 'CONFIG_ERROR', message: 'No admin account configured' } 
        });
      }
    }

    // Attach admin to request for use in route handlers
    req.admin = admin;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ 
      success: false, 
      error: { code: 'SERVER_ERROR', message: 'Authentication failed' } 
    });
  }
};

module.exports = { authenticateAdmin };