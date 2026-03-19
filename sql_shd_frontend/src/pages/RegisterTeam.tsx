import React, { useState } from "react";
import AdminService from "../services/AdminService";
import { UserPlus, ShieldPlus, KeyRound, AlertTriangle, CheckCircle2 } from "lucide-react";
import "./RegisterTeam.css";

const RegisterTeam: React.FC = () => {
  const [teamName, setTeamName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    // Validation
    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "SECURITY REQUIREMENT: MINIMUM 6 CHARACTERS",
      });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "SECURITY MISMATCH: PASSWORDS DO NOT ALIGN" });
      return;
    }

    setIsLoading(true);

    try {
      await AdminService.registerTeam(teamName, password);
      setMessage({
        type: "success",
        text: `AGENT "${teamName}" AUTHORIZED SUCCESSFULLY`,
      });
      setTeamName("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "AUTHORIZATION PROTOCOL FAILED",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register-team-page max-w-4xl mx-auto animate-fade-slide-up">
      <div className="page-header border-b border-warning/30 pb-6 mb-8 relative">
        <h1 className="font-orbitron tracking-widest text-warning glow-text-warning text-3xl m-0 flex items-center gap-3">
          <UserPlus size={32} /> AUTHORIZE NEW AGENT
        </h1>
        <p className="font-mono text-secondary tracking-widest mt-2 m-0 uppercase">
          Enter operational credentials to clear an agent for mission deployment
        </p>
      </div>

      <div className="register-team-card glass-panel corner-bracket border-warning/30 p-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-warning/50 to-transparent"></div>
        <div className="absolute -right-20 -bottom-20 opacity-5">
          <ShieldPlus size={300} className="text-warning" />
        </div>

        <form onSubmit={handleSubmit} className="register-form flex flex-col gap-6 relative z-10">
          <div className="form-group flex flex-col gap-2">
            <label htmlFor="teamName" className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> AGENT CALLSIGN
            </label>
            <input
              id="teamName"
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="ENTER CALLSIGN DESIGNATION"
              required
              minLength={3}
              className="w-full bg-black/60 border border-primary/30 p-3 text-white font-mono uppercase tracking-wider focus:border-warning/60 focus:outline-none focus:shadow-[0_0_15px_rgba(250, 204, 21,0.2)] transition-all placeholder:text-secondary/30"
            />
            <small className="font-mono text-[10px] text-secondary/50 tracking-widest">MINIMUM 3 CHARACTERS REQUIRED</small>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-group flex flex-col gap-2">
              <label htmlFor="password" className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> SECURITY CLEARANCE KEY
              </label>
              <div className="relative">
                <KeyRound size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="ENTER SECURE KEY"
                  required
                  minLength={6}
                  className="w-full bg-black/60 border border-primary/30 p-3 pl-10 text-white font-mono focus:border-warning/60 focus:outline-none focus:shadow-[0_0_15px_rgba(250, 204, 21,0.2)] transition-all placeholder:text-secondary/30"
                />
              </div>
              <small className="font-mono text-[10px] text-secondary/50 tracking-widest">MINIMUM 6 CYPHERS REQUIRED</small>
            </div>

            <div className="form-group flex flex-col gap-2">
              <label htmlFor="confirmPassword" className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> VERIFY CLEARANCE KEY
              </label>
              <div className="relative">
                <CheckCircle2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/50" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="RE-ENTER SECURE KEY"
                  required
                  className="w-full bg-black/60 border border-primary/30 p-3 pl-10 text-white font-mono focus:border-warning/60 focus:outline-none focus:shadow-[0_0_15px_rgba(250, 204, 21,0.2)] transition-all placeholder:text-secondary/30"
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`message mt-2 p-3 font-mono text-sm tracking-wide border flex items-center gap-3 animate-fade-slide-up ${
              message.type === 'error' 
                ? 'bg-danger/10 border-danger/50 text-danger shadow-[0_0_15px_rgba(255, 107, 107,0.2)]' 
                : 'bg-success/10 border-success/50 text-success shadow-[0_0_15px_rgba(0,255,136,0.2)]'
            }`}>
              {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
              {message.text}
            </div>
          )}

          <div className="flex justify-end mt-4 pt-6 border-t border-primary/20">
            <button 
              type="submit" 
              disabled={isLoading} 
              className="tactical-btn flex items-center gap-2 px-8 py-3 bg-warning/10 border-warning text-warning hover:bg-warning/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              <ShieldPlus size={18} />
              {isLoading ? "AUTHORIZING..." : "GRANT AUTHORIZATION"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterTeam;
