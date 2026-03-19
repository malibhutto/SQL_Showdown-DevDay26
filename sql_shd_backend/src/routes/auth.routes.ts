import { Router, Request, Response } from 'express';
import { AuthService } from '../services/AuthService';
import { authRateLimiter } from '../middleware';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate team and return JWT token
 */
router.post('/login', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName, password } = req.body;
    
    // Validate input
    if (!teamName || !password) {
      res.status(400).json({ error: 'Team name and password are required' });
      return;
    }
    
    // Authenticate
    const { user, token } = await AuthService.login(teamName, password);
    
    res.json({
      success: true,
      token,
      user: {
        teamName: user.teamName,
        lastLogin: user.lastLogin
      }
    });
  } catch (error: any) {
    res.status(401).json({
      error: error.message || 'Authentication failed'
    });
  }
});

/**
 * POST /api/auth/register
 * Register new team
 */
router.post('/register', authRateLimiter, async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName, password } = req.body;
    
    // Validate input
    if (!teamName || !password) {
      res.status(400).json({ error: 'Team name and password are required' });
      return;
    }
    
    // Register
    const { user, token } = await AuthService.register(teamName, password);
    
    res.status(201).json({
      success: true,
      token,
      user: {
        teamName: user.teamName,
        createdAt: user.createdAt
      }
    });
  } catch (error: any) {
    res.status(400).json({
      error: error.message || 'Registration failed'
    });
  }
});

/**
 * POST /api/auth/logout
 * Logout (client-side token deletion)
 */
router.post('/logout', (req: Request, res: Response): void => {
  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

export default router;
