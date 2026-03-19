import React, { useState, useEffect } from "react";
import AdminService from "../services/AdminService";
import { Settings, Save, AlertTriangle, AlertOctagon, RefreshCw, Trash2, ShieldAlert, CheckCircle2 } from "lucide-react";
import "./ContestConfig.css";

interface Competition {
  competitionName: string;
  startTime: string;
  endTime: string;
  duration: number;
  isActive: boolean;
  maxTeams: number;
}

const ContestConfig: React.FC = () => {
  const [config, setConfig] = useState<Competition | null>(null);
  const [formData, setFormData] = useState({
    competitionName: "Query Quest - PROCOM 2026",
    startTime: "",
    duration: 30,
    isActive: true,
    maxTeams: 100,
  });
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await AdminService.getCompetition();
      if (data) {
        setConfig(data);
        setFormData({
          competitionName: data.competitionName,
          startTime: new Date(data.startTime).toISOString().slice(0, 16),
          duration: data.duration / (60 * 1000),
          isActive: data.isActive,
          maxTeams: data.maxTeams,
        });
      }
    } catch (error) {
      console.error("Failed to load config:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsLoading(true);

    try {
      await AdminService.createCompetition({
        competitionName: formData.competitionName,
        startTime: new Date(formData.startTime).toISOString(),
        duration: formData.duration * 60 * 1000,
        isActive: formData.isActive,
        maxTeams: formData.maxTeams,
      });

      setMessage({
        type: "success",
        text: "OP PARAMETERS SECURED AND ACTIVATED!",
      });
      await loadConfig();
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.response?.data?.error || "PARAMETER UPLOAD FAILED",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await AdminService.deleteCompetition();
      setMessage({ type: "success", text: "CONFIG WIPED FROM MAINFRAME" });
      setConfig(null);
      setShowDeleteConfirm(false);
    } catch (error: any) {
      setMessage({ type: "error", text: "UNABLE TO WIPE CONFIG" });
    }
  };

  const handleReset = async () => {
    try {
      const result = await AdminService.resetCompetition();
      setMessage({
        type: "success",
        text: `HARD RESET COMPLETE: ERADICATED ${result.deletedProgress} TRACES & ${result.deletedSubmissions} PACKETS.`,
      });
      setShowResetConfirm(false);
    } catch (error: any) {
      setMessage({ type: "error", text: "RESET OVERRIDE FAILED" });
    }
  };

  return (
    <div className="contest-config-page max-w-5xl mx-auto animate-fade-slide-up pb-12">
      <div className="page-header border-b border-warning/30 pb-6 mb-8 relative">
        <h1 className="font-orbitron tracking-widest text-warning glow-text-warning text-3xl m-0 flex items-center gap-3">
          <Settings size={32} /> OPERATION PARAMETERS
        </h1>
        <p className="font-mono text-secondary tracking-widest mt-2 m-0 uppercase">
          Configure mission timeline, parameters, and global settings
        </p>
      </div>

      {config && (
        <div className="current-config-banner bg-warning/5 border border-warning/30 p-4 mb-8 flex items-start gap-4 animate-fade-slide-up rounded-sm shadow-[inset_0_0_20px_rgba(250, 204, 21,0.05)]">
          <div className="banner-icon mt-1 text-warning glow-text-warning">
            <ShieldAlert size={24} />
          </div>
          <div className="flex-1 font-mono">
            <div className="text-warning tracking-widest mb-1 flex items-center gap-3">
              <strong>ACTIVE UPLINK:</strong> 
              <span className="text-white bg-warning/20 px-2 py-0.5 border border-warning/50">{config.competitionName}</span>
            </div>
            <div className="text-secondary text-sm flex flex-wrap gap-x-6 gap-y-2 mt-2">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-warning rounded-full"></span> START: <span className="text-white">{new Date(config.startTime).toLocaleString()}</span></span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-warning rounded-full"></span> WINDOW: <span className="text-white">{config.duration / (60 * 1000)} MIN</span></span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-warning rounded-full"></span> CAP: <span className="text-white">{config.maxTeams} AGENTS</span></span>
            </div>
          </div>
        </div>
      )}

      <div className="config-form-card glass-panel corner-bracket border-warning/30 p-6 md:p-8 mb-12 relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-warning/50 to-transparent"></div>
        <form onSubmit={handleSubmit} className="config-form flex flex-col gap-6">
          
          <div className="form-group flex flex-col gap-2">
            <label htmlFor="competitionName" className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> MISSION DESIGNATION
            </label>
            <input
              id="competitionName"
              type="text"
              value={formData.competitionName}
              onChange={(e) => setFormData({ ...formData, competitionName: e.target.value })}
              placeholder="ENTER DESIGNATION"
              required
              className="w-full bg-black/60 border border-primary/30 p-3 text-white font-mono uppercase tracking-wider focus:border-warning/60 focus:outline-none focus:shadow-[0_0_15px_rgba(250, 204, 21,0.2)] transition-all placeholder:text-secondary/30"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="form-group flex flex-col gap-2">
              <label htmlFor="startTime" className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> LAUNCH SEQUENCE
              </label>
              <input
                id="startTime"
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                required
                className="w-full bg-black/60 border border-primary/30 p-3 text-white font-mono focus:border-warning/60 focus:outline-none focus:shadow-[0_0_15px_rgba(250, 204, 21,0.2)] transition-all"
              />
            </div>

            <div className="form-group flex flex-col gap-2">
              <label htmlFor="duration" className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> TIME WINDOW (MIN)
              </label>
              <input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                min="1"
                max="300"
                required
                className="w-full bg-black/60 border border-primary/30 p-3 text-white font-mono focus:border-warning/60 focus:outline-none focus:shadow-[0_0_15px_rgba(250, 204, 21,0.2)] transition-all"
              />
            </div>

            <div className="form-group flex flex-col gap-2">
              <label htmlFor="maxTeams" className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-primary rounded-full"></span> AGENT CAPACITY
              </label>
              <input
                id="maxTeams"
                type="number"
                value={formData.maxTeams}
                onChange={(e) => setFormData({ ...formData, maxTeams: parseInt(e.target.value) })}
                min="1"
                max="1000"
                required
                className="w-full bg-black/60 border border-primary/30 p-3 text-white font-mono focus:border-warning/60 focus:outline-none focus:shadow-[0_0_15px_rgba(250, 204, 21,0.2)] transition-all"
              />
            </div>
          </div>

          <div className="form-group border border-primary/20 bg-black/40 p-4 mt-2">
            <label className="flex items-center gap-4 cursor-pointer">
              <div className="relative flex items-center user-select-none">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-secondary/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-warning/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warning shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]"></div>
              </div>
              <span className={`font-orbitron tracking-widest text-sm ${formData.isActive ? 'text-warning glow-text-warning' : 'text-secondary'}`}>
                SYSTEM ACTIVE FLAG
              </span>
            </label>
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

          <div className="flex justify-end mt-4 pt-6 border-t border-primary/30">
            <button 
              type="submit" 
              disabled={isLoading} 
              className="tactical-btn flex items-center gap-2 px-8 py-3 bg-warning/10 border-warning text-warning hover:bg-warning/20 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              <Save size={18} />
              {isLoading ? "UPLOADING..." : config ? "UPDATE PARAMETERS" : "INITIALIZE CONFIG"}
            </button>
          </div>
        </form>
      </div>

      <div className="danger-zone border-2 border-danger/50 bg-danger/5 p-6 md:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-danger/10 -rotate-45 translate-x-16 -translate-y-16 blur-2xl pointer-events-none"></div>
        <h2 className="font-orbitron tracking-widest text-danger flex items-center gap-3 m-0 mb-6 pb-4 border-b border-danger/30 text-xl">
          <AlertOctagon size={24} className="animate-pulse" /> RESTRICTED SECTOR
        </h2>

        <div className="flex flex-col gap-6">
          <div className="danger-action flex flex-col md:flex-row md:items-center justify-between gap-6 border border-danger/20 bg-black/40 p-5 p-6 hover:border-danger/50 transition-colors">
            <div className="flex-1">
              <h3 className="font-orbitron text-white text-base tracking-widest mb-2 m-0 mt-0">HARD RESET</h3>
              <p className="font-mono text-secondary text-sm m-0">Eradicate all operative progress and intel submissions. Restarts mission from zero state.</p>
            </div>
            <button
              onClick={() => setShowResetConfirm(true)}
              className="tactical-btn whitespace-nowrap px-6 py-2 bg-danger/10 border-danger text-danger hover:bg-danger/20 shadow-[0_0_10px_rgba(255, 107, 107,0.2)] hover:shadow-[0_0_15px_rgba(255, 107, 107,0.4)] flex items-center gap-2 text-sm"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              <RefreshCw size={14} /> INITIATE RESET
            </button>
          </div>

          <div className="danger-action flex flex-col md:flex-row md:items-center justify-between gap-6 border border-danger/20 bg-black/40 p-5 p-6 hover:border-danger/50 transition-colors">
            <div className="flex-1">
              <h3 className="font-orbitron text-white text-base tracking-widest mb-2 m-0 mt-0">WIPE CONFIGURATION</h3>
              <p className="font-mono text-secondary text-sm m-0">Permanently delete mission parameters. Cannot be reversed. Disables active uplinks.</p>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="tactical-btn whitespace-nowrap px-6 py-2 bg-danger/20 border-danger text-white hover:bg-danger hover:text-white shadow-[0_0_10px_rgba(255, 107, 107,0.3)] hover:shadow-[0_0_20px_rgba(255, 107, 107,0.6)] flex items-center gap-2 text-sm"
              style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
            >
              <Trash2 size={14} /> WIPE NOW
            </button>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="modal-overlay inset-0 bg-black/80 backdrop-blur-md fixed z-[100] flex items-center justify-center p-4">
          <div className="modal-content glass-panel corner-bracket border-warning/50 max-w-md w-full p-6 animate-fade-slide-up relative bg-[#0a0505]">
            <h3 className="font-orbitron text-warning text-xl tracking-widest flex items-center gap-3 mb-4 m-0">
              <AlertTriangle size={24} className="text-warning animate-pulse" /> VERIFY HARD RESET
            </h3>
            <p className="font-mono text-secondary mb-8">
              This action will systematically <strong className="text-warning">ERADICATE ALL INTEL</strong> submitted by agents. Proceed?
            </p>
            <div className="modal-actions flex justify-end gap-4 border-t border-warning/30 pt-4">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="font-orbitron text-sm tracking-widest text-secondary hover:text-white px-4 py-2 transition-colors"
              >
                ABORT
              </button>
              <button 
                onClick={handleReset} 
                className="tactical-btn text-warning border-warning bg-warning/10 hover:bg-warning/20 px-6"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                PROCEED
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="modal-overlay inset-0 bg-black/80 backdrop-blur-md fixed z-[100] flex items-center justify-center p-4">
          <div className="modal-content glass-panel corner-bracket border-danger max-w-md w-full p-6 animate-fade-slide-up relative bg-[#0a0505]" style={{ animation: 'pulseGlow 2s infinite' }}>
            <h3 className="font-orbitron text-danger text-xl tracking-widest flex items-center gap-3 mb-4 m-0">
              <AlertOctagon size={24} className="text-danger animate-pulse" /> WIPE CONFIGURATION
            </h3>
            <p className="font-mono text-secondary mb-8">
              This will permanently <strong className="text-danger">DELETE O.P. PARAMETERS</strong>. Action cannot be undone.
            </p>
            <div className="modal-actions flex justify-end gap-4 border-t border-danger/30 pt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="font-orbitron text-sm tracking-widest text-secondary hover:text-white px-4 py-2 transition-colors"
              >
                ABORT
              </button>
              <button 
                onClick={handleDelete} 
                className="tactical-btn text-white border-danger bg-danger hover:bg-danger/80 px-6 shadow-[0_0_15px_rgba(255, 107, 107,0.5)]"
                style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
              >
                PURGE NOW
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContestConfig;
