import { useState, useEffect, useCallback, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useCompetition } from "../contexts/CompetitionContext";
import { api } from "../services/api";
import "./CompetitionLobby.css";

interface CompetitionConfigResponse {
  success: boolean;
  configured: boolean;
  competition?: {
    name: string;
    startTime: number;
    endTime: number;
    duration: number;
    status: "upcoming" | "active" | "ended";
    timeUntilStart: number;
    remainingTime: number;
    serverTime: number;
  };
  message?: string;
}

export function CompetitionLobby() {
  const [isEntering, setIsEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competitionConfig, setCompetitionConfig] = useState<
    CompetitionConfigResponse["competition"] | null
  >(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const { session, logout } = useAuth();
  const { startCompetition } = useCompetition();
  const navigate = useNavigate();

  // Fetch competition config from server
  const fetchCompetitionConfig = useCallback(async () => {
    try {
      const response = await api.get<CompetitionConfigResponse>(
        "/competition/config",
      );

      if (
        response.success &&
        response.data?.configured &&
        response.data.competition
      ) {
        const config = response.data.competition;
        setCompetitionConfig(config);

        if (config.status === "upcoming") {
          setCountdown(config.timeUntilStart);
        } else if (config.status === "active") {
          setCountdown(config.remainingTime);
        }
      } else {
        setCompetitionConfig(null);
      }
    } catch (err) {
      console.error("Failed to fetch competition config:", err);
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetitionConfig();

    // Refresh config every 30 seconds to stay in sync with server
    const refreshInterval = setInterval(fetchCompetitionConfig, 30000);
    return () => clearInterval(refreshInterval);
  }, [fetchCompetitionConfig]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        const newValue = prev - 1000;
        if (newValue <= 0) {
          // Refresh config when countdown reaches 0
          fetchCompetitionConfig();
          return 0;
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, fetchCompetitionConfig]);

  const formatCountdown = (ms: number): string => {
    if (ms <= 0) return "00:00:00";

    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatDateTime = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString();
  };

  const handleEnter = async () => {
    if (!competitionConfig || competitionConfig.status !== "active") {
      setError("Competition is not active");
      return;
    }

    setIsEntering(true);
    setError(null);

    try {
      await startCompetition();
      navigate("/competition/play");
    } catch (err: any) {
      console.error("Failed to enter competition:", err);
      setError(err.message || "Failed to enter competition");
      setIsEntering(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (isLoading) {
    return (
      <div className="lobby-container">
        <div className="lobby-scanline"></div>
        <div className="loading-state glass-panel corner-bracket">
          <div className="spinner"></div>
          <p className="neon-text">INITIALIZING DATAVERSE LINK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="lobby-container">
      {/* Visual Effects */}
      <div className="lobby-scanline"></div>
      <div className="data-stream-left"></div>
      <div className="data-stream-right"></div>
      <div className="radar-sweep-bg"></div>

      <header className="lobby-header-tactical">
        <div className="header-left">
          <span className="mission-id">⬛ MISSION: SQL SHOWDOWN</span>
        </div>
        <div className="header-center">
          {competitionConfig && (
            <div className={`status-pill ${competitionConfig.status}`}>
              {competitionConfig.status === "upcoming" && "UPCOMING OPERATION"}
              {competitionConfig.status === "active" && "LIVE OPERATION"}
              {competitionConfig.status === "ended" && "OPERATION CONCLUDED"}
            </div>
          )}
        </div>
        <div className="header-right">
          <div className="system-status-indicators row">
            <div className="led-indicator">Database Linked</div>
            <div className="led-indicator">System Ready</div>
            <div className="led-indicator">Awaiting Agents</div>
          </div>
          <div className="hud-separator-vertical"></div>
          <span className="team-name">{session?.teamName}</span>
          <button onClick={handleLogout} className="logout-button uppercase tracking-widest text-xs">
            ABORT
          </button>
        </div>
      </header>

      <main className="lobby-main">
        {!competitionConfig ? (
          <div className="competition-card glass-panel corner-bracket no-competition">
            <h2 className="neon-text">NO ACTIVE OPERATIONS</h2>
            <p>
              There is no competition scheduled at this time. Please stand by for further orders.
            </p>
          </div>
        ) : (
          <div className="competition-card glass-panel corner-bracket">
            <h1 className="neon-text mission-title text-center text-4xl mb-2">MISSION BRIEFING</h1>
            <div className="hud-separator"></div>

            <div className="operation-name text-center mb-8 mt-4">
              <h2 className="text-2xl text-primary">{competitionConfig.name}</h2>
            </div>

            {competitionConfig.status === "upcoming" && (
              <div className="countdown-section">
                <h3 className="neon-text text-sm mb-4 tracking-widest">TIME UNTIL DEPLOYMENT</h3>
                <div className="countdown-timer tactical-timer">
                  {formatCountdown(countdown).split(':').map((digit, i, arr) => (
                    <Fragment key={i}>
                      <span className="timer-box">
                        {digit}
                      </span>
                      {i < arr.length - 1 && <span className="timer-colon">:</span>}
                    </Fragment>
                  ))}
                </div>
                <p className="start-time mt-4 text-xs text-secondary">
                  DEPLOYMENT AT: {formatDateTime(competitionConfig.startTime)}
                </p>
              </div>
            )}

            {competitionConfig.status === "active" && (
              <div className="countdown-section active">
                <h3 className="text-danger text-sm mb-4 tracking-widest" style={{ textShadow: '0 0 10px rgba(255, 107, 107, 0.5)' }}>OPERATION ENDS IN</h3>
                <div className="countdown-timer tactical-timer active-timer animate-pulse-glow">
                  {formatCountdown(countdown).split(':').map((digit, i, arr) => (
                    <Fragment key={i}>
                      <span className="timer-box border-danger text-danger">
                        {digit}
                      </span>
                      {i < arr.length - 1 && <span className="timer-colon text-danger">:</span>}
                    </Fragment>
                  ))}
                </div>
              </div>
            )}

            {competitionConfig.status === "ended" && (
              <div className="ended-section glass-panel">
                <h3 className="text-secondary text-sm mb-2 tracking-widest">OPERATION CONCLUDED</h3>
                <p>
                  This mission has ended. Awaiting post-action reports.
                </p>
              </div>
            )}

            <div className="competition-details mt-8">
              <div className="detail-item glass-panel">
                <span className="detail-label text-accent-primary">DURATION</span>
                <span className="detail-value text-xl">
                  {Math.round(competitionConfig.duration / 60000)} MIN
                </span>
              </div>
              <div className="detail-item glass-panel">
                <span className="detail-label text-accent-primary">START</span>
                <span className="detail-value text-sm">
                  {formatDateTime(competitionConfig.startTime)}
                </span>
              </div>
              <div className="detail-item glass-panel">
                <span className="detail-label text-accent-primary">END</span>
                <span className="detail-value text-sm">
                  {formatDateTime(competitionConfig.endTime)}
                </span>
              </div>
            </div>

            <div className="rules-section glass-panel mt-8 text-left p-6">
              <h3 className="flex items-center gap-2 text-accent-primary mb-4">
                <span className="icon-shield">🛡️</span> OPERATIONAL RULES
              </h3>
              <ul className="space-y-3 text-sm text-secondary">
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary">→</span>
                  <span><strong>AI tools (ChatGPT, Copilot, etc.) are strictly prohibited.</strong> System monitors will flag unauthorized assistance.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary">→</span>
                  <span><strong>Winner Criteria:</strong> Highest intelligence gathered (score) wins. Ties broken by earliest extraction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary">→</span>
                  <span>Operation is strictly time-bound. No extensions.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary">→</span>
                  <span>You may switch between objectives (questions) at any time.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary">→</span>
                  <span>Multiple submission attempts authorized until successful extraction.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-primary">→</span>
                  <span>All terminals lock out automatically upon mission end time.</span>
                </li>
              </ul>
            </div>

            {error && <div className="tactical-alert mt-4">{error}</div>}

            <div className="action-container mt-8 flex justify-center">
              {competitionConfig.status === "active" && (
                <button
                  onClick={handleEnter}
                  className="tactical-btn animate-pulse-glow"
                  disabled={isEntering}
                  style={{ width: '320px', height: '60px', fontSize: '1.2rem', padding: '0 20px' }}
                >
                  <span className="mr-2">🎯</span>
                  {isEntering ? "ESTABLISHING LINK..." : "ENTER OPERATION"}
                </button>
              )}

              {competitionConfig.status === "upcoming" && (
                <button className="tactical-btn" disabled style={{ width: '320px', height: '60px', fontSize: '1.1rem' }}>
                  AWAITING DEPLOYMENT...
                </button>
              )}

              {competitionConfig.status === "ended" && (
                <button className="tactical-btn" disabled style={{ width: '320px', height: '60px', fontSize: '1.1rem' }}>
                  MISSION OVER
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
