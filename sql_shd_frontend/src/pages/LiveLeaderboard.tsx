import React, { useState, useEffect } from "react";
import AdminService from "../services/AdminService";
import { Trophy, Activity, Crosshair, Target, ShieldAlert } from "lucide-react";
import "./LiveLeaderboard.css";

interface LeaderboardEntry {
  rank: number;
  teamName: string;
  totalPoints: number;
  questionsSolved: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  lastActivityAt: string;
}

const LiveLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();

    // Auto-refresh every 10 seconds for real-time updates
    const interval = setInterval(() => {
      loadLeaderboard();
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const loadLeaderboard = async () => {
    try {
      const data = await AdminService.getResults("desc");
      setLeaderboard(data);
    } catch (error) {
      console.error("Failed to load leaderboard:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return "gold";
    if (rank === 2) return "silver";
    if (rank === 3) return "bronze";
    return "default";
  };

  const formatTime = (dateString: string) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "NO COMMS";
    return d.toLocaleTimeString([], { hour12: false }) + '.' + String(d.getMilliseconds()).padStart(3, '0');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[60vh] text-primary">
        <Target size={64} className="mb-6 animate-radar-sweep text-warning" style={{ filter: 'drop-shadow(0 0 20px rgba(250, 204, 21, 0.5))' }} />
        <h2 className="font-orbitron tracking-widest text-warning glow-text-warning animate-pulse">TRIANGULATING SIGNALS...</h2>
      </div>
    );
  }

  return (
    <div className="live-leaderboard-page animate-fade-slide-up h-full flex flex-col pt-8 lg:pt-0">
      <div className="page-header flex justify-between items-end border-b border-warning/30 pb-6 mb-8 relative">
        <div className="absolute top-0 right-0 p-2 bg-warning/10 border border-warning/30 rounded text-warning flex items-center gap-2 font-mono text-xs shadow-[0_0_10px_rgba(250, 204, 21,0.2)]">
          <span className="w-2 h-2 bg-danger rounded-full animate-pulse shadow-[0_0_8px_var(--danger)]"></span>
          LIVE FEED | {new Date().toLocaleTimeString([], { hour12: false })}
        </div>
        
        <div className="header-content mt-8 lg:mt-0">
          <h1 className="font-orbitron font-bold tracking-widest text-4xl m-0 flex items-center gap-4 text-warning glow-text-warning">
            <Trophy size={40} className="text-warning" /> LIVE INTELLIGENCE REPORT
          </h1>
          <p className="font-mono text-secondary tracking-widest mt-2 uppercase">Global Agent Rankings & Mission Status</p>
        </div>
      </div>

      <div className="leaderboard-container flex-1 overflow-hidden flex flex-col">
        <div className="leaderboard-table terminal-table-container flex-1 flex flex-col border-warning/30 !border-l-[4px] !border-l-warning">
          <div className="table-header flex bg-warning/15 border-b-2 border-warning/40 items-center px-4 py-3 font-orbitron tracking-widest text-sm text-warning/80">
            <div className="col-rank w-24 text-center">RANK</div>
            <div className="col-team flex-1">AGENT CALLSIGN</div>
            <div className="col-points w-32 text-right">INTEL POINTS</div>
            <div className="col-solved w-32 text-center">OBJ SECURED</div>
            <div className="col-activity w-48 text-right hidden md:block">LAST PING</div>
          </div>

          <div className="table-body flex-1 overflow-y-auto custom-scrollbar">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center font-mono text-secondary/60 flex flex-col items-center gap-4">
                <ShieldAlert size={48} className="opacity-50" />
                <p>NO OPERATIVE SIGNALS DETECTED IN SECTOR</p>
              </div>
            ) : (
              leaderboard.map((entry, idx) => (
                <div
                  key={entry.teamName}
                  className={`leaderboard-row flex items-center px-4 py-2.5 border-b border-warning/10 transition-colors hover:bg-warning/5 bg-black/40
                    ${entry.rank <= 3 ? `rank-${getRankBadgeClass(entry.rank)}` : ''} 
                  `}
                  style={{
                    animationDelay: `${idx * 0.05}s`,
                    animation: 'fadeSlideUp 0.5s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <div className="col-rank w-24 flex justify-center">
                    <span
                      className={`rank-badge font-orbitron text-lg font-bold w-10 h-10 flex items-center justify-center rounded-sm border 
                        ${entry.rank === 1 ? 'border-gold text-gold bg-gold/10 shadow-[0_0_15px_rgba(255,215,0,0.3)]' :
                          entry.rank === 2 ? 'border-silver text-silver bg-silver/10 shadow-[0_0_15px_rgba(192,192,192,0.3)]' :
                          entry.rank === 3 ? 'border-bronze text-bronze bg-bronze/10 shadow-[0_0_15px_rgba(205,127,50,0.3)]' :
                          'border-warning/30 text-warning/70 bg-black/50'
                        }`}
                    >
                      {entry.rank <= 3 ? (
                        <>
                          <Crosshair size={18} className="absolute opacity-20" />
                          <span className="relative z-10">{entry.rank}</span>
                        </>
                      ) : (
                        `#${entry.rank}`
                      )}
                    </span>
                  </div>
                  <div className="col-team flex-1 pl-4">
                    <div className="font-mono text-lg font-bold tracking-wider m-0 text-white flex items-center gap-3">
                      {entry.teamName}
                      {entry.rank === 1 && <span className="text-[10px] text-black bg-gold px-2 py-0.5 rounded-sm font-orbitron tracking-widest animate-pulse">VIP TARGET</span>}
                    </div>
                    {/* Visual Progress bar approximation for submissions vs accepted */}
                    <div className="mt-2 h-1 w-48 bg-black border border-warning/20 rounded-full overflow-hidden flex" title={`${entry.acceptedSubmissions} Accepted / ${entry.totalSubmissions} Total`}>
                       <div className="bg-success h-full" style={{ width: `${entry.totalSubmissions > 0 ? (entry.acceptedSubmissions / entry.totalSubmissions) * 100 : 0}%` }}></div>
                       <div className="bg-danger/50 h-full" style={{ width: `${entry.totalSubmissions > 0 ? ((entry.totalSubmissions - entry.acceptedSubmissions) / entry.totalSubmissions) * 100 : 0}%` }}></div>
                    </div>
                  </div>
                  <div className="col-points w-32 text-right">
                    <span className={`points-value font-orbitron text-xl font-bold ${entry.rank <= 3 ? 'text-white' : 'text-warning'}`}>{entry.totalPoints}</span>
                  </div>
                  <div className="col-solved w-32 flex justify-center">
                    <span className="solved-badge font-mono text-sm border border-warning/40 text-warning px-3 py-1 bg-warning/10 shadow-[inset_0_0_10px_rgba(250, 204, 21,0.1)]">
                      {entry.questionsSolved} <span className="opacity-50 ml-1">OBJ</span>
                    </span>
                  </div>
                  <div className="col-activity w-48 text-right hidden md:block">
                    <span className="activity-time font-mono text-xs text-secondary flex items-center justify-end gap-2">
                      <Activity size={12} className={entry.rank === 1 ? 'text-gold' : 'text-warning/50'} />
                      {formatTime(entry.lastActivityAt)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveLeaderboard;
