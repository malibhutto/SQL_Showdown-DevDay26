import React, { useState, useEffect } from "react";
import AdminService from "../services/AdminService";
import { Database, Plus, X, ClipboardType, Wand2, ShieldAlert, Cpu, TerminalSquare, AlertTriangle, FileJson, Server } from "lucide-react";
import "./ManageQuestions.css";

const ManageQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [jsonInput, setJsonInput] = useState("");
  const [jsonError, setJsonError] = useState("");

  const jsonTemplate = {
    questionId: "select-basic-001",
    title: "Basic SELECT Query",
    description: "Write a SQL query to select all columns from the users table",
    setupSql:
      "CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, age INTEGER);\nINSERT INTO users VALUES (1, 'Alice', 25), (2, 'Bob', 30);",
    starterSql: "SELECT * FROM users;",
    solutionSql: "SELECT * FROM users;",
    expectedStdout: "id|name|age\n1|Alice|25\n2|Bob|30",
    dialect: "sqlite",
    difficulty: "easy",
    points: 10,
    expectedOutput: {
      type: "table",
      columns: ["id", "name", "age"],
      rows: [
        [1, "Alice", 25],
        [2, "Bob", 30],
      ],
      orderMatters: false,
      caseSensitive: false,
      numericTolerance: 0,
    },
    constraints: {
      allowOnlySelect: true,
      maxRows: 100,
      maxQueryLength: 5000,
    },
  };

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const data = await AdminService.getAllQuestions();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to load questions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setJsonError("");

    try {
      // Parse and validate JSON
      const questionData = JSON.parse(jsonInput);

      // Basic validation
      const missing: string[] = [];
      if (!questionData.questionId) missing.push("questionId");
      if (!questionData.title) missing.push("title");
      if (!questionData.description) missing.push("description");
      if (!questionData.setupSql) missing.push("setupSql");
      if (!questionData.solutionSql) missing.push("solutionSql");
      if (!questionData.expectedOutput) missing.push("expectedOutput");
      if (!questionData.constraints) missing.push("constraints");

      if (missing.length > 0) {
        setJsonError("MISSING PROTOCOL FIELDS: " + missing.join(", "));
        return;
      }

      // Validate expectedOutput shape
      if (
        typeof questionData.expectedOutput !== "object" ||
        !Array.isArray(questionData.expectedOutput.rows)
      ) {
        setJsonError(
          "INVALID STRUCTURE: `expectedOutput` REQUIRES `rows` ARRAY",
        );
        return;
      }

      await AdminService.createQuestion(questionData);
      setMessage({ type: "success", text: "MISSION OBJECTIVE DEPLOYED" });
      setShowAddForm(false);
      setJsonInput("");
      await loadQuestions();
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        setJsonError("SYNTAX ERROR IN JSON PAYLOAD");
      } else {
        setMessage({
          type: "error",
          text: error.response?.data?.error || "DEPLOYMENT PROTOCOL FAILED",
        });
      }
    }
  };

  const loadTemplate = () => {
    setJsonInput(JSON.stringify(jsonTemplate, null, 2));
    setJsonError("");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-warning">
        <Server size={48} className="mb-4 animate-pulse opacity-50" />
        <div className="admin-spinner w-12 h-12 border-2 border-warning/20 border-t-warning rounded-full animate-spin shadow-[0_0_15px_rgba(250, 204, 21,0.3)] mb-4"></div>
        <p className="font-orbitron tracking-widest animate-pulse">ACCESSING MISSION DATABANKS...</p>
      </div>
    );
  }

  return (
    <div className="manage-questions-page max-w-7xl mx-auto animate-fade-slide-up pb-12">
      <div className="page-header flex flex-col md:flex-row md:items-end justify-between border-b border-warning/30 pb-6 mb-8 gap-4">
        <div>
          <h1 className="font-orbitron text-3xl text-warning tracking-widest glow-text-warning mb-2 m-0 flex items-center gap-3">
            <Database size={32} /> MISSION DATABASE
          </h1>
          <p className="font-mono text-secondary tracking-widest m-0 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_var(--success)]"></span>
            {questions.length} OBJECTIVES ONLINE
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className={`tactical-btn flex items-center gap-2 px-6 py-2 transition-all ${
            showAddForm 
              ? "bg-black/40 border-secondary text-secondary hover:bg-secondary/10 hover:text-white" 
              : "bg-warning/10 border-warning text-warning hover:bg-warning/20"
          }`}
          style={{ clipPath: 'polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)' }}
        >
          {showAddForm ? <><X size={16} /> ABORT UPLOAD</> : <><Plus size={16} /> DEPLOY OBJECTIVE</>}
        </button>
      </div>

      {message && (
        <div className={`message mb-8 p-4 font-mono text-sm tracking-wide border flex items-center gap-3 animate-fade-slide-up ${
          message.type === 'error' 
            ? 'bg-danger/10 border-danger/50 text-danger shadow-[0_0_15px_rgba(255, 107, 107,0.2)]' 
            : 'bg-success/10 border-success/50 text-success shadow-[0_0_15px_rgba(0,255,136,0.2)]'
        }`}>
          {message.type === 'error' ? <AlertTriangle size={20} /> : <Wand2 size={20} />}
          {message.text}
        </div>
      )}

      {showAddForm && (
        <div className="add-question-card glass-panel corner-bracket border-warning/40 p-6 md:p-8 mb-12 animate-fade-slide-up relative">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-warning/50 to-transparent"></div>
          
          <div className="flex items-center gap-3 mb-2">
            <Cpu size={24} className="text-warning" />
            <h2 className="font-orbitron text-xl text-primary tracking-widest m-0">JSON PAYLOAD INJECTION</h2>
          </div>
          <p className="font-mono text-secondary text-sm mb-6 pb-4 border-b border-warning/20 m-0">
            Transmit structured mission data. Utilize templates for rapid deployment.
          </p>

          <form onSubmit={handleSubmit} className="question-form flex flex-col gap-6">
            <div className="form-actions-top flex flex-wrap gap-4">
              <button
                type="button"
                onClick={loadTemplate}
                className="tactical-btn text-xs font-mono tracking-widest flex items-center gap-2 px-4 py-2 border-primary/50 text-primary hover:bg-primary/10"
              >
                <ClipboardType size={14} /> LOAD TEMPLATE
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const formatted = JSON.stringify(
                      JSON.parse(jsonInput),
                      null,
                      2,
                    );
                    setJsonInput(formatted);
                    setJsonError("");
                  } catch (e) {
                    setJsonError("CANNOT PARSE: SYNTAX FAULT");
                  }
                }}
                className="tactical-btn text-xs font-mono tracking-widest flex items-center gap-2 px-4 py-2 border-secondary/50 text-secondary hover:bg-secondary/10"
              >
                <FileJson size={14} /> FORMAT JSON
              </button>
            </div>

            {jsonError && (
              <div className="json-error bg-danger/10 border border-danger/50 text-danger p-3 font-mono text-sm flex items-start gap-3">
                <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{jsonError}</span>
              </div>
            )}

            <div className="form-group flex flex-col gap-2">
              <label className="font-orbitron tracking-widest text-primary text-sm flex items-center gap-2">
                <TerminalSquare size={16} /> RAW DATA STREAM
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => {
                  setJsonInput(e.target.value);
                  setJsonError("");
                }}
                placeholder="// PASTE JSON PAYLOAD OR LOAD TEMPLATE"
                rows={24}
                className="json-input custom-scrollbar w-full bg-[#030815] border border-primary/30 p-4 text-primary font-mono text-sm leading-relaxed focus:border-warning/60 focus:outline-none focus:shadow-[0_0_20px_rgba(250, 204, 21,0.1)] transition-all resize-y"
                required
              />
            </div>

            <div className="json-info bg-black/40 border border-primary/20 p-6">
              <h4 className="font-orbitron tracking-widest text-warning text-sm mb-4 border-b border-warning/20 pb-2">REQUIRED PROTOCOL FIELDS:</h4>
              <ul className="font-mono text-sm text-secondary grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 list-none p-0 m-0">
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">questionId</code> Unique identifier</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">title</code> Question title</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">description</code> What the agent needs to do</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">setupSql</code> DB schema and data</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">solutionSql</code> The correct answer</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">expectedStdout</code> Raw output string</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">expectedOutput</code> Structured output format</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">dialect</code> sqlite, mysql, postgresql</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">difficulty</code> easy, medium, hard</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">points</code> Reward value</div></li>
                <li className="flex items-start gap-2"><span className="text-warning mt-1">▸</span><div><code className="text-primary bg-primary/10 px-1.5 py-0.5 rounded mr-1">constraints</code> Query restrictions</div></li>
              </ul>
            </div>

            <div className="flex justify-end mt-4 pt-4 border-t border-warning/20">
              <button 
                type="submit" 
                className="tactical-btn flex items-center gap-2 px-8 py-3 bg-warning/10 border-warning text-warning hover:bg-warning/20 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
              >
                <Plus size={18} /> INITIATE DEPLOYMENT
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="questions-list grid grid-cols-1 lg:grid-cols-2 gap-6">
        {questions.map((q) => (
          <div key={q.questionId} className="question-card glass-panel border border-primary/20 hover:border-warning/40 transition-colors p-6 relative overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-black/80 to-transparent pointer-events-none"></div>
            
            <div className="question-header border-b border-primary/20 pb-4 mb-4 flex justify-between items-start gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-orbitron text-lg text-white tracking-widest m-0 mb-1 group-hover:text-warning transition-colors">{q.title}</h3>
                <span className="question-id font-mono text-xs text-secondary/60 tracking-wider">ID: {q.questionId}</span>
              </div>
              <div className="question-badges flex gap-2 flex-wrap justify-end">
                <span className={`difficulty-badge font-orbitron text-[10px] tracking-widest px-2 py-1 uppercase border ${
                  q.difficulty === 'easy' ? 'border-success/50 text-success bg-success/10' :
                  q.difficulty === 'medium' ? 'border-warning/50 text-warning bg-warning/10' :
                  'border-danger/50 text-danger bg-danger/10'
                }`}>
                  {q.difficulty}
                </span>
                <span className="points-badge font-mono text-xs bg-primary/10 text-primary border border-primary/30 px-2 py-1">
                  {q.points} PTS
                </span>
              </div>
            </div>
            
            <p className="question-description font-mono text-sm text-text-secondary leading-relaxed mb-6 line-clamp-2 pr-8">{q.description}</p>
            
            <div className="question-footer flex justify-between items-center bg-black/40 p-3 border border-primary/10">
              <span className="dialect-badge font-mono text-xs text-secondary flex items-center gap-1.5 uppercase">
                <Database size={12} /> {q.dialect}
              </span>
              <span className="constraint-badge font-mono text-xs flex items-center gap-1.5 opacity-80">
                {q.constraints?.allowOnlySelect ? (
                  <span className="text-success">✓ SELECT ONLY</span>
                ) : (
                  <span className="text-warning">⚠ ALL OPS PERMITTED</span>
                )}
              </span>
            </div>
          </div>
        ))}

        {questions.length === 0 && !isLoading && (
          <div className="col-span-full p-12 text-center glass-panel border-primary/20 flex flex-col items-center gap-4">
            <ShieldAlert size={48} className="text-secondary opacity-30" />
            <p className="font-orbitron tracking-widest text-secondary">NO MISSIONS DEPLOYED IN THIS SECTOR</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageQuestions;
