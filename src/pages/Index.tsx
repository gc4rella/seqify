import { useState, useEffect } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { DiagramPreview } from "@/components/DiagramPreview";
import { StyleSelector } from "@/components/StyleSelector";
import { ThemeToggle } from "@/components/ThemeToggle";

const DEFAULT_PLANTUML = `@startuml
actor User
participant "Frontend" as FE
participant "Backend" as BE
database "Database" as DB

User -> FE: Open App
FE -> BE: GET /api/data
BE -> DB: Query Data
DB -> BE: Return Results
BE -> FE: JSON Response
FE -> User: Display Data
@enduml`;

const STORAGE_KEYS = {
  CODE: 'seqify-plantuml-code',
  STYLE: 'seqify-style',
};

const Index = () => {
  const getStoredValue = (key: string, fallback: string) => {
    if (typeof window === "undefined") return fallback;
    try {
      const saved = window.localStorage.getItem(key);
      return saved ?? fallback;
    } catch {
      return fallback;
    }
  };

  const setStoredValue = (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Ignore storage failures (private mode, quota exceeded, etc.)
    }
  };

  // Load from localStorage on mount
  const [plantUmlCode, setPlantUmlCode] = useState(() =>
    getStoredValue(STORAGE_KEYS.CODE, DEFAULT_PLANTUML)
  );

  const [style, setStyle] = useState(() =>
    getStoredValue(STORAGE_KEYS.STYLE, "")
  );

  // Auto-save to localStorage whenever code or style changes
  useEffect(() => {
    setStoredValue(STORAGE_KEYS.CODE, plantUmlCode);
  }, [plantUmlCode]);

  useEffect(() => {
    setStoredValue(STORAGE_KEYS.STYLE, style);
  }, [style]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S - Download diagram (prevent default save)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        // Trigger download by dispatching custom event
        window.dispatchEvent(new CustomEvent('seqify-download'));
      }

      // Ctrl/Cmd + Shift + C - Copy code
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        navigator.clipboard.writeText(plantUmlCode);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [plantUmlCode]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ThemeToggle />
      {/* Main Content - Single integrated interface */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Editor Panel */}
        <div className="border-r border-border/30">
          <CodeEditor value={plantUmlCode} onChange={setPlantUmlCode} style={style} onStyleChange={setStyle} />
        </div>

        {/* Preview Panel */}
        <div>
          <DiagramPreview plantUmlCode={plantUmlCode} style={style} />
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 text-center text-xs text-muted-foreground/60 border-t border-border/30 space-y-1">
        <div>Saved locally in your browser. No server storage.</div>
        <div>Works offline after first load.</div>
        <div>made with love ❤️ by <a href="https://gcarella.me" target="_blank" rel="noopener noreferrer" className="hover:text-muted-foreground transition-colors">gcarella.me</a></div>
      </footer>
    </div>
  );
};

export default Index;
