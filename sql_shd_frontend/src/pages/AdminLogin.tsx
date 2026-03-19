import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../contexts/AdminContext';
import { ShieldAlert, Shield } from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(password);
      if (success) {
        navigate('/admin/dashboard');
      } else {
        setError('Invalid admin clearance');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid admin clearance');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container admin-theme">
      <div className="data-stream-layer">
        <span className="data-stream" style={{left: '20%', animationDelay: '2s', color: 'rgba(250, 204, 21, 0.15)'}}>RESTRICTED</span>
        <span className="data-stream" style={{left: '50%', animationDelay: '5s', color: 'rgba(250, 204, 21, 0.15)'}}>SUDO SU</span>
        <span className="data-stream" style={{left: '80%', animationDelay: '1s', color: 'rgba(250, 204, 21, 0.15)'}}>OVERRIDE=TRUE</span>
      </div>

      <div className="login-card-split admin-glass corner-bracket">
        <div className="mission-briefing admin-briefing">
          <div className="classification-banner">
            <span className="glitch-text" style={{ fontFamily: 'Orbitron', fontSize: '0.7rem', color: 'var(--danger)', letterSpacing: '0.15em', textShadow: '0 0 10px rgba(255, 107, 107, 0.8)' }}>
              <Shield size={12} className="inline-block" style={{ verticalAlign: 'middle', marginRight: '6px', marginBottom: '2px', color: 'var(--warning)' }} />
              ⬛ TOP SECRET // COMMAND ACCESS
            </span>
          </div>
          
          <div className="mission-details admin-details">
            <h2>TERMINAL: <span>ADMINISTRATOR</span></h2>
            <h2>CLEARANCE: <span>LEVEL OMEGA</span></h2>
            <h2>STATUS: <span className="status-live" style={{ color: 'var(--warning)', textShadow: '0 0 8px rgba(250, 204, 21, 0.6)' }}>● ENCRYPTED</span></h2>
          </div>

          <p className="briefing-text">
            Unauthorized access to this terminal is strictly prohibited. Activity is logged and monitored by the DataVerse Security Grid.
          </p>

          <div className="system-status-indicators">
            <div className="led-indicator warning">Command Uplink</div>
            <div className="led-indicator warning">Security Grid</div>
          </div>
          <div className="corner-bracket-inner"></div>
        </div>

        <div className="login-form-side">
          <div className="login-header">
            <h1 className="neon-text-admin">COMMAND CENTER</h1>
            <p className="subheading">SQL SHOWDOWN // ADMIN AUTHENTICATION</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>OVERRIDE KEY</label>
              <div className="input-with-icon">
                <Shield className="input-icon admin-icon" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator passcode..."
                  required
                  disabled={isLoading}
                  className="tactical-input admin-input"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && <div className="tactical-alert admin-alert">
              <ShieldAlert size={18} className="alert-icon" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>}

            <button type="submit" disabled={isLoading} className="tactical-btn admin-btn login-btn">
              <Shield size={18} />
              {isLoading ? 'VERIFYING...' : 'ACCESS COMMAND CENTER'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
