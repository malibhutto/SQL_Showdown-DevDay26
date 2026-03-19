import jwt from 'jsonwebtoken';
import { config } from '../config';
import { User, IUser } from '../models';

export interface TokenPayload {
  teamName: string;
  userId: string;
}

export class AuthService {
  /**
   * Generate JWT token for authenticated user
   */
  static generateToken(user: IUser): string {
    const payload: TokenPayload = {
      teamName: user.teamName,
      userId: user._id.toString()
    };
    
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn as string
    } as jwt.SignOptions);
  }
  
  /**
   * Verify and decode JWT token
   */
  static verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as TokenPayload;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }
  
  /**
   * Authenticate user with credentials
   */
  static async login(teamName: string, password: string): Promise<{ user: IUser; token: string }> {
    // Find user
    const user = await User.findOne({ teamName, isActive: true });
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const token = this.generateToken(user);
    
    return { user, token };
  }
  
  /**
   * Register new team
   */
  static async register(teamName: string, password: string): Promise<{ user: IUser; token: string }> {
    // Check if team already exists
    const existingUser = await User.findOne({ teamName });
    if (existingUser) {
      throw new Error('Team name already exists');
    }
    
    // Validate password strength
    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    
    // Create new user
    const user = new User({
      teamName,
      passwordHash: password // Will be hashed by pre-save hook
    });
    
    await user.save();
    
    // Generate token
    const token = this.generateToken(user);
    
    return { user, token };
  }
}
