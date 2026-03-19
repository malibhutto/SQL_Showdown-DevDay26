import type { ExpectedOutput } from '../types';
import { CheckCircle2, XCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import './ResultComparison.css';

interface ParsedOutput {
  columns: string[];
  rows: (string | number | null)[][];
}

interface ResultComparisonProps {
  userResult: ParsedOutput | null;
  expectedResult: ExpectedOutput | null;
  executionTime?: number;
  error?: string;
  verdict?: 'Accepted' | 'Wrong Answer' | 'Runtime Error' | null;
}

export function ResultComparison({ 
  userResult, 
  expectedResult, 
  executionTime, 
  error,
  verdict 
}: ResultComparisonProps) {
  
  const getVerdictClass = (v: string | undefined | null) => {
    if (!v) return '';
    if (v === 'Accepted') return 'verdict-accepted';
    if (v === 'Wrong Answer') return 'verdict-wrong';
    return 'verdict-error';
  };

  const getVerdictIcon = (v: string | undefined | null) => {
    if (!v) return null;
    if (v === 'Accepted') return <CheckCircle2 size={24} className="text-success" />;
    if (v === 'Wrong Answer') return <XCircle size={24} className="text-warning" />;
    return <AlertTriangle size={24} className="text-danger" />;
  };

  const getDisplayVerdict = (v: string | undefined | null) => {
    if (!v) return null;
    if (v === 'Accepted') return 'VERIFIED: INTEL MATCH';
    if (v === 'Wrong Answer') return 'REJECTED: INTEL MISMATCH';
    return 'SYSTEM FAULT: EXECUTION ERROR';
  };

  const renderTable = (data: ParsedOutput | ExpectedOutput | null, title: string) => {
    if (!data) {
      return (
        <div className="result-panel flex-1">
          <h4 className="font-orbitron text-sm tracking-widest text-secondary flex items-center gap-2 mb-3">
            <ChevronRight size={14} /> {title}
          </h4>
          <div className="no-result font-mono text-secondary/50 p-6 text-center border border-dashed border-secondary/30 rounded">
            NO DATA DETECTED
          </div>
        </div>
      );
    }

    const columns = ('columns' in data ? data.columns : data.columns) || [];
    const rows = data.rows || [];

    return (
      <div className="result-panel flex-1 min-w-0">
        <h4 className="font-orbitron text-sm tracking-widest text-primary flex items-center gap-2 mb-3">
          <ChevronRight size={14} /> {title}
        </h4>
        <div className="terminal-table-container">
          <div className="table-wrapper">
            <table className="tactical-table font-mono text-sm w-full text-left border-collapse">
              <thead>
                <tr className="bg-primary/10 text-primary border-b border-primary/30">
                  {columns.map((col, i) => (
                    <th key={i} className="p-2 font-normal whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((row, i) => (
                  <tr key={i} className="border-b border-primary/5 hover:bg-primary/5 transition-colors">
                    {Array.isArray(row) ? row.map((cell, j) => (
                      <td key={j} className="p-2 text-text-secondary whitespace-nowrap truncate max-w-[200px]" title={String(cell)}>{String(cell)}</td>
                    )) : (
                      <td className="p-2 text-text-secondary">{String(row)}</td>
                    )}
                  </tr>
                ))}
                {rows.length > 10 && (
                  <tr className="more-rows bg-black/40">
                    <td colSpan={columns.length} className="p-2 text-center text-secondary/70 italic text-xs">
                      ... {rows.length - 10} ADDITIONAL RECORDS IN STREAM
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="result-info mt-2 flex justify-end">
          <span className="font-mono text-xs text-primary/70 tracking-widest">
            {rows.length} RECORD(S) SCANNED
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`result-comparison flex flex-col gap-6 ${getVerdictClass(verdict)}`}>
      <div className="result-header flex items-center justify-between border-b border-primary/20 pb-4">
        {verdict && (
          <div className={`verdict-badge flex items-center gap-3 font-orbitron tracking-widest text-lg ${
            verdict === 'Accepted' ? 'text-success text-shadow-glow' :
            verdict === 'Wrong Answer' ? 'text-warning glow-text-warning' : 'text-danger glow-text-danger'
          }`}>
            {getVerdictIcon(verdict)}
            {getDisplayVerdict(verdict)}
          </div>
        )}
        
        {executionTime !== undefined && (
          <div className="execution-info font-mono text-sm text-secondary flex items-center gap-2">
            <span className="opacity-50">PROCESSED IN</span> 
            <span className="text-primary">{executionTime}MS</span>
          </div>
        )}
      </div>

      {error && verdict !== 'Accepted' && (
        <div className="tactical-alert error-message font-mono text-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-danger flex-shrink-0 mt-0.5" size={18} />
            <div className="break-words whitespace-pre-wrap">{error}</div>
          </div>
        </div>
      )}

      <div className="comparison-container flex flex-col lg:flex-row gap-6">
        {renderTable(userResult, 'AGENT OUTPUT')}
        {renderTable(expectedResult, 'TARGET INTELLIGENCE')}
      </div>
    </div>
  );
}
