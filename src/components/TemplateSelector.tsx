import { useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DiagramType } from "@/lib/diagramType";

interface TemplateSelectorProps {
  onTemplateSelect: (template: string) => void;
  currentCode: string;
  activeDiagramType: DiagramType;
}

interface TemplateOption {
  value: string;
  label: string;
  code: string;
}

const NO_TEMPLATE_SELECTED = "__none__";

const TEMPLATE_GROUPS: Record<DiagramType, TemplateOption[]> = {
  plantuml: [
    {
      value: "api-flow",
      label: "API Flow",
      code: `@startuml
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
@enduml`,
    },
    {
      value: "auth",
      label: "Authentication",
      code: `@startuml
actor User
participant "Client" as C
participant "Auth Server" as AS
participant "API" as API

User -> C: Login Request
C -> AS: POST /auth/login
AS -> AS: Validate Credentials
AS -> C: Access Token
C -> API: Request + Token
API -> AS: Validate Token
AS -> API: Token Valid
API -> C: Protected Resource
C -> User: Display Data
@enduml`,
    },
    {
      value: "microservices",
      label: "Microservices",
      code: `@startuml
participant "API Gateway" as GW
participant "User Service" as US
participant "Order Service" as OS
participant "Payment Service" as PS
database "User DB" as UDB
database "Order DB" as ODB

GW -> US: GET /user/123
US -> UDB: Query User
UDB -> US: User Data
US -> GW: User Info

GW -> OS: POST /order
OS -> PS: Process Payment
PS -> OS: Payment Success
OS -> ODB: Save Order
ODB -> OS: Order Saved
OS -> GW: Order Confirmed
@enduml`,
    },
    {
      value: "websocket",
      label: "WebSocket Chat",
      code: `@startuml
actor "User A" as UA
actor "User B" as UB
participant "WebSocket Server" as WS

UA -> WS: Connect
WS -> UA: Connection Established

UB -> WS: Connect
WS -> UB: Connection Established

UA -> WS: Send Message
WS -> UB: Forward Message
UB -> WS: Send Reply
WS -> UA: Forward Reply

UA -> WS: Disconnect
WS -> UA: Connection Closed
@enduml`,
    },
    {
      value: "simple",
      label: "Simple Example",
      code: `@startuml
Alice -> Bob: Hello Bob!
Bob -> Alice: Hi Alice!
Alice -> Bob: How are you?
Bob -> Alice: I'm good, thanks!
@enduml`,
    },
  ],
  mermaid: [
    {
      value: "sequence",
      label: "Sequence",
      code: `sequenceDiagram
actor User
participant FE as Frontend
participant API as API Server
participant DB as Database

User->>FE: Open dashboard
FE->>API: GET /dashboard
API->>DB: Query widgets
DB-->>API: Widgets data
API-->>FE: JSON response
FE-->>User: Render dashboard`,
    },
    {
      value: "flowchart",
      label: "Flowchart",
      code: `flowchart TD
Start([Start]) --> Validate{Valid request?}
Validate -- No --> Reject[Return 400]
Validate -- Yes --> Process[Process command]
Process --> Persist[(Save in DB)]
Persist --> Notify[Publish event]
Notify --> Done([Done])`,
    },
    {
      value: "state",
      label: "State Machine",
      code: `stateDiagram-v2
[*] --> Idle
Idle --> Loading: fetch()
Loading --> Success: resolve
Loading --> Error: reject
Error --> Loading: retry
Success --> Idle: reset`,
    },
    {
      value: "class",
      label: "Class Diagram",
      code: `classDiagram
class User {
  +id: string
  +email: string
  +verifyPassword(password): boolean
}
class Session {
  +token: string
  +expiresAt: Date
}
class AuthService {
  +login(email, password): Session
  +logout(token): void
}

User "1" --> "many" Session : owns
AuthService ..> User : validates`,
    },
    {
      value: "journey",
      label: "User Journey",
      code: `journey
title Checkout Journey
section Browse
  Open store: 5: User
  Search product: 4: User
section Purchase
  Add to cart: 5: User
  Complete payment: 3: User, Gateway
section Post-purchase
  Receive confirmation: 5: User`,
    },
  ],
};

const toSelectValue = (diagramType: DiagramType, templateId: string) => `${diagramType}:${templateId}`;

const fromSelectValue = (value: string): { diagramType: DiagramType; templateId: string } | null => {
  const [diagramType, templateId] = value.split(":");
  if ((diagramType !== "plantuml" && diagramType !== "mermaid") || !templateId) return null;
  return { diagramType, templateId };
};

export const TemplateSelector = ({
  onTemplateSelect,
  currentCode,
  activeDiagramType,
}: TemplateSelectorProps) => {
  const [selected, setSelected] = useState<string>(NO_TEMPLATE_SELECTED);
  const [pendingTemplate, setPendingTemplate] = useState<{
    template: TemplateOption;
    diagramType: DiagramType;
  } | null>(null);
  const orderedGroups = useMemo<DiagramType[]>(
    () => (activeDiagramType === "mermaid" ? ["mermaid", "plantuml"] : ["plantuml", "mermaid"]),
    [activeDiagramType]
  );
  const selectedLabel = useMemo(() => {
    const parsed = fromSelectValue(selected);
    if (!parsed) return "examples";
    const template = TEMPLATE_GROUPS[parsed.diagramType].find(
      (candidate) => candidate.value === parsed.templateId
    );
    return template?.label ?? "examples";
  }, [selected]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">--template</span>
      <Select
        value={selected}
        onValueChange={(value) => {
          const parsed = fromSelectValue(value);
          if (!parsed) return;

          const template = TEMPLATE_GROUPS[parsed.diagramType].find(
            (candidate) => candidate.value === parsed.templateId
          );
          if (!template) return;

          const wouldOverwrite = currentCode.trim().length > 0 && currentCode !== template.code;
          if (wouldOverwrite) {
            setPendingTemplate({ template, diagramType: parsed.diagramType });
            return;
          }

          onTemplateSelect(template.code);
          setSelected(value);
        }}
      >
        <SelectTrigger className="w-[148px] h-7 bg-background/50 border-border/50 text-xs">
          <SelectValue>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          <SelectItem value={NO_TEMPLATE_SELECTED} className="hidden" disabled>
            examples
          </SelectItem>
          {orderedGroups.map((diagramType, index) => (
            <SelectGroup key={diagramType}>
              <SelectLabel className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                {diagramType}
              </SelectLabel>
              {TEMPLATE_GROUPS[diagramType].map((template) => (
                <SelectItem
                  key={toSelectValue(diagramType, template.value)}
                  value={toSelectValue(diagramType, template.value)}
                  className="text-xs"
                >
                  {template.label}
                </SelectItem>
              ))}
              {index < orderedGroups.length - 1 && <SelectSeparator />}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      {pendingTemplate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="w-full max-w-sm rounded-lg border border-border/60 bg-editor p-4 shadow-xl">
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-primary">$</span>
              <span className="text-primary">seqify</span>
              <span className="text-muted-foreground">--template</span>
            </div>
            <div className="mt-3 text-sm text-foreground">Replace current diagram?</div>
            <div className="mt-1 text-xs text-muted-foreground">
              This will apply the {pendingTemplate.diagramType} template and overwrite your current content.
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="h-8 rounded border border-border/60 px-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setPendingTemplate(null)}
              >
                cancel
              </button>
              <button
                className="h-8 rounded border border-primary/60 bg-primary/10 px-3 text-xs text-primary hover:bg-primary/20 transition-colors"
                onClick={() => {
                  const nextValue = toSelectValue(pendingTemplate.diagramType, pendingTemplate.template.value);
                  onTemplateSelect(pendingTemplate.template.code);
                  setSelected(nextValue);
                  setPendingTemplate(null);
                }}
              >
                replace
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
