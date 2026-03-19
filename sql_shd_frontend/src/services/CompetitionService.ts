/**
 * Competition Service
 * 
 * STORAGE ARCHITECTURE (Hybrid Approach for University Competition):
 * ================================================================
 * 
 * ** sessionStorage (Cleared when browser closes) **
 *    - Auth tokens (security for shared PCs)
 *    - Draft code (temporary work in progress)
 *    - Submission history backup (UI only, backend is source of truth)
 * 
 * ** Backend/Database (MongoDB - Persists across sessions) **
 *    - Competition start/end times
 *    - Team progress and scores  
 *    - Solved questions
 *    - All submissions (permanent record)
 * 
 * ** On Page Refresh **
 *    - Auth token restored from sessionStorage
 *    - Score/progress fetched from backend API
 *    - Remaining time recalculated from competition config
 *    - Draft code restored from sessionStorage
 * 
 * This ensures:
 * ✅ Security: Tokens auto-clear when students close browser
 * ✅ Persistence: Scores/progress survive refreshes (from backend)
 * ✅ Privacy: Next team on same PC starts with clean slate
 * 
 * Backend Integration Points:
 * - POST /competition/enter - Enter competition, get initial state
 * - GET /competition/progress - Fetch current progress/score
 * - GET /competition/config - Get competition timing/status
 * - POST /submissions - Submit solution
 * - GET /submissions/:teamName - Get submission history
 */

import type { CompetitionState, Submission, EditorLanguage } from '../types';
import { api } from './api';

// ============================================================================
// MOCK CONFIGURATION - Remove when connecting to real backend
// ============================================================================
const USE_MOCK_API = false; // Set to false when backend is ready
// ============================================================================

/**
 * Backend response types
 */
// ============================================================================
// DEPRECATED INTERFACES - Kept for backward compatibility
// ============================================================================
// @ts-ignore - Unused but kept to avoid breaking changes
interface CompetitionStartResponse {
  competitionId: string;
  startTime: number;
  duration: number;
  questionsCount: number;
}

interface SubmissionResponse {
  submissionId: string;
  status: 'pending' | 'accepted' | 'wrong_answer' | 'error';
  message?: string;
  score?: number;
}

export class CompetitionService {
  // SessionStorage key prefixes
  private static COMPETITION_KEY_PREFIX = 'competition::';
  private static SUBMISSIONS_KEY_PREFIX = 'submissions::';
  private static DRAFT_KEY_PREFIX = 'draft::';

  // =========================================================================
  // COMPETITION STATE MANAGEMENT
  // =========================================================================

  /**
   * Start a new competition for the team (DEPRECATED - backend handles this)
   * Competition state is now managed by the backend, not localStorage/sessionStorage
   * 
   * @param _teamName - Team identifier
   * @param _durationMinutes - Competition duration in minutes
   */
  static async startCompetition(_teamName: string, _durationMinutes: number = 30): Promise<void> {
    // This is now handled by POST /competition/enter on the backend
    // Competition state, progress, and scores are stored in MongoDB
    console.warn('CompetitionService.startCompetition is deprecated - competition state is managed by backend');
  }

  /**
   * Get the current competition state for a team (DEPRECATED - use backend /competition/progress)
   * 
   * @param _teamName - Team identifier
   * @returns Competition state or null if not started
   */
  static getCompetitionState(_teamName: string): CompetitionState | null {
    // Competition state is now in the backend database
    console.warn('CompetitionService.getCompetitionState is deprecated - use /competition/progress API');
    return null;
  }

  /**
   * Calculate remaining time for the competition
   * 
   * @param teamName - Team identifier
   * @returns Remaining time in milliseconds
   */
  static getRemainingTime(teamName: string): number {
    const state = this.getCompetitionState(teamName);
    if (!state || !state.startTime) return 0;

    const elapsed = Date.now() - state.startTime;
    const remaining = state.duration - elapsed;
    return Math.max(0, remaining);
  }

  /**
   * Check if competition has ended
   */
  static isCompetitionEnded(teamName: string): boolean {
    return this.getRemainingTime(teamName) === 0;
  }

  // =========================================================================
  // DRAFT MANAGEMENT (Session Storage for temporary work)
  // =========================================================================
  // Drafts are kept in sessionStorage - they're temporary scratch work
  // that should clear when browser closes (good for shared PCs)

  /**
   * Save a draft to sessionStorage
   * Drafts are stored in session for security on shared PCs
   * 
   * @param teamName - Team identifier
   * @param questionId - Question ID
   * @param language - Editor language mode
   * @param content - Draft content
   */
  static saveDraft(
    teamName: string, 
    questionId: string, 
    language: EditorLanguage | string, 
    content: string
  ): void {
    const key = `${this.DRAFT_KEY_PREFIX}${teamName}::${questionId}::${language}`;
    sessionStorage.setItem(key, content);
  }

  /**
   * Retrieve a saved draft
   * 
   * @param teamName - Team identifier
   * @param questionId - Question ID
   * @param language - Editor language mode
   * @returns Saved draft content or null
   */
  static getDraft(
    teamName: string, 
    questionId: string, 
    language: EditorLanguage | string
  ): string | null {
    const key = `${this.DRAFT_KEY_PREFIX}${teamName}::${questionId}::${language}`;
    return sessionStorage.getItem(key);
  }

  /**
   * Clear all drafts for a team
   */
  static clearDrafts(teamName: string): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith(`${this.DRAFT_KEY_PREFIX}${teamName}::`)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
  }

  /**
   * Clear all drafts when starting a new competition
   * This ensures the editor starts empty
   */
  static clearAllDrafts(teamName: string): void {
    this.clearDrafts(teamName);
    // Also clear any competition state to start fresh
    sessionStorage.removeItem(`${this.COMPETITION_KEY_PREFIX}${teamName}`);
  }

  // =========================================================================
  // SUBMISSION MANAGEMENT
  // =========================================================================

  /**
   * Submit a solution
   * 
   * @param submission - Submission data
   * @returns Promise with submission result
   */
  static async submitSolution(submission: Submission): Promise<SubmissionResponse> {
    // Store locally first (for offline support and history)
    this.storeSubmissionLocally(submission);

    if (!USE_MOCK_API) {
      // Real API call
      const response = await api.post<SubmissionResponse>('/submissions', {
        teamName: submission.teamName,
        questionId: submission.questionId,
        language: submission.language,
        content: submission.content,
        timestamp: submission.timestamp,
      });

      if (response.success && response.data) {
        return response.data;
      }

      return {
        submissionId: '',
        status: 'error',
        message: response.error || 'Submission failed',
      };
    }

    // Mock response
    return {
      submissionId: `mock-${Date.now()}`,
      status: 'pending',
      message: 'Submission received',
    };
  }

  /**
   * Store submission locally as backup (submissions are primarily in backend)
   */
  private static storeSubmissionLocally(submission: Submission): void {
    // Keep a session backup for UI purposes only
    // The backend is the source of truth for submissions
    const key = `${this.SUBMISSIONS_KEY_PREFIX}${submission.teamName}`;
    const submissionsStr = sessionStorage.getItem(key);
    
    let submissions: Submission[] = [];
    if (submissionsStr) {
      try {
        submissions = JSON.parse(submissionsStr);
      } catch {
        submissions = [];
      }
    }

    submissions.push(submission);
    sessionStorage.setItem(key, JSON.stringify(submissions));
  }

  /**
   * Get all submissions for a team
   * 
   * @param teamName - Team identifier
   * @returns Array of submissions
   */
  static getSubmissions(teamName: string): Submission[] {
    const key = `${this.SUBMISSIONS_KEY_PREFIX}${teamName}`;
    const submissionsStr = sessionStorage.getItem(key);
    
    if (!submissionsStr) return [];

    try {
      return JSON.parse(submissionsStr) as Submission[];
    } catch {
      return [];
    }
  }

  /**
   * Get submission count for a specific question
   * 
   * @param teamName - Team identifier
   * @param questionId - Question ID
   * @returns Number of submissions for the question
   */
  static getQuestionSubmissionCount(teamName: string, questionId: string): number {
    const submissions = this.getSubmissions(teamName);
    return submissions.filter(s => s.questionId === questionId).length;
  }

  /**
   * Get the latest submission for a question
   * 
   * @param teamName - Team identifier
   * @param questionId - Question ID
   * @returns Latest submission or null
   */
  static getLatestSubmission(teamName: string, questionId: string): Submission | null {
    const submissions = this.getSubmissions(teamName);
    const questionSubmissions = submissions.filter(s => s.questionId === questionId);
    
    if (questionSubmissions.length === 0) return null;
    
    return questionSubmissions.reduce((latest, current) => 
      current.timestamp > latest.timestamp ? current : latest
    );
  }

  // =========================================================================
  // CLEANUP UTILITIES
  // =========================================================================

  /**
   * Clear all competition data for a team
   */
  static clearAllData(teamName: string): void {
    // Clear competition state
    sessionStorage.removeItem(`${this.COMPETITION_KEY_PREFIX}${teamName}`);
    
    // Clear submissions
    sessionStorage.removeItem(`${this.SUBMISSIONS_KEY_PREFIX}${teamName}`);
    
    // Clear drafts
    this.clearDrafts(teamName);
  }
}
