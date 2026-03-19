import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import { api } from "../services/api";
import { useAuth } from "./AuthContext";
import type { Question, BackendQuestion } from "../types";
import { toFrontendQuestion as convertQuestion } from "../types";

interface CompetitionState {
  status: "upcoming" | "active" | "ended" | "not_configured";
  startTime: number;
  endTime: number;
  remainingTime: number;
  timeUntilStart: number;
}

interface CompetitionContextType {
  currentQuestionIndex: number;
  setCurrentQuestionIndex: (index: number) => void;
  remainingTime: number;
  isEnded: boolean;
  startCompetition: () => Promise<void>;
  hasStarted: boolean;
  hasEntered: boolean;
  solvedQuestions: string[];
  totalPoints: number;
  markQuestionSolved: (questionId: string, points: number) => void;
  questions: Question[];
  isLoading: boolean;
  currentQuestion: Question | null;
  refetchQuestions: () => Promise<void>;
  competitionState: CompetitionState | null;
}

const CompetitionContext = createContext<CompetitionContextType | undefined>(
  undefined,
);

export function CompetitionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasEntered, setHasEntered] = useState(false);
  const [solvedQuestions, setSolvedQuestions] = useState<string[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [competitionState] = useState<CompetitionState | null>(null);

  // Fetch questions from backend
  const fetchQuestions = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Fetching questions from /api/questions...");
      const response = await api.get<{
        success: boolean;
        questions: BackendQuestion[];
      }>("/questions");

      console.log("Raw API response:", response);
      console.log("Response data:", response.data);

      if (response.success && response.data) {
        const backendQuestions = response.data.questions || [];
        console.log("Backend questions count:", backendQuestions.length);
        console.log("First question:", backendQuestions[0]);
        const frontendQuestions = backendQuestions.map(convertQuestion);
        console.log("Converted questions count:", frontendQuestions.length);
        console.log("First converted question:", frontendQuestions[0]);
        setQuestions(frontendQuestions);
      } else {
        console.error("Response not successful or no data:", response);
      }
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load progress on mount/refresh if user is logged in
  useEffect(() => {
    const loadProgress = async () => {
      if (!session?.teamName) return;

      try {
        // Check competition config first
        const configResponse = await api.get<{
          success: boolean;
          configured: boolean;
          competition?: {
            status: "upcoming" | "active" | "ended";
            remainingTime: number;
            startTime: number;
            endTime: number;
          };
        }>("/competition/config");

        if (configResponse.success && configResponse.data?.configured) {
          const comp = configResponse.data.competition;
          if (comp && comp.status === "active") {
            setRemainingTime(comp.remainingTime || 0);
          }
        }

        // Try to load user's progress
        const progressResponse = await api.get<{
          success: boolean;
          progress?: {
            totalPoints: number;
            solvedQuestions: Array<{ questionId: string; points: number }>;
            startedAt: number;
          };
        }>("/competition/progress");

        if (progressResponse.success && progressResponse.data?.progress) {
          const prog = progressResponse.data.progress;
          setTotalPoints(prog.totalPoints || 0);
          setSolvedQuestions(
            prog.solvedQuestions?.map((q) => q.questionId) || [],
          );
          setHasEntered(true);
          setHasStarted(true);

          // Load questions
          await fetchQuestions();
        }
      } catch (error: any) {
        // User hasn't entered competition yet, that's okay
        console.log("No existing progress found (user may not have entered)");
      }
    };

    loadProgress();
  }, [session?.teamName, fetchQuestions]);

  // Countdown timer
  useEffect(() => {
    if (remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        const newValue = prev - 1000;
        return newValue > 0 ? newValue : 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingTime]);

  // Enter competition (calls /competition/enter)
  const startCompetition = async () => {
    if (!session?.teamName) {
      throw new Error("Not logged in");
    }

    try {
      const response = await api.post<{
        success: boolean;
        error?: string;
        code?: string;
        competitionId?: string;
        startTime?: number;
        endTime?: number;
        remainingTime?: number;
        questionsCount?: number;
        totalPoints?: number;
        solvedQuestions?: string[];
      }>("/competition/enter", {});

      if (!response.success) {
        throw new Error(response.error || "Failed to enter competition");
      }

      if (response.data) {
        setHasEntered(true);
        setHasStarted(true);
        setRemainingTime(response.data.remainingTime || 0);
        setTotalPoints(response.data.totalPoints || 0);
        setSolvedQuestions(response.data.solvedQuestions || []);

        // Fetch questions
        await fetchQuestions();
        setCurrentQuestionIndex(0);
      }
    } catch (error: any) {
      console.error("Failed to enter competition:", error);
      throw error;
    }
  };

  const markQuestionSolved = (questionId: string, points: number) => {
    setSolvedQuestions((prev) => {
      if (prev.includes(questionId)) return prev;
      return [...prev, questionId];
    });
    setTotalPoints((prev) => prev + points);
  };

  const isEnded = remainingTime === 0 && hasEntered;
  const currentQuestion = questions[currentQuestionIndex] || null;

  console.log("CompetitionContext state:", {
    questionsCount: questions.length,
    currentQuestionIndex,
    hasCurrentQuestion: !!currentQuestion,
    currentQuestionId: currentQuestion?.id,
  });

  return (
    <CompetitionContext.Provider
      value={{
        currentQuestionIndex,
        setCurrentQuestionIndex,
        remainingTime,
        isEnded,
        startCompetition,
        hasStarted,
        hasEntered,
        solvedQuestions,
        totalPoints,
        markQuestionSolved,
        questions,
        isLoading,
        currentQuestion,
        refetchQuestions: fetchQuestions,
        competitionState,
      }}
    >
      {children}
    </CompetitionContext.Provider>
  );
}

export function useCompetition() {
  const context = useContext(CompetitionContext);
  if (!context) {
    throw new Error("useCompetition must be used within CompetitionProvider");
  }
  return context;
}
