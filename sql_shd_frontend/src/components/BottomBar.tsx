import { useState, useEffect, useCallback } from "react";
import { CompetitionService } from "../services/CompetitionService";
import { useAuth } from "../contexts/AuthContext";
import { useCompetition } from "../contexts/CompetitionContext";
import { ResultComparison } from "./ResultComparison";
import { api } from "../services/api";
import type { EditorLanguage, ExpectedOutput } from "../types";
import {
  Play,
  Send,
  TerminalSquare,
  AlertCircle,
  XOctagon,
} from "lucide-react";
import "./BottomBar.css";

interface RunResponse {
  success: boolean;
  execution: {
    stdout: string;
    stderr: string | null;
    executionTimeMs: number;
    parsedOutput?: {
      columns: string[];
      rows: (string | number | null)[][];
    };
  };
  expectedOutput?: ExpectedOutput;
}

interface SubmitResponse {
  success: boolean;
  verdict: "Accepted" | "Wrong Answer" | "Runtime Error";
  message: string;
  pointsAwarded?: number;
  alreadySolved?: boolean;
  execution?: {
    executionTimeMs: number;
    parsedOutput?: {
      columns: string[];
      rows: (string | number | null)[][];
    };
  };
  expectedOutput?: ExpectedOutput;
  hiddenFailed?: boolean;
}

interface BottomBarProps {
  status: string;
  onStatusChange: (status: string) => void;
  isLocked: boolean;
  currentLanguage: EditorLanguage;
}

interface ExecutionResult {
  userResult: { columns: string[]; rows: (string | number | null)[][] } | null;
  expectedResult: ExpectedOutput | null;
  executionTime?: number;
  error?: string;
  verdict?: "Accepted" | "Wrong Answer" | "Runtime Error" | null;
}

export function BottomBar({
  status,
  onStatusChange,
  isLocked,
}: BottomBarProps) {
  const { session } = useAuth();
  const {
    currentQuestion,
    remainingTime,
    markQuestionSolved,
    solvedQuestions,
  } = useCompetition();
  const isQuestionSolved = !!(
    currentQuestion && solvedQuestions.includes(currentQuestion.id)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<ExecutionResult | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(Date.now());

  // Update status when competition ends
  useEffect(() => {
    if (remainingTime === 0 && status !== "Competition ended") {
      onStatusChange("MISSION TIMER EXPIRED");
    }
  }, [remainingTime, status, onStatusChange]);

  /**
   * Handles code execution via backend API
   */
  const handleRun = useCallback(async () => {
    if (isLocked || !session?.teamName || !currentQuestion) return;
    if (isQuestionSolved) {
      onStatusChange("OBJECTIVE SECURED — UPLINK LOCKED");
      return;
    }
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const sec = Math.ceil((cooldownUntil - Date.now()) / 1000);
      onStatusChange(`COOLDOWN INTERLOCK ACTIVE: ${sec}S`);
      return;
    }

    // Get the draft content for the current question
    const content =
      CompetitionService.getDraft(
        session.teamName,
        currentQuestion.id,
        "sql",
      ) || "";

    // Validate SQL is not empty
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent === "-- Write your SQL query here") {
      onStatusChange("ERROR: EMPTY QUERY PROTOCOL");
      setTimeout(() => onStatusChange("SYSTEM READY"), 3000);
      return;
    }

    onStatusChange("EXECUTING QUERY...");
    // start cooldown immediately (5s)
    setCooldownUntil(Date.now() + 5 * 1000);
    setShowResults(false);

    try {
      // Call the backend API to run the SQL
      const response = await api.post<RunResponse>("/run", {
        questionId: currentQuestion.id,
        sql: trimmedContent,
      });

      if (response.success && response.data) {
        const { execution, expectedOutput } = response.data;
        if (execution.stderr) {
          onStatusChange(`SYNTAX ERROR: ${execution.stderr}`);
          setExecutionResult({
            userResult: null,
            expectedResult: expectedOutput || null,
            executionTime: execution.executionTimeMs,
            error: execution.stderr,
          });
        } else if (execution.parsedOutput) {
          const rowCount = execution.parsedOutput.rows.length;
          onStatusChange(
            `✓ QUERY SUCCESSFUL // ROWS: ${rowCount} [${execution.executionTimeMs}ms]`,
          );
          setExecutionResult({
            userResult: execution.parsedOutput,
            expectedResult: expectedOutput || null,
            executionTime: execution.executionTimeMs,
          });
        } else {
          onStatusChange(`✓ QUERY SUCCESSFUL [${execution.executionTimeMs}ms]`);
          setExecutionResult({
            userResult: null,
            expectedResult: expectedOutput || null,
            executionTime: execution.executionTimeMs,
          });
        }
        setShowResults(true);
      } else {
        onStatusChange(
          `ERROR RETRIEVING DATA: ${response.error || "UNKNOWN FAULT"}`,
        );
        setExecutionResult({
          userResult: null,
          expectedResult: null,
          error: response.error || "SERVER FAULT",
        });
        setShowResults(true);
      }
    } catch (error) {
      onStatusChange("ERROR: DATAVERSE UPLINK FAILED");
      setExecutionResult({
        userResult: null,
        expectedResult: null,
        error: "COMMUNICATION FAILURE",
      });
      setShowResults(true);
    }

    setTimeout(() => onStatusChange("SYSTEM READY"), 4000);
  }, [isLocked, session, currentQuestion, onStatusChange]);

  /**
   * Handles solution submission via backend API
   */
  const handleSubmit = useCallback(async () => {
    if (isLocked || !session?.teamName || !currentQuestion || isSubmitting)
      return;
    if (isQuestionSolved) {
      onStatusChange("OBJECTIVE SECURED — UPLINK LOCKED");
      setIsSubmitting(false);
      return;
    }
    if (cooldownUntil && Date.now() < cooldownUntil) {
      const sec = Math.ceil((cooldownUntil - Date.now()) / 1000);
      onStatusChange(`COOLDOWN INTERLOCK ACTIVE: ${sec}S`);
      return;
    }

    // Get the draft content for the current question
    const content =
      CompetitionService.getDraft(
        session.teamName,
        currentQuestion.id,
        "sql",
      ) || "";

    // Validate SQL is not empty
    const trimmedContent = content.trim();
    if (!trimmedContent || trimmedContent === "-- Write your SQL query here") {
      onStatusChange("ERROR: EMPTY QUERY PROTOCOL");
      setTimeout(() => onStatusChange("SYSTEM READY"), 3000);
      return;
    }

    setIsSubmitting(true);
    onStatusChange("TRANSMITTING INTEL...");
    // start cooldown immediately (5s)
    setCooldownUntil(Date.now() + 5 * 1000);
    setShowResults(false);

    try {
      // Call the backend API to submit the SQL for judging
      const response = await api.post<SubmitResponse>("/run/submit", {
        questionId: currentQuestion.id,
        sql: trimmedContent,
      });

      if (response.success && response.data) {
        const {
          verdict,
          message,
          pointsAwarded,
          alreadySolved,
          execution,
          expectedOutput,
        } = response.data;

        setExecutionResult({
          userResult: execution?.parsedOutput || null,
          expectedResult: expectedOutput || null,
          executionTime: execution?.executionTimeMs,
          verdict,
        });
        setShowResults(true);

        if (verdict === "Accepted") {
          if (alreadySolved) {
            onStatusChange(`✓ MISSION OJBECTIVE VERIFIED: ALREADY SECURED`);
          } else {
            onStatusChange(
              `✓ INTEL VERIFIED: ${message} (+${pointsAwarded || currentQuestion.points} PTS)`,
            );
            markQuestionSolved(
              currentQuestion.id,
              pointsAwarded || currentQuestion.points,
            );
          }
        } else {
          // If backend indicates a hidden test case failed, show a specific message; otherwise show a generic failure
          if (response.data.hiddenFailed) {
            onStatusChange("✗ VERIFICATION FAILED: ENCRYPTED TEST FAULT");
          } else {
            onStatusChange("✗ VERIFICATION FAILED: OUTPUT REJECTED");
          }
        }
      } else {
        onStatusChange(
          `SYSTEM FAULT: ${response.error || "TRANSMISSION REJECTED"}`,
        );
        setExecutionResult({
          userResult: null,
          expectedResult: null,
          error: response.error || "TRANSMISSION REJECTED",
        });
        setShowResults(true);
      }
    } catch (error) {
      onStatusChange("ERROR: DATAVERSE UPLINK FAILED");
      setExecutionResult({
        userResult: null,
        expectedResult: null,
        error: "COMMUNICATION FAILURE",
      });
      setShowResults(true);
    }

    setIsSubmitting(false);
    setTimeout(() => {
      if (!isQuestionSolved) onStatusChange("SYSTEM READY");
    }, 4000);
  }, [
    isLocked,
    session,
    currentQuestion,
    isSubmitting,
    onStatusChange,
    markQuestionSolved,
  ]);

  // Keyboard shortcuts handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        // respect cooldown
        if (cooldownUntil && Date.now() < cooldownUntil) {
          const sec = Math.ceil((cooldownUntil - Date.now()) / 1000);
          onStatusChange(`COOLDOWN INTERLOCK ACTIVE: ${sec}S`);
          return;
        }

        if (e.shiftKey) {
          handleRun();
        } else {
          handleSubmit();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleRun, handleSubmit, cooldownUntil]);

  // Tick to update countdown display every 500ms while on cooldown
  useEffect(() => {
    let timer: number | undefined;
    if (cooldownUntil && cooldownUntil > Date.now()) {
      timer = window.setInterval(() => setNowTick(Date.now()), 500);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownUntil]);

  // Close results panel when navigating to a different question
  useEffect(() => {
    setShowResults(false);
  }, [currentQuestion?.id]);

  return (
    <div className="bottom-bar-wrapper relative">
      <div className="bottom-bar-scanline"></div>

      {showResults && executionResult && (
        <div className="results-panel glass-panel corner-bracket animate-fade-up">
          <div className="results-header flex justify-between items-center mb-4 border-b border-primary/20 pb-2">
            <h3 className="font-orbitron tracking-widest text-primary flex items-center gap-2">
              <TerminalSquare size={16} /> QUERY RESULTS OVERVIEW
            </h3>
            <button
              className="text-secondary hover:text-danger transition-colors"
              onClick={() => setShowResults(false)}
              title="Close Panel"
            >
              <XOctagon size={20} />
            </button>
          </div>

          <ResultComparison
            userResult={executionResult.userResult}
            expectedResult={executionResult.expectedResult}
            executionTime={executionResult.executionTime}
            error={executionResult.error}
            verdict={executionResult.verdict}
          />
        </div>
      )}

      <div className="bottom-bar flex items-center justify-between px-6 py-3 bg-[#0B0E13]/95 border-t border-primary/30 shadow-[0_-5px_20px_rgba(0,0,0,0.5)] z-50 relative backdrop-blur-md">
        <div className="bottom-left flex items-center gap-3">
          <div
            className="led-indicator"
            style={{
              background:
                status.includes("Error") || status.includes("✗")
                  ? "var(--danger)"
                  : status.includes("✓") || status === "SYSTEM READY"
                    ? "var(--success)"
                    : "var(--warning)",
              boxShadow: `0 0 10px ${status.includes("Error") || status.includes("✗") ? "var(--danger)" : status.includes("✓") || status === "SYSTEM READY" ? "var(--success)" : "var(--warning)"}`,
            }}
          ></div>
          {status && (
            <span
              className={`font-mono text-sm tracking-widest ${status.includes("✓") ? "text-success text-shadow-glow" : status.includes("ERROR") || status.includes("✗") || status.includes("FAULT") ? "text-danger animate-pulse-glow" : "text-secondary"}`}
            >
              {status}
            </span>
          )}
        </div>

        <div className="bottom-right flex items-center gap-4">
          <div className="flex gap-4">
            <button
              onClick={handleRun}
              className="tactical-btn run-btn"
              disabled={
                isLocked ||
                isQuestionSolved ||
                (!!cooldownUntil && Date.now() < cooldownUntil)
              }
              title="Execute Query (Ctrl/Cmd + Shift + Enter)"
            >
              <Play size={16} className="mr-2" />
              RUN
            </button>
            <button
              onClick={handleSubmit}
              className="tactical-btn submit-btn"
              disabled={
                isLocked ||
                isQuestionSolved ||
                isSubmitting ||
                (!!cooldownUntil && Date.now() < cooldownUntil)
              }
              title="Transmit Intelligence (Ctrl/Cmd + Enter)"
            >
              <Send size={16} className="mr-2" />
              {isSubmitting ? "TRANSMITTING" : "SUBMIT"}
            </button>
            {cooldownUntil && Date.now() < cooldownUntil && (
              <span className="cooldown-badge font-mono text-warning bg-warning/10 border border-warning/30 px-3 py-1 flex items-center rounded text-sm shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                <AlertCircle size={14} className="mr-2" />
                {Math.ceil((cooldownUntil - nowTick) / 1000)}s
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
