import type { Question } from "../types";
import { Target, Database } from "lucide-react";
import "./QuestionPanel.css";

interface QuestionPanelProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
  isSolved?: boolean;
}

export function QuestionPanel({
  question,
  questionNumber,
  totalQuestions,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious,
  isSolved = false,
}: QuestionPanelProps) {
  const getDifficultyClass = (difficulty: string) => {
    return `difficulty-${difficulty.toLowerCase()}`;
  };

  // Early return if no question
  if (!question || !question.title) {
    return (
      <div className="question-panel">
        <div
          className="loading-state"
          style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}
        >
          <p>Loading question...</p>
        </div>
      </div>
    );
  }

  // Parse setupSql to extract table structures for display
  const parseSetupSql = (
    setupSql: string,
  ): { name: string; columns: string[]; rows: (string | number)[][] }[] => {
    if (!setupSql || setupSql.trim() === "") {
      console.log("No setupSql provided");
      return [];
    }

    console.log("Parsing setupSql:", setupSql.substring(0, 200));

    const tables: {
      name: string;
      columns: string[];
      rows: (string | number)[][];
    }[] = [];
    const tableMap = new Map<
      string,
      { columns: string[]; rows: (string | number)[][] }
    >();

    // Extract CREATE TABLE statements
    const createTableRegex = /CREATE\s+TABLE\s+(\w+)\s*\(([\s\S]*?)\);/gi;
    let match;

    while ((match = createTableRegex.exec(setupSql)) !== null) {
      const tableName = match[1];
      const columnsStr = match[2];

      // Parse columns - each column definition is on its own line or comma-separated
      const columnDefs = columnsStr
        .split(",")
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      const columns: string[] = [];

      for (const colDef of columnDefs) {
        // Get the first word as column name, skip PRIMARY KEY, FOREIGN KEY constraints
        const words = colDef.trim().split(/\s+/);
        const firstWord = words[0]?.toUpperCase();
        if (
          firstWord &&
          !["PRIMARY", "FOREIGN", "UNIQUE", "CHECK", "CONSTRAINT"].includes(
            firstWord,
          )
        ) {
          columns.push(words[0]);
        }
      }

      console.log(`Found table ${tableName} with columns:`, columns);
      tableMap.set(tableName, { columns, rows: [] });
    }

    // Extract INSERT statements - handle multi-row inserts
    const insertRegex =
      /INSERT\s+INTO\s+(\w+)(?:\s*\([^)]*\))?\s*VALUES\s*([\s\S]*?);/gi;

    while ((match = insertRegex.exec(setupSql)) !== null) {
      const tableName = match[1];
      const valuesStr = match[2];

      const table = tableMap.get(tableName);
      if (table) {
        // Parse each row - handle nested parentheses for VALUES (row1), (row2), ...
        const rowMatches = valuesStr.matchAll(/\(([^)]+)\)/g);
        for (const rowMatch of rowMatches) {
          // Split by comma but handle quoted strings
          const rowStr = rowMatch[1];
          const values: (string | number)[] = [];
          let current = "";
          let inQuote = false;
          let quoteChar = "";

          for (let i = 0; i < rowStr.length; i++) {
            const char = rowStr[i];
            if (
              (char === "'" || char === '"') &&
              (i === 0 || rowStr[i - 1] !== "\\")
            ) {
              if (!inQuote) {
                inQuote = true;
                quoteChar = char;
              } else if (char === quoteChar) {
                inQuote = false;
              } else {
                current += char;
              }
            } else if (char === "," && !inQuote) {
              const trimmed = current.trim();
              // Check if it's a date/timestamp pattern (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) before trying to parse as number
              const isDateTime =
                /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2})?$/.test(trimmed);
              const num = isDateTime ? NaN : parseFloat(trimmed);
              values.push(isNaN(num) ? trimmed : num);
              current = "";
            } else {
              current += char;
            }
          }
          // Don't forget the last value
          if (current.trim()) {
            const trimmed = current.trim();
            // Check if it's a date/timestamp pattern (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS) before trying to parse as number
            const isDateTime =
              /^\d{4}-\d{2}-\d{2}(\s+\d{2}:\d{2}:\d{2})?$/.test(trimmed);
            const num = isDateTime ? NaN : parseFloat(trimmed);
            values.push(isNaN(num) ? trimmed : num);
          }

          table.rows.push(values);
        }
        console.log(`Added ${table.rows.length} rows to ${tableName}`);
      }
    }

    // Convert map to array
    tableMap.forEach((data, name) => {
      if (data.columns.length > 0) {
        tables.push({ name, ...data });
      }
    });

    console.log("Parsed tables:", tables.length);
    return tables;
  };

  const tables = question.setupSql ? parseSetupSql(question.setupSql) : [];

  console.log("QuestionPanel rendered with:", {
    questionTitle: question.title,
    description: question.description,
    hasSetupSql: !!question.setupSql,
    tableCount: tables.length,
    hasExpectedOutput: !!question.expectedOutput,
  });

  return (
    <div className="question-panel glass-panel corner-bracket h-full flex flex-col">
      <div className="question-header">
        <div className="question-nav flex items-center justify-between w-full">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="nav-button tactical-btn-outline"
          >
            ← PREV
          </button>
          <span className="question-counter font-orbitron text-xs tracking-widest text-secondary">
            OBJECTIVE {String(questionNumber).padStart(2, '0')} // {String(totalQuestions).padStart(2, '0')}
          </span>
          <button onClick={onNext} disabled={!hasNext} className="nav-button tactical-btn-outline">
            NEXT →
          </button>
        </div>
      </div>

      <div className="question-content flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="question-title-row flex items-baseline flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3 w-full border-b border-primary/20 pb-4 mb-2">
            <Target className="text-primary" size={24} />
            <span className="font-orbitron font-bold tracking-widest text-lg text-primary">MISSION OBJECTIVE</span>
          </div>
          
          <h2 className="neon-text font-orbitron text-3xl mb-2 w-full">{question.title}</h2>
          
          <div className="flex gap-3 mb-4">
            <span
              className={`badge-difficulty ${getDifficultyClass(question.difficulty)}`}
            >
              {question.difficulty}
            </span>
            <span className="badge-difficulty" style={{ color: 'var(--gold)', borderColor: 'var(--gold)', background: 'rgba(255, 215, 0, 0.08)', boxShadow: '0 0 10px rgba(255, 215, 0, 0.2)' }}>
              {question.points} PTS
            </span>
            {isSolved && <span className="badge-difficulty" style={{ color: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', background: 'rgba(124, 157, 255, 0.08)' }}>✓ VERIFIED</span>}
          </div>
        </div>

        <div className="question-statement text-text-primary text-lg leading-relaxed mb-10 pl-4 border-l-2 border-primary/30">
          <p>{question.description}</p>
        </div>

        {tables.length > 0 && (
          <div className="tables-section mb-10">
            <h3 className="flex items-center gap-2 font-orbitron text-primary tracking-widest mb-6">
              <Database size={18} /> DATABASE SCHEMA
            </h3>
            <div className="grid gap-6">
            {tables.map((table, idx) => (
              <div key={idx} className="terminal-table-container">
                <h4 className="font-mono text-secondary mb-2 bg-black/40 inline-block px-3 py-1 border border-primary/20 rounded-t">{table.name}</h4>
                <div className="table-wrapper">
                  <table className="tactical-table font-mono text-sm w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-primary/10 text-primary border-b-2 border-primary/30">
                        {table.columns.map((col, i) => (
                          <th key={i} className="p-3 font-normal tracking-wider">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.slice(0, 8).map((row, i) => (
                        <tr key={i} className="border-b border-primary/10 hover:bg-primary/5 transition-colors">
                          {row.map((cell, j) => (
                            <td key={j} className="p-3 text-text-secondary">{String(cell)}</td>
                          ))}
                        </tr>
                      ))}
                      {table.rows.length > 8 && (
                        <tr className="more-rows bg-black/40">
                          <td colSpan={table.columns.length} className="p-3 text-center text-secondary italic">
                            ... {table.rows.length - 8} MORE RECORDS DETECTED
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            </div>
          </div>
        )}

        {question.expectedOutput && (
          <div className="expected-output-section">
            <h3 className="flex items-center gap-2 font-orbitron text-primary tracking-widest mb-6">
              <Target size={18} /> EXPECTED INTELLIGENCE
            </h3>
            <div className="terminal-table-container target-output">
              <div className="table-wrapper">
                <table className="tactical-table green-table font-mono text-sm w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-primary/15 text-primary border-b-2 border-primary/40">
                      {question.expectedOutput.columns &&
                        question.expectedOutput.columns.map((col, i) => (
                          <th key={i} className="p-3 font-normal tracking-wider">{col}</th>
                        ))}
                      {!question.expectedOutput.columns &&
                        question.expectedOutput.type === "scalar" && (
                          <th className="p-3 font-normal tracking-wider">VALUE</th>
                        )}
                    </tr>
                  </thead>
                  <tbody>
                    {question.expectedOutput.rows.slice(0, 8).map((row, i) => (
                      <tr key={i} className="border-b border-primary/10 hover:bg-primary/10 transition-colors">
                        {Array.isArray(row) ? (
                          row.map((cell, j) => <td key={j} className="p-3 text-primary">{String(cell)}</td>)
                        ) : (
                          <td className="p-3 text-primary">{String(row)}</td>
                        )}
                      </tr>
                    ))}
                    {question.expectedOutput.rows.length > 8 && (
                      <tr className="more-rows bg-primary/5">
                        <td
                          colSpan={question.expectedOutput.columns?.length || 1}
                          className="p-3 text-center text-primary/70 italic"
                        >
                          ... {question.expectedOutput.rows.length - 8} MORE RECORDS EXPECTED
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
