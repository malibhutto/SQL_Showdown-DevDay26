import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AdminService from "../services/AdminService";
import { 
  ShieldAlert, 
  Users, 
  Activity, 
  Database, 
  Trophy, 
  UserPlus, 
  BarChart2, 
  Settings, 
  ListOrdered,
  Server,
  Zap
} from "lucide-react";
import "./AdminHome.css";

const AdminHome: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();

    // Auto-refresh every 15 seconds
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const data = await AdminService.getStatistics();
      setStats(data);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="admin-home-page flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center justify-center gap-4 text-warning">
          <div className="admin-spinner w-12 h-12 border-2 border-warning/20 border-t-warning rounded-full animate-spin shadow-[0_0_15px_rgba(250, 204, 21,0.3)]"></div>
          <p className="font-orbitron tracking-widest animate-pulse">ESTABLISHING UPLINK...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-home-page animate-fade-slide-up">
      <div className="page-header border-b border-warning/30 pb-6 mb-8 relative">
        <div className="absolute top-0 right-0 p-2 bg-warning/10 border border-warning/30 rounded text-warning flex items-center gap-2 font-mono text-xs shadow-[0_0_10px_rgba(250, 204, 21,0.2)]">
          <span className="w-2 h-2 bg-warning rounded-full animate-pulse"></span>
          LIVE SECURE FEED | {new Date().toLocaleTimeString()}
        </div>
        <h1 className="font-orbitron text-4xl text-warning tracking-widest glow-text-warning mb-2 m-0 flex items-center gap-4">
          <ShieldAlert size={36} /> COMMAND CENTER
        </h1>
        <p className="font-mono text-secondary tracking-widest">OPERATION CONTROL OVERVIEW</p>
      </div>

      <div className="stats-grid mb-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card glass-panel corner-bracket border-warning/30 hover:border-warning/60 transition-colors p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Users size={32} className="text-warning mb-4 glow-text-warning" />
          <h3 className="font-orbitron text-xs tracking-widest text-secondary mb-2 m-0">REGISTERED AGENTS</h3>
          <p className="font-mono text-4xl text-warning m-0 font-bold glow-text-warning">{stats?.registeredTeams || 0}</p>
        </div>

        <div className="stat-card glass-panel corner-bracket border-warning/30 hover:border-warning/60 transition-colors p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Activity size={32} className="text-warning mb-4 glow-text-warning" />
          <h3 className="font-orbitron text-xs tracking-widest text-secondary mb-2 m-0">ACTIVE UPLINKS</h3>
          <p className="font-mono text-4xl text-warning m-0 font-bold glow-text-warning">{stats?.activeParticipants || 0}</p>
        </div>

        <div className="stat-card glass-panel corner-bracket border-warning/30 hover:border-warning/60 transition-colors p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Database size={32} className="text-warning mb-4 glow-text-warning" />
          <h3 className="font-orbitron text-xs tracking-widest text-secondary mb-2 m-0">INTEL PACKETS RCVD</h3>
          <p className="font-mono text-4xl text-warning m-0 font-bold glow-text-warning">{stats?.totalSubmissions || 0}</p>
        </div>

        <div className="stat-card glass-panel corner-bracket border-warning/30 hover:border-warning/60 transition-colors p-6 flex flex-col items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-t from-warning/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <Trophy size={32} className="text-gold mb-4" style={{ filter: 'drop-shadow(0 0 8px rgba(255,215,0,0.5))' }} />
          <h3 className="font-orbitron text-xs tracking-widest text-secondary mb-2 m-0">LEADERBOARD SEATS</h3>
          <p className="font-mono text-4xl text-gold m-0 font-bold" style={{ textShadow: '0 0 10px rgba(255,215,0,0.5)' }}>{stats?.topTeams?.length || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        <div className="quick-actions glass-panel p-8 relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-warning/50 to-transparent"></div>
          <h2 className="font-orbitron text-xl text-primary tracking-widest mb-6 flex items-center gap-2">
            <Zap size={20} className="text-warning" /> QUICK DIRECTIVES
          </h2>
          
          <div className="actions-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link to="/admin/register-team" className="action-card bg-black/40 border border-primary/20 hover:border-warning/50 hover:bg-warning/5 transition-all p-4 rounded flex items-start gap-4 group">
              <div className="p-2 bg-primary/10 rounded group-hover:bg-warning/20 transition-colors"><UserPlus size={24} className="text-primary group-hover:text-warning transition-colors" /></div>
              <div>
                <h3 className="font-orbitron text-sm tracking-wider text-text-primary mb-1 group-hover:text-warning transition-colors">AUTHORIZE AGENT</h3>
                <p className="text-xs text-secondary m-0">Add a new operational team to the mission roster</p>
              </div>
            </Link>

            <Link to="/admin/leaderboard" className="action-card bg-black/40 border border-primary/20 hover:border-warning/50 hover:bg-warning/5 transition-all p-4 rounded flex items-start gap-4 group">
              <div className="p-2 bg-primary/10 rounded group-hover:bg-warning/20 transition-colors"><BarChart2 size={24} className="text-primary group-hover:text-warning transition-colors" /></div>
              <div>
                <h3 className="font-orbitron text-sm tracking-wider text-text-primary mb-1 group-hover:text-warning transition-colors">LIVE INTEL</h3>
                <p className="text-xs text-secondary m-0">Monitor live agent scores and rankings globally</p>
              </div>
            </Link>

            <Link to="/admin/contest" className="action-card bg-black/40 border border-primary/20 hover:border-warning/50 hover:bg-warning/5 transition-all p-4 rounded flex items-start gap-4 group">
              <div className="p-2 bg-primary/10 rounded group-hover:bg-warning/20 transition-colors"><Settings size={24} className="text-primary group-hover:text-warning transition-colors" /></div>
              <div>
                <h3 className="font-orbitron text-sm tracking-wider text-text-primary mb-1 group-hover:text-warning transition-colors">OP PARAMETERS</h3>
                <p className="text-xs text-secondary m-0">Configure primary mission clock and settings</p>
              </div>
            </Link>

            <Link to="/admin/questions" className="action-card bg-black/40 border border-primary/20 hover:border-warning/50 hover:bg-warning/5 transition-all p-4 rounded flex items-start gap-4 group">
              <div className="p-2 bg-primary/10 rounded group-hover:bg-warning/20 transition-colors"><ListOrdered size={24} className="text-primary group-hover:text-warning transition-colors" /></div>
              <div>
                <h3 className="font-orbitron text-sm tracking-wider text-text-primary mb-1 group-hover:text-warning transition-colors">MISSION DATABASE</h3>
                <p className="text-xs text-secondary m-0">Update, deploy, or remove mission objectives</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="flex flex-col gap-8">
          {stats?.topTeams && stats.topTeams.length > 0 && (
            <div className="top-teams-section glass-panel p-8 relative flex-1">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-warning/50 to-transparent"></div>
              <div className="section-header flex justify-between items-center border-b border-warning/30 pb-4 mb-6">
                <h2 className="font-orbitron text-xl text-primary tracking-widest m-0 flex items-center gap-2">
                  <Trophy size={20} className="text-warning" /> TOP OPERATIVES
                </h2>
                <Link to="/admin/leaderboard" className="view-all-link font-mono text-xs text-warning hover:text-white transition-colors uppercase tracking-widest border border-warning/30 px-3 py-1 rounded hover:bg-warning/20">
                  FULL ROSTER
                </Link>
              </div>
              
              <div className="top-teams-list flex flex-col gap-3">
                {stats.topTeams.slice(0, 5).map((team: any, index: number) => (
                  <div key={team.teamName} className="top-team-item bg-black/30 border border-primary/20 p-3 rounded flex items-center justify-between hover:bg-primary/5 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="team-rank font-orbitron text-xl text-warning w-8 text-center font-bold">#{index + 1}</div>
                      <div className="team-info">
                        <h4 className="font-mono text-white m-0 tracking-wider text-sm">{team.teamName}</h4>
                        <p className="text-xs text-secondary m-0">{team.solvedCount} OBJECTIVES CLEARED</p>
                      </div>
                    </div>
                    <div className="team-points font-orbitron text-primary font-bold">{team.totalPoints} PTS</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="system-info glass-panel p-6 border-warning/30 bg-warning/5 relative">
            <h2 className="font-orbitron tracking-widest text-warning text-sm border-b border-warning/20 pb-2 mb-4 flex items-center gap-2">
              <Server size={14} /> SYSTEM STATUS
            </h2>
            <div className="info-grid grid grid-cols-2 gap-4 font-mono text-sm">
              <div className="info-item flex flex-col gap-1">
                <span className="info-label text-warning/50 text-xs">NETWORK LINK</span>
                <span className="info-value text-accent-primary flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-accent-primary animate-pulse shadow-[0_0_5px_var(--accent-primary)]"></span> CONNECTED
                </span>
              </div>
              <div className="info-item flex flex-col gap-1">
                <span className="info-label text-warning/50 text-xs">MISSION STATUS</span>
                <span className="info-value status-active text-warning glow-text-warning">ACTIVE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHome;
