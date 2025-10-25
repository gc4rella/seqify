import { useState } from "react";
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

const Index = () => {
  const [plantUmlCode, setPlantUmlCode] = useState(DEFAULT_PLANTUML);
  const [style, setStyle] = useState("");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-gradient-primary shadow-glow">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">
            PlantUML Live
          </h1>
          <p className="text-sm text-primary-foreground/80 mt-1">
            Sequence diagram renderer with live preview
          </p>
        </div>
      </header>

      {/* Style Selector */}
      <StyleSelector onStyleChange={setStyle} />

      {/* Main Content */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 overflow-hidden">
        {/* Editor Panel */}
        <div className="border-r border-border">
          <CodeEditor value={plantUmlCode} onChange={setPlantUmlCode} />
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
