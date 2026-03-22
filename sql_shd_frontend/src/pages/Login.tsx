import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ShieldAlert, Users, KeyRound, Zap } from "lucide-react";
import "./Login.css";

const loginDataStreams = [
  { text: "01010101", className: "stream-pos-1" },
  { text: "SELECT * FROM users", className: "stream-pos-2" },
  { text: "LEFT JOIN", className: "stream-pos-3" },
  { text: "WHERE auth = TRUE", className: "stream-pos-4" },
  { text: "11001010", className: "stream-pos-5" },
  { text: "CREATE INDEX", className: "stream-pos-6" },
];

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
        {loginDataStreams.map((stream) => (
          <span
            key={stream.text}
            className={`data-stream ${stream.className}`}
            aria-hidden="true"
          >
            {stream.text}
          </span>
        ))}
      </div>

      <div className="login-card-split glass-panel corner-bracket">
        <div className="mission-briefing">
          <div className="classification-banner">
            <span className="glitch-text classification-text">
              CLASSIFIED // OPERATION FILE
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
              <label htmlFor="team-name">AGENT DESIGNATION</label>
              <div className="input-with-icon">
                <Users className="input-icon" size={18} />
                <input
                  id="team-name"
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
              <label htmlFor="team-password">ACCESS CODE</label>
              <div className="input-with-icon">
                <KeyRound className="input-icon" size={18} />
                <input
                  id="team-password"
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
              <div className="tactical-alert" role="alert" aria-live="polite">
                <ShieldAlert
                  size={18}
                  className="alert-icon alert-icon-fixed"
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
