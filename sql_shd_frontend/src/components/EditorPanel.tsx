import { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import type { Question, EditorLanguage } from "../types";
import { CompetitionService } from "../services/CompetitionService";
import { useAuth } from "../contexts/AuthContext";
import { Terminal, SunMoon, RotateCcw } from "lucide-react";
import "./EditorPanel.css";

interface EditorPanelProps {
  question: Question;
  isLocked: boolean;
  currentLanguage: EditorLanguage;
  onLanguageChange: (language: EditorLanguage) => void;
}

const DEFAULT_STARTER = "-- Write your SQL query here\n\n";

export function EditorPanel({ question, isLocked }: EditorPanelProps) {
  const { session } = useAuth();
  const [content, setContent] = useState("");
  const [theme, setTheme] = useState<"vs-dark" | "light">("vs-dark");

  useEffect(() => {
    if (!session?.teamName) return;

    const saved = CompetitionService.getDraft(
      session.teamName,
      question.id,
      "sql",
    );
    if (saved !== null && saved.trim() !== "") {
      setContent(saved);
    } else {
      setContent(DEFAULT_STARTER);
    }
  }, [question.id, session]);

  const handleEditorChange = (value: string | undefined) => {
    if (isLocked) return;

    const newContent = value || "";
    setContent(newContent);

    if (session?.teamName) {
      CompetitionService.saveDraft(
        session.teamName,
        question.id,
        "sql",
        newContent,
      );
    }
  };

  const handleReset = () => {
    if (isLocked) return;
    setContent(DEFAULT_STARTER);
    if (session?.teamName) {
      CompetitionService.saveDraft(
        session.teamName,
        question.id,
        "sql",
        DEFAULT_STARTER,
      );
    }
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "vs-dark" ? "light" : "vs-dark"));
  };

  return (
    <div className="editor-panel glass-panel corner-bracket h-full flex flex-col">
      <div className="editor-toolbar">
        <div className="toolbar-left flex items-center gap-3">
          <Terminal size={16} className="text-primary" />
          <span className="font-orbitron font-bold tracking-widest text-sm">SQL TERMINAL</span>
          <div className="hud-separator-vertical h-4 mx-2"></div>
        </div>
        
        <div className="toolbar-right flex items-center gap-4">
          <div className="badge-difficulty easy language-badge">SQL</div>
          <button onClick={toggleTheme} className="toolbar-button" title="Toggle Theme">
            <SunMoon size={16} />
          </button>
          <button
            onClick={handleReset}
            disabled={isLocked}
            className="toolbar-button"
            title="Reset Terminal"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="editor-wrapper">
        <Editor
          height="100%"
          language="sql"
          value={content}
          theme={theme}
          onChange={handleEditorChange}
          options={{
            minimap: { enabled: false },
            fontFamily: "'JetBrains Mono', 'Share Tech Mono', monospace",
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            readOnly: isLocked,
            wordWrap: "on",
            padding: { top: 16 },
            cursorBlinking: "smooth",
            cursorWidth: 2,
            renderLineHighlight: "all",
          }}
        />
      </div>
    </div>
  );
}
