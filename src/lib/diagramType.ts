export type DiagramType = "plantuml" | "mermaid";

export const DEFAULT_DIAGRAM_TYPE: DiagramType = "plantuml";

export const DEFAULT_PLANTUML = `@startuml
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

export const DEFAULT_MERMAID = `sequenceDiagram
actor User
participant FE as Frontend
participant BE as Backend
participant DB as Database

User->>FE: Open App
FE->>BE: GET /api/data
BE->>DB: Query Data
DB-->>BE: Return Results
BE-->>FE: JSON Response
FE-->>User: Display Data`;

export const getDefaultDiagramCode = (diagramType: DiagramType) =>
  diagramType === "mermaid" ? DEFAULT_MERMAID : DEFAULT_PLANTUML;

export const isDiagramType = (value: string | null | undefined): value is DiagramType =>
  value === "plantuml" || value === "mermaid";

const PLANTUML_MARKERS = [
  /^\s*@start\w+\b/im,
  /^\s*@end\w+\b/im,
  /^\s*skinparam\b/im,
  /^\s*!(?:theme|include|includeurl|define|undef|if|elseif|else|endif|pragma|procedure|function|return)\b/im,
];

const MERMAID_MARKERS = [
  /^\s*(?:flowchart|graph)\s+(?:TB|TD|BT|RL|LR)\b/im,
  /^\s*sequenceDiagram\b/im,
  /^\s*classDiagram\b/im,
  /^\s*stateDiagram(?:-v2)?\b/im,
  /^\s*erDiagram\b/im,
  /^\s*journey\b/im,
  /^\s*gantt\b/im,
  /^\s*pie(?:\s+title\b|\s*$)/im,
  /^\s*mindmap\b/im,
  /^\s*timeline\b/im,
  /^\s*quadrantChart\b/im,
  /^\s*requirementDiagram\b/im,
  /^\s*gitGraph\b/im,
  /^\s*C4(?:Context|Container|Component|Dynamic|Deployment)\b/im,
  /^\s*(?:block|sankey|architecture|xychart|packet)-beta\b/im,
];

const containsAny = (input: string, patterns: RegExp[]) => patterns.some((pattern) => pattern.test(input));

export const detectDiagramType = (input: string, fallback: DiagramType = DEFAULT_DIAGRAM_TYPE): DiagramType => {
  const normalized = input.trim();
  if (!normalized) return fallback;

  const hasPlantumlMarkers = containsAny(normalized, PLANTUML_MARKERS);
  const hasMermaidMarkers = containsAny(normalized, MERMAID_MARKERS);

  if (hasPlantumlMarkers && !hasMermaidMarkers) return "plantuml";
  if (hasMermaidMarkers && !hasPlantumlMarkers) return "mermaid";

  // Ambiguous input: preserve the current mode for a stable editing experience.
  return fallback;
};
