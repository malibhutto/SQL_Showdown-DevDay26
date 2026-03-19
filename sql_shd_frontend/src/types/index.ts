// Expected output structure
export interface ExpectedOutput {
  type: 'scalar' | 'table';
  columns?: string[];
  rows: (string | number | null)[][];
  orderMatters: boolean;
  caseSensitive: boolean;
  numericTolerance: number;
}

// Backend Question format (fetched from API)
export interface BackendQuestion {
  questionId: string;
  title: string;
  description: string;
  setupSql: string;
  starterSql: string;
  dialect: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  expectedOutput?: ExpectedOutput;
}

// Frontend Question format (used for display)
export interface Question {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  setupSql: string;
  starterSql: string;
  points: number;
  expectedOutput?: ExpectedOutput;
}

export interface Table {
  name: string;
  columns: string[];
  rows: (string | number)[][];
}

export interface Session {
  teamName: string;
  token: string;
  loginTime: number;
}

export interface Submission {
  teamName: string;
  questionId: string;
  language: 'sql';
  content: string;
  timestamp: number;
}

export interface CompetitionState {
  startTime: number | null;
  duration: number; // in milliseconds
  ended: boolean;
}

export type EditorLanguage = 'sql';

// Helper to convert backend question to frontend format
export function toFrontendQuestion(q: BackendQuestion): Question {
  const difficulty = q.difficulty || 'easy';
  return {
    id: q.questionId,
    title: q.title || 'Untitled',
    difficulty: (difficulty.charAt(0).toUpperCase() + difficulty.slice(1)) as 'Easy' | 'Medium' | 'Hard',
    description: q.description || '',
    setupSql: q.setupSql || '',
    starterSql: q.starterSql || '',
    points: q.points || 100,
    expectedOutput: q.expectedOutput
  };
}
