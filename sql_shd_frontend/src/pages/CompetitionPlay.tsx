import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCompetition } from "../contexts/CompetitionContext";
import { SplitLayout } from "../components/SplitLayout";
import { QuestionPanel } from "../components/QuestionPanel";
import { EditorPanel } from "../components/EditorPanel";
import { BottomBar } from "../components/BottomBar";
import type { EditorLanguage } from "../types";
import "./CompetitionPlay.css";

export function CompetitionPlay() {
  const { session, logout } = useAuth();
  const {
    currentQuestionIndex,
    setCurrentQuestionIndex,
    isEnded,
    solvedQuestions,
    totalPoints,
    questions,
    isLoading,
    currentQuestion,
    remainingTime,
    refetchQuestions,
  } = useCompetition();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Ready");
  const [currentLanguage, setCurrentLanguage] = useState<EditorLanguage>("sql");

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };
  // Fetch questions when component mounts or when competition starts
  useEffect(() => {
    if (questions.length === 0 && !isLoading) {
      console.log("No questions loaded, fetching...");
      refetchQuestions();
    }
  }, [questions.length, isLoading, refetchQuestions]);

  // Check if current question is solved
  const isCurrentQuestionSolved = currentQuestion
    ? solvedQuestions.includes(currentQuestion.id)
    : false;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="play-container">
        <div className="loading-fullscreen">
          <h1
            className="neon-text loading-logo text-center mb-12"
            style={{ fontSize: "4rem" }}
          >
            SQL SHOWDOWN
          </h1>
          <div className="loading-steps flex flex-col gap-4 mb-12 w-full max-w-md mx-auto">
            <div
              className="flex items-center gap-3 animate-fade-up"
              style={{
                animationDelay: "0.2s",
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div
                className="led-indicator"
                style={{ display: "inline-block" }}
              ></div>
              <span className="text-secondary font-mono tracking-widest text-sm">
                INITIALIZING DATAVERSE LINK...
              </span>
            </div>
            <div
              className="flex items-center gap-3 animate-fade-up"
              style={{
                animationDelay: "0.8s",
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div
                className="led-indicator"
                style={{ display: "inline-block" }}
              ></div>
              <span className="text-secondary font-mono tracking-widest text-sm">
                AUTHENTICATING AGENT CREDENTIALS...
              </span>
            </div>
            <div
              className="flex items-center gap-3 animate-fade-up"
              style={{
                animationDelay: "1.4s",
                opacity: 0,
                animationFillMode: "forwards",
              }}
            >
              <div
                className="led-indicator"
                style={{ display: "inline-block" }}
              ></div>
              <span className="text-secondary font-mono tracking-widest text-sm">
                SYNCING MISSION DATABASE...
              </span>
            </div>
          </div>
          <div className="loading-progress-container w-full max-w-md mx-auto h-1 bg-black/50 border border-primary/20 rounded overflow-hidden">
            <div
              className="loading-progress-bar h-full bg-primary"
              style={{ animation: "progressFill 2s ease-out forwards" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="play-container">
        <div
          className="loading-state glass-panel corner-bracket"
          style={{ padding: "40px", margin: "auto" }}
        >
          <p className="font-mono text-secondary mb-4 text-center">
            NO MISSION OBJECTIVES DETECTED IN DATAVERSE.
          </p>
          <button
            onClick={() => refetchQuestions()}
            className="tactical-btn"
            style={{ padding: "12px 24px", cursor: "pointer", width: "100%" }}
          >
            RE-ESTABLISH UPLINK
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="play-container">
      {/* HUD Top Bar */}
      <header className="play-hud-bar">
        <div className="hud-sweep-line"></div>

        <div className="hud-left">
          <div className="hud-team-badge flex items-center gap-4">
            <div className="bg-primary/10 p-2 rounded border border-primary/30 text-primary">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <span className="font-orbitron font-bold tracking-widest">
              {session?.teamName}
            </span>
          </div>
        </div>

        <div
          className="hud-separator-vertical hidden md:block absolute"
          style={{ left: "33.33%" }}
        ></div>

        <div className="hud-center flex flex-col items-center">
          <span className="text-[10px] text-secondary font-orbitron tracking-[0.2em] mb-1">
            TIME REMAINING
          </span>
          <span
            className={`font-orbitron font-bold text-2xl tracking-widest ${remainingTime < 300000 ? "text-danger animate-pulse-glow glow-text-danger" : "text-primary neon-text"}`}
          >
            {formatTime(remainingTime)}
          </span>
        </div>

        <div
          className="hud-separator-vertical hidden md:block absolute"
          style={{ left: "66.66%" }}
        ></div>

        <div className="hud-right flex gap-6 items-center">
          <div className="hud-points flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gold"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span className="font-orbitron font-bold text-gold glow-text-gold">
              {totalPoints} PTS
            </span>
          </div>

          <div className="hud-solved flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span className="font-mono text-sm tracking-widest text-primary">
              {solvedQuestions.length}/{questions.length} SOLVED
            </span>
          </div>

          <div className="hud-separator-vertical h-8"></div>

          <button
            onClick={handleLogout}
            // className="text-xs font-mono text-secondary hover:text-danger uppercase tracking-widest transition-colors"
            className="logout-button"
          >
            ABORT
          </button>
        </div>
      </header>

      {/* Selector Tabs (Simplified visual treatment mapped over the question panel) */}
      {/* <div className="question-selector-tabs flex bg-[#161A22]/90 border-b border-primary/15 overflow-x-auto"> */}
      <div className="question-selector-tabs flex bg-[#161A22]/90 border-primary/15 overflow-x-auto">
        {questions.map((q, idx) => {
          const isActived = idx === currentQuestionIndex;
          const isSolved = solvedQuestions.includes(q.id);

          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`px-6 py-3 font-orbitron text-xs tracking-widest flex items-center gap-2 border-b-2 transition-colors
                ${
                  isActived
                    ? "border-primary bg-primary/10 text-primary"
                    : isSolved
                      ? "border-neon-green/50 text-neon-green"
                      : "border-transparent text-secondary hover:bg-white/5"
                }`}
              style={{
                color: isSolved && !isActived ? "var(--accent-primary)" : "",
              }}
            >
              {isSolved && !isActived && <span className="text-[10px]">✓</span>}
              Q.{String(idx + 1).padStart(2, "0")}
            </button>
          );
        })}
      </div>

      <div
        className="split-layout-wrapper"
        style={{ display: "flex", flex: 1, minHeight: 0, overflow: "hidden" }}
      >
        <SplitLayout
          left={
            <QuestionPanel
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={questions.length}
              onNext={handleNext}
              onPrevious={handlePrevious}
              hasNext={currentQuestionIndex < questions.length - 1}
              hasPrevious={currentQuestionIndex > 0}
              isSolved={isCurrentQuestionSolved}
            />
          }
          right={
            <EditorPanel
              question={currentQuestion}
              isLocked={isEnded}
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
            />
          }
        />
      </div>

      <BottomBar
        status={status}
        onStatusChange={setStatus}
        isLocked={isEnded}
        currentLanguage={currentLanguage}
      />
    </div>
  );
}
