const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

interface Competition {
  competitionName: string;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  maxTeams: number;
}

interface Team {
  teamName: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  hasProgress: boolean;
  totalPoints: number;
  questionsSolved: number;
  totalSubmissions: number;
}

interface LeaderboardEntry {
  rank: number;
  teamName: string;
  totalPoints: number;
  questionsSolved: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  lastActivityAt: string;
}

interface Stats {
  registeredTeams: number;
  activeParticipants: number;
  totalSubmissions: number;
  topTeams: Array<{
    teamName: string;
    totalPoints: number;
    solvedCount: number;
  }>;
}

interface QuestionData {
  questionId: string;
  title: string;
  description: string;
  setupSql: string;
  starterSql?: string;
  solutionSql: string;
  expectedStdout: string;
  dialect: string;
  expectedOutput: {
    type: 'scalar' | 'table';
    columns?: string[];
    rows: (string | number | null)[][];
    orderMatters: boolean;
    caseSensitive: boolean;
    numericTolerance: number;
  };
  constraints: {
    allowOnlySelect: boolean;
    maxRows: number;
    maxQueryLength: number;
  };
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

class AdminService {
  private adminKey: string;

  constructor() {
    this.adminKey = sessionStorage.getItem('adminKey') || '';
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    // Attach admin key if present (admin panel uses this)
    if (this.adminKey) {
      headers['x-admin-key'] = this.adminKey;
    }

    // Also attach Bearer token if session exists (backend expects JWT for some admin routes)
    try {
      const session = sessionStorage.getItem('session');
      if (session) {
        const parsed = JSON.parse(session);
        if (parsed?.token) {
          headers['Authorization'] = `Bearer ${parsed.token}`;
        }
      }
    } catch {
      // ignore parse errors
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data;
    }

    return data;
  }

  setAdminKey(key: string) {
    this.adminKey = key;
    sessionStorage.setItem('adminKey', key);
  }

  getAdminKey(): string {
    return this.adminKey;
  }

  clearAdminKey() {
    this.adminKey = '';
    sessionStorage.removeItem('adminKey');
  }

  // Competition Management
  async getCompetition(): Promise<Competition | null> {
    const response = await this.request<{ success: boolean; config: Competition | null }>('/admin/competition');
    return response.config;
  }

  async createCompetition(data: {
    competitionName: string;
    startTime: string;
    duration?: number;
    isActive?: boolean;
    maxTeams?: number;
  }): Promise<Competition> {
    const response = await this.request<{ success: boolean; config: Competition }>('/admin/competition', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.config;
  }

  async deleteCompetition(): Promise<void> {
    await this.request('/admin/competition', { method: 'DELETE' });
  }

  async resetCompetition(): Promise<{
    deletedProgress: number;
    deletedSubmissions: number;
  }> {
    const response = await this.request<{
      success: boolean;
      deletedProgress: number;
      deletedSubmissions: number;
    }>('/admin/competition/reset', { method: 'POST' });
    return {
      deletedProgress: response.deletedProgress,
      deletedSubmissions: response.deletedSubmissions,
    };
  }

  // Team Management
  async getAllTeams(): Promise<Team[]> {
    const response = await this.request<{ success: boolean; teams: Team[] }>('/admin/teams');
    return response.teams;
  }

  async registerTeam(teamName: string, password: string): Promise<void> {
    await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamName, password }),
    }).then(res => {
      if (!res.ok) throw res;
      return res.json();
    });
  }

  // Leaderboard
  async getResults(order: 'asc' | 'desc' = 'desc'): Promise<LeaderboardEntry[]> {
    const response = await this.request<{ success: boolean; results: LeaderboardEntry[] }>(`/admin/results?order=${order}`);
    return response.results;
  }

  async getTeamResults(teamName: string) {
    const response = await this.request<any>(`/admin/results/${teamName}`);
    return response;
  }

  // Statistics
  async getStatistics(): Promise<Stats> {
    const response = await this.request<{ success: boolean; stats: Stats }>('/admin/statistics');
    return response.stats;
  }

  // Submissions
  async getSubmissions(filters?: {
    teamName?: string;
    questionId?: string;
    verdict?: string;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters?.teamName) params.append('teamName', filters.teamName);
    if (filters?.questionId) params.append('questionId', filters.questionId);
    if (filters?.verdict) params.append('verdict', filters.verdict);
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await this.request<{ success: boolean; submissions: any[] }>(`/admin/submissions?${params.toString()}`);
    return response.submissions;
  }

  // Question Management
  async createQuestion(questionData: QuestionData): Promise<void> {
    await this.request('/questions', {
      method: 'POST',
      body: JSON.stringify(questionData),
    });
  }

  async getAllQuestions() {
    const response = await this.request<{ success: boolean; questions: any[] }>('/questions');
    return response.questions;
  }

  // Verify admin access
  async verifyAdminAccess(): Promise<boolean> {
    try {
      await this.request('/admin/verify');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export default new AdminService();
