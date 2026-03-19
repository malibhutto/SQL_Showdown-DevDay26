import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShieldAlert, Users, KeyRound, Zap } from "lucide-react";
import "./Login.css";

export function Login() {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(teamName, password);
      navigate("/competition");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid credentials");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="data-stream-layer">
        <span
          className="data-stream"
          style={{ left: "10%", animationDelay: "0s" }}
        >
          01010101
        </span>
        <span
          className="data-stream"
          style={{ left: "25%", animationDelay: "4s" }}
        >
          SELECT * FROM users
        </span>
        <span
          className="data-stream"
          style={{ left: "40%", animationDelay: "2s" }}
        >
          LEFT JOIN
        </span>
        <span
          className="data-stream"
          style={{ left: "60%", animationDelay: "8s" }}
        >
          WHERE auth = TRUE
        </span>
        <span
          className="data-stream"
          style={{ left: "75%", animationDelay: "5s" }}
        >
          11001010
        </span>
        <span
          className="data-stream"
          style={{ left: "90%", animationDelay: "1s" }}
        >
          CREATE INDEX
        </span>
      </div>

      <div className="login-card-split glass-panel corner-bracket">
        <div className="mission-briefing">
          <div className="classification-banner">
            <span
              className="glitch-text"
              style={{
                fontFamily: "Orbitron",
                fontSize: "0.7rem",
                color: "var(--danger)",
                letterSpacing: "0.15em",
                textShadow: "0 0 10px rgba(255, 107, 107, 0.8)",
              }}
            >
              ⬛ CLASSIFIED // OPERATION FILE
            </span>
          </div>

          <div className="mission-details">
            <h2>
              OPERATION: <span>SQL SHOWDOWN</span>
            </h2>
            {/* <h2>LOCATION: <span>DATAVERSE GRID</span></h2> */}
            <h2>
              LOCATION: <span>Makarov's Network</span>
            </h2>
            <h2>
              CLEARANCE: <span>TEAM AGENT</span>
            </h2>
            <h2>
              STATUS: <span className="status-live">● LIVE</span>
            </h2>
          </div>

          {/* <p className="briefing-text">
            Your team must infiltrate the DataVerse and extract intelligence
            through precision SQL queries. Only the most accurate agents will
            survive.
          </p> */}
          <p className="briefing-text">
            Makarov has escaped prison and didn't do it alone. A vast hidden
            network of financial transactions, arms deals, and agent records is
            buried in captured enemy databases. Price needs his best analyst to
            expose Makarov's entire network before he triggers world war.
          </p>

          <div className="system-status-indicators">
            <div className="led-indicator">Database Linked</div>
            <div className="led-indicator">Competition Active</div>
            <div className="led-indicator">Agents Online</div>
          </div>
          <div className="corner-bracket-inner"></div>
        </div>

        <div className="login-form-side">
          <div className="login-header">
            <h1 className="neon-text">AGENT LOGIN</h1>
            <p className="subheading">DEVELOPERS DAY 2026 // SQL SHOWDOWN</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>AGENT DESIGNATION</label>
              <div className="input-with-icon">
                <Users className="input-icon" size={18} />
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter team alias..."
                  required
                  disabled={isLoading}
                  className="tactical-input"
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label>ACCESS CODE</label>
              <div className="input-with-icon">
                <KeyRound className="input-icon" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  required
                  disabled={isLoading}
                  className="tactical-input"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="tactical-alert">
                <ShieldAlert
                  size={18}
                  className="alert-icon"
                  style={{ flexShrink: 0 }}
                />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="tactical-btn login-btn"
            >
              <Zap size={18} />
              {isLoading ? "ESTABLISHING LINK..." : "INITIATE MISSION"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
