/**
 * Authentication Service
 * 
 * Handles team authentication, session management, and logout.
 * Currently uses mock authentication - replace with API calls for production.
 * 
 * Backend Integration:
 * - Replace login() mock logic with: api.post('/auth/login', { teamName, password })
 * - Add token refresh logic if using JWT with expiry
 * - Add session validation endpoint call in getSession()
 */

import type { Session } from '../types';
import { api } from './api';

// ============================================================================
// MOCK CONFIGURATION - Remove when connecting to real backend
// ============================================================================
const USE_MOCK_AUTH = false; // Set to false when backend is ready
const VALID_TEAMS = ['team_alpha', 'team_beta', 'devsquad'];
const VALID_PASSWORD = 'sql123';
// ============================================================================

/**
 * Login response from the backend
 */
interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    teamName: string;
    lastLogin?: string;
  };
}

/**
 * Login request payload
 */
interface LoginRequest {
  teamName: string;
  password: string;
}

export class AuthService {
  private static SESSION_KEY = 'session';

  /**
   * Authenticate a team with credentials
   * 
   * @param teamName - Team identifier
   * @param password - Team password
   * @returns Login result with session or error
   */
  static async login(
    teamName: string, 
    password: string
  ): Promise<{ success: boolean; error?: string; session?: Session }> {
    // Validation
    if (!teamName || teamName.length < 2) {
      return { success: false, error: 'Team name must be at least 2 characters' };
    }

    if (!password || password.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters' };
    }

    // Use mock authentication or real API
    if (USE_MOCK_AUTH) {
      return this.mockLogin(teamName, password);
    }

    // Real API call
    try {
      const response = await api.post<LoginResponse>('/auth/login', {
        teamName,
        password,
      } as LoginRequest);

      if (!response.success || !response.data) {
        return { success: false, error: response.error || 'Login failed' };
      }

      // Create and store session
      const session: Session = {
        teamName: response.data.user.teamName,
        token: response.data.token,
        loginTime: Date.now(),
      };

      this.storeSession(session);
      return { success: true, session };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Failed to connect to server. Please ensure the backend is running.' };
    }
  }

  /**
   * Mock login for development/testing
   */
  private static mockLogin(
    teamName: string, 
    password: string
  ): { success: boolean; error?: string; session?: Session } {
    // Simulate network delay
    if (!VALID_TEAMS.includes(teamName) || password !== VALID_PASSWORD) {
      return { success: false, error: 'Invalid team name or password' };
    }

    const session: Session = {
      teamName,
      token: `mock-token-${teamName}-${Date.now()}`,
      loginTime: Date.now(),
    };

    this.storeSession(session);
    return { success: true, session };
  }

  /**
   * Store session in sessionStorage (cleared when browser closes)
   */
  private static storeSession(session: Session): void {
    sessionStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
  }

  /**
   * Clear session and log out
   */
  static logout(): void {
    sessionStorage.removeItem(this.SESSION_KEY);
    // TODO: Call backend logout endpoint if needed
    // api.post('/auth/logout', {});
  }

  /**
   * Get current session from storage
   * 
   * @returns Session object or null if not logged in
   */
  static getSession(): Session | null {
    const sessionStr = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionStr) return null;

    try {
      const session = JSON.parse(sessionStr) as Session;
      
      // TODO: Add session validation
      // - Check if token is expired
      // - Optionally validate with backend: api.get('/auth/validate')
      
      return session;
    } catch {
      // Invalid session data, clear it
      this.logout();
      return null;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    return this.getSession() !== null;
  }

  /**
   * Get the current auth token
   */
  static getToken(): string | null {
    const session = this.getSession();
    return session?.token || null;
  }
}
