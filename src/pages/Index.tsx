import { useState, useEffect } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { DiagramPreview } from "@/components/DiagramPreview";
import { StyleSelector } from "@/components/StyleSelector";

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
  // Load from localStorage on mount
  const [plantUmlCode, setPlantUmlCode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CODE);
    return saved || DEFAULT_PLANTUML;
  });

  const [style, setStyle] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.STYLE) || "";
  });

  // Auto-save to localStorage whenever code or style changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CODE, plantUmlCode);
  }, [plantUmlCode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STYLE, style);
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
    </div>
  );
};

export default Index;
