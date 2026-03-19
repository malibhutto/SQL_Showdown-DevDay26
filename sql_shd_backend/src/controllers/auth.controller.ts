import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models';
import { config } from '../config';

/**
 * Login controller
 * Authenticates team and returns JWT token
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamName, password } = req.body;

    if (!teamName || !password) {
      res.status(400).json({ 
        success: false, 
        error: 'Team name and password are required' 
      });
      return;
    }

    // Find user
    const user = await User.findOne({ teamName });
    if (!user) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
      return;
    }

    // Verify password
    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
      return;
    }

    // Check if active
    if (!user.isActive) {
      res.status(403).json({ 
        success: false, 
        error: 'Account is disabled' 
      });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, teamName: user.teamName },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn } as SignOptions
    );

    // Send response with token in cookie and body
    res.status(200)
      .cookie('access_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
      })
      .json({
        success: true,
        token,
        teamName: user.teamName
      });

  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Logout controller
 * Clears the access token cookie
 */
export const logoutUser = async (req: Request, res: Response): Promise<void> => {
  try {
    res.status(200)
      .cookie('access_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        expires: new Date(0)
      })
      .json({ 
        success: true, 
        message: 'Logged out successfully' 
      });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const teamName = req.user?.teamName;
    
    if (!teamName) {
      res.status(401).json({ 
        success: false, 
        error: 'Not authenticated' 
      });
      return;
    }

    const user = await User.findOne({ teamName }).select('-passwordHash');
    
    if (!user) {
      res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
      return;
    }

    res.json({
      success: true,
      user: {
        teamName: user.teamName,
        isActive: user.isActive,
        lastLogin: user.lastLogin
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
};
