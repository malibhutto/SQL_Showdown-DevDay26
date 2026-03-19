import React, { useState, useEffect } from "react";
import AdminService from "../services/AdminService";
import { Users, Search, RefreshCw, Activity, ShieldCheck, Database, Calendar } from "lucide-react";
import "./AllTeams.css";

interface Team {
  teamName: string;
  isActive: boolean;
  lastLogin: string;
  createdAt: string;
  hasProgress: boolean;
  totalPoints: number;
  questionsSolved: number;
  totalSubmissions: number;
}

const AllTeams: React.FC = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "points" | "date">("points");

  useEffect(() => {
    loadTeams();

    // Auto-refresh every 10 seconds
    const interval = setInterval(loadTeams, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadTeams = async () => {
    try {
      const data = await AdminService.getAllTeams();
      setTeams(data);
    } catch (error) {
      console.error("Failed to load teams:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeams = teams
    .filter((team) =>
      team.teamName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.teamName.localeCompare(b.teamName);
        case "points":
          return b.totalPoints - a.totalPoints;
        case "date":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        default:
          return 0;
      }
    });

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if(isNaN(d.getTime())) return "NO DATA";
    return d.toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-warning">
        <div className="admin-spinner w-12 h-12 border-2 border-warning/20 border-t-warning rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(250, 204, 21,0.3)]"></div>
        <p className="font-orbitron tracking-widest animate-pulse">SCANNING DATABASE...</p>
      </div>
    );
  }

  return (
    <div className="all-teams-page max-w-7xl mx-auto animate-fade-slide-up">
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between border-b border-warning/30 pb-6 mb-8 relative gap-4">
        <div>
          <h1 className="font-orbitron text-3xl text-warning tracking-widest glow-text-warning mb-2 m-0 flex items-center gap-3">
            <Users size={32} /> AGENT ROSTER
          </h1>
          <p className="font-mono text-secondary tracking-widest m-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_var(--success)]"></span>
            {teams.length} OPERATIVES DETECTED
          </p>
        </div>
        <button onClick={loadTeams} className="tactical-btn text-warning border-warning/50 hover:bg-warning/20 flex items-center gap-2 font-mono text-sm tracking-widest">
          <RefreshCw size={16} /> REFRESH SCAN
        </button>
      </div>

      <div className="teams-controls flex flex-col md:flex-row gap-4 mb-8 glass-panel border-warning/20 p-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
          <input
            type="text"
            placeholder="SEARCH CALLSIGN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-primary/30 text-white font-mono placeholder:text-secondary/50 p-2 pl-10 focus:border-warning/60 focus:outline-none focus:shadow-[0_0_10px_rgba(250, 204, 21,0.2)] transition-all"
          />
        </div>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          className="bg-black/60 border border-primary/30 text-primary font-mono p-2 focus:border-warning/60 focus:outline-none focus:shadow-[0_0_10px_rgba(250, 204, 21,0.2)] transition-all min-w-[200px]"
        >
          <option value="points">SORT BY: INTEL SCORE</option>
          <option value="name">SORT BY: CALLSIGN (A-Z)</option>
          <option value="date">SORT BY: REGISTRATION</option>
        </select>
      </div>

      <div className="teams-grid grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTeams.map((team) => (
          <div key={team.teamName} className="team-card glass-panel corner-bracket border-primary/20 hover:border-warning/50 transition-colors p-5 relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-16 h-16 ${team.isActive ? 'bg-success/5' : 'bg-secondary/5'} -rotate-45 translate-x-8 -translate-y-8 blur-xl transition-colors`}></div>
            
            <div className="team-card-header flex justify-between items-start border-b border-primary/20 pb-4 mb-4">
              <h3 className="font-mono text-xl text-white font-bold tracking-wider m-0 group-hover:text-warning transition-colors break-all">{team.teamName}</h3>
              <span
                className={`flex items-center gap-1.5 font-mono text-xs tracking-widest px-2 py-0.5 border ${
                  team.isActive 
                    ? "border-success/50 text-success bg-success/10 shadow-[0_0_10px_rgba(0,255,136,0.1)]" 
                    : "border-secondary/30 text-secondary bg-black/50"
                }`}
              >
                {team.isActive ? <Activity size={12} className="animate-pulse" /> : <div className="w-1.5 h-1.5 bg-secondary rounded-full"></div>}
                {team.isActive ? "ONLINE" : "OFFLINE"}
              </span>
            </div>

            <div className="team-stats grid grid-cols-3 gap-2 mb-4 bg-black/40 p-3 border border-primary/10 rounded-sm">
              <div className="stat flex flex-col items-center">
                <span className="font-orbitron text-[10px] text-secondary tracking-widest mb-1">SCORE</span>
                <span className="font-mono text-xl text-warning font-bold glow-text-warning">{team.totalPoints}</span>
              </div>
              <div className="stat flex flex-col items-center border-x border-primary/20">
                <span className="font-orbitron text-[10px] text-secondary tracking-widest mb-1">OBJ</span>
                <span className="font-mono text-xl text-white font-bold">{team.questionsSolved}</span>
              </div>
              <div className="stat flex flex-col items-center">
                <span className="font-orbitron text-[10px] text-secondary tracking-widest mb-1">PACKETS</span>
                <span className="font-mono text-xl text-white font-bold">{team.totalSubmissions}</span>
              </div>
            </div>

            <div className="team-info flex flex-col gap-2 font-mono text-xs">
              <div className="info-row flex items-center justify-between border-b border-white/5 pb-1">
                <span className="text-secondary/60 flex items-center gap-2"><Calendar size={12} /> AUTH DATE</span>
                <span className="text-text-primary text-right">{formatDate(team.createdAt)}</span>
              </div>
              {team.lastLogin && (
                <div className="info-row flex items-center justify-between border-b border-white/5 pb-1">
                  <span className="text-secondary/60 flex items-center gap-2"><Activity size={12} /> LAST PING</span>
                  <span className="text-text-primary text-right">
                    {formatDate(team.lastLogin)}
                  </span>
                </div>
              )}
              <div className="info-row flex items-center justify-between">
                <span className="text-secondary/60 flex items-center gap-2"><ShieldCheck size={12} /> PROGR. STATUS</span>
                <span className={team.hasProgress ? "text-success" : "text-yellow-600"}>
                  {team.hasProgress ? "✓ INFILTRATING" : "⚠ NO ACTION"}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTeams.length === 0 && (
        <div className="no-teams text-center p-12 glass-panel border-primary/20 flex flex-col items-center gap-4 mt-8">
          <Database size={48} className="text-secondary opacity-30" />
          <p className="font-orbitron tracking-widest text-secondary">NO AGENT MATCHES DATABANK PARAMETERS</p>
        </div>
      )}
    </div>
  );
};

export default AllTeams;
