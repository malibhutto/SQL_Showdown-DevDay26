import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import AdminService from "../services/AdminService";
import { 
  LayoutDashboard, 
  UserPlus, 
  Users, 
  Trophy, 
  Settings, 
  Database, 
  LogOut,
  ShieldAlert
} from "lucide-react";
import "./AdminDashboard.css";

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isVerifying, setIsVerifying] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Auto-hide sidebar on leaderboard page
  const isLeaderboardPage = location.pathname === "/admin/leaderboard";

  useEffect(() => {
    if (isLeaderboardPage) {
      setIsSidebarOpen(false);
    }
  }, [isLeaderboardPage]);

  useEffect(() => {
    verifyAccess();
    loadStats();

    // Auto-refresh stats every 5 seconds
    const interval = setInterval(loadStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const verifyAccess = async () => {
    const isValid = await AdminService.verifyAdminAccess();
    if (!isValid) {
      navigate("/admin/login");
    }
    setIsVerifying(false);
  };

  const loadStats = async () => {
    try {
      const statistics = await AdminService.getStatistics();
      setStats(statistics);
    } catch (error) {
      console.error("Failed to load stats:", error);
    }
  };

  const handleLogout = () => {
    AdminService.clearAdminKey();
    navigate("/admin/login");
  };

  if (isVerifying) {
    return (
      <div className="admin-loading-screen animate-pulse-glow" style={{ color: 'var(--warning)', borderColor: 'var(--warning)' }}>
        <ShieldAlert size={64} className="mb-4" />
        <p className="font-orbitron tracking-widest text-xl">VERIFYING CLEARANCE...</p>
      </div>
    );
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="admin-dashboard bg-[#050b14]">
      {/* Background Effects specifically for Admin */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-10" 
           style={{ background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, var(--warning) 2px, var(--warning) 4px)', backgroundSize: '100% 4px' }}>
      </div>

      {/* Hamburger Button - Only on Leaderboard */}
      {isLeaderboardPage && (
        <button
          className="admin-hamburger hover:bg-warning/20 transition-colors"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle sidebar"
        >
          <div className="w-6 h-0.5 bg-warning mb-1.5 shadow-[0_0_8px_var(--warning)]"></div>
          <div className="w-6 h-0.5 bg-warning mb-1.5 shadow-[0_0_8px_var(--warning)]"></div>
          <div className="w-6 h-0.5 bg-warning shadow-[0_0_8px_var(--warning)]"></div>
        </button>
      )}

      <aside
        className={`admin-sidebar glass-panel border-warning/30 border-r ${!isSidebarOpen ? "sidebar-hidden" : ""}`}
      >
        <div className="admin-sidebar-header border-b border-warning/30 pb-6 mb-6">
          <h1 className="font-orbitron text-warning text-xl tracking-widest flex items-center gap-3 glow-text-warning m-0">
            <ShieldAlert size={24} /> COMMAND
          </h1>
          <p className="font-mono text-warning/70 text-xs mt-2 tracking-widest">SYSTEM OVERRIDE ACTIVE</p>
        </div>

        <nav className="admin-nav flex flex-col gap-2">
          <Link
            to="/admin/dashboard"
            className={`admin-nav-item ${isActive("/admin/dashboard") ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>OVERVIEW</span>
          </Link>

          <Link
            to="/admin/register-team"
            className={`admin-nav-item ${isActive("/admin/register-team") ? "active" : ""}`}
          >
            <UserPlus size={18} />
            <span>AUTHORIZE AGENT</span>
          </Link>

          <Link
            to="/admin/teams"
            className={`admin-nav-item ${isActive("/admin/teams") ? "active" : ""}`}
          >
            <Users size={18} />
            <span>ACTIVE ROSTER</span>
          </Link>

          <Link
            to="/admin/leaderboard"
            className={`admin-nav-item ${isActive("/admin/leaderboard") ? "active" : ""}`}
          >
            <Trophy size={18} />
            <span>LIVE INTEL</span>
          </Link>

          <Link
            to="/admin/contest"
            className={`admin-nav-item ${isActive("/admin/contest") ? "active" : ""}`}
          >
            <Settings size={18} />
            <span>OP PARAMETERS</span>
          </Link>

          <Link
            to="/admin/questions"
            className={`admin-nav-item ${isActive("/admin/questions") ? "active" : ""}`}
          >
            <Database size={18} />
            <span>MISSION DATABASE</span>
          </Link>
        </nav>

        <div className="flex-1"></div>

        {stats && (
          <div className="admin-quick-stats glass-panel border border-warning/20 bg-black/40 p-4 rounded mb-6">
            <h3 className="font-orbitron text-warning text-xs tracking-widest mb-4 border-b border-warning/30 pb-2">SYSTEM STATUS</h3>
            <div className="flex flex-col gap-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-warning/70">AGENTS</span>
                <span className="text-warning font-bold">{stats.registeredTeams}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warning/70">ACTIVE UPLINKS</span>
                <span className="text-warning font-bold">{stats.activeParticipants}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warning/70">PACKETS INC</span>
                <span className="text-warning font-bold">{stats.totalSubmissions}</span>
              </div>
            </div>
          </div>
        )}

        <button onClick={handleLogout} className="admin-logout-btn">
          <LogOut size={18} />
          <span>TERMINATE LINK</span>
        </button>
      </aside>

      <main
        className={`admin-main-content relative z-10 ${!isSidebarOpen ? "content-expanded" : ""}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default AdminDashboard;
