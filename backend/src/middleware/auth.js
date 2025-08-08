import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';

// Middleware to require authentication
export const requireAuth = ClerkExpressRequireAuth();

// Middleware to extract user info from Clerk
export const extractUserInfo = async (req, res, next) => {
  try {
    if (req.auth && req.auth.userId) {
      req.userId = req.auth.userId;
      req.userEmail = req.auth.sessionClaims?.email;
      req.userName = req.auth.sessionClaims?.name || req.auth.sessionClaims?.firstName;
    }
    next();
  } catch (error) {
    console.error('Error extracting user info:', error);
    next();
  }
};

// Middleware to ensure investor exists in database
export const ensureInvestor = async (req, res, next) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { getInvestorByClerkId, createInvestor } = await import('../services/supabase.js');
    
    // Check if investor exists
    let investor = await getInvestorByClerkId(req.userId);
    
    // If not, create new investor
    if (!investor) {
      investor = await createInvestor({
        clerk_user_id: req.userId,
        email: req.userEmail || `${req.userId}@callabo.com`,
        name: req.userName || 'Investor',
        nights_used: 0,
        quarter_start: new Date().toISOString().split('T')[0]
      });
    }
    
    req.investor = investor;
    next();
  } catch (error) {
    console.error('Error ensuring investor:', error);
    res.status(500).json({ error: 'Failed to verify investor account' });
  }
};