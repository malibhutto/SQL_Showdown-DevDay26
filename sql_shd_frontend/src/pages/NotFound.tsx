import { AlertTriangle, Home, MonitorX } from 'lucide-react';
import './NotFound.css';

export function NotFound() {
  return (
    <div className="notfound-container flex items-center justify-center min-vh-100 bg-base overflow-hidden relative">
      <div className="absolute inset-0 bg-tactical pointer-events-none opacity-30"></div>
      
      <div className="notfound-content glass-panel corner-bracket border-danger/50 p-12 max-w-2xl w-full text-center relative z-10 animate-fade-slide-up bg-black/80">
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-sm mix-blend-screen opacity-10">
          <div className="absolute top-[20%] w-full h-[1px] bg-danger animate-scan-sweep"></div>
          <div className="absolute top-[60%] w-full h-[1px] bg-danger animate-scan-sweep" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="glitch-wrapper mb-8 relative inline-block">
          <h1 className="font-orbitron font-bold text-8xl m-0 text-danger" style={{ textShadow: '0 0 20px rgba(255,51,102,0.8)' }}>
            4<span className="animate-pulse">0</span>4
          </h1>
          <h1 className="font-orbitron font-bold text-8xl m-0 text-danger absolute top-0 left-[-2px] opacity-70 animate-data-drift" style={{ color: '#00d4ff', clipPath: 'polygon(0 0, 100% 0, 100% 45%, 0 45%)' }}>404</h1>
          <h1 className="font-orbitron font-bold text-8xl m-0 text-danger absolute top-0 left-[2px] opacity-70 animate-data-drift" style={{ animationDirection: 'reverse', animationDuration: '3s', color: '#00ff88', clipPath: 'polygon(0 55%, 100% 55%, 100% 100%, 0 100%)' }}>404</h1>
        </div>

        <div className="terminal-box bg-danger/5 border border-danger/30 p-6 mb-10 text-left font-mono relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-danger"></div>
          <AlertTriangle size={24} className="text-danger mb-4 animate-pulse shadow-[0_0_10px_rgba(255,51,102,0.5)]" />
          <p className="text-white text-lg tracking-widest mb-2 m-0 typing-effect">CRITICAL ERROR: SIGNAL_LOST</p>
          <p className="text-secondary/70 text-sm mb-4 m-0 uppercase tracking-wider">The requested sector parameters could not be resolved in the current operational matrix.</p>
          <div className="text-xs text-danger/80">
            &gt; TRACE ROUTE FAILED<br/>
            &gt; DESTINATION UNREACHABLE<br/>
            &gt; INITIATING FALLBACK PROTOCOLS...
          </div>
        </div>

        <a href="/login" className="tactical-btn inline-flex items-center gap-3 px-8 py-4 bg-danger/10 border-danger text-danger hover:bg-danger/20 hover:text-white transition-all font-mono tracking-widest text-lg shadow-[0_0_15px_rgba(255,51,102,0.3)] hover:shadow-[0_0_25px_rgba(255,51,102,0.6)]" style={{ clipPath: 'polygon(20px 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%, 0 20px)' }}>
          <Home size={20} /> RETURN TO BASE
        </a>
      </div>
      
      {/* Background visual clutter */}
      <div className="absolute top-10 left-10 font-mono text-xs text-danger/20 tracking-widest opacity-50 select-none">
        ERR_CODE_404 // SECTOR UNKNOWN
      </div>
      <div className="absolute bottom-10 right-10 flex flex-col items-end opacity-50 select-none">
        <MonitorX size={48} className="text-danger/20 animate-pulse mb-2" />
        <div className="font-mono text-xs text-danger/30">SYSTEM_HALT_DETECTED</div>
      </div>
    </div>
  );
}
