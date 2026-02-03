import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateSelectorProps {
  onTemplateSelect: (template: string) => void;
  currentCode: string;
}

const TEMPLATES = [
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
];

export const TemplateSelector = ({ onTemplateSelect, currentCode }: TemplateSelectorProps) => {
  const [selected, setSelected] = useState<string | undefined>(undefined);
  const [pendingTemplate, setPendingTemplate] = useState<(typeof TEMPLATES)[number] | null>(null);

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">--template</span>
      <Select
        value={selected}
        onValueChange={(value) => {
          const template = TEMPLATES.find((t) => t.value === value);
          if (!template) return;

          const wouldOverwrite = currentCode.trim().length > 0 && currentCode !== template.code;
          if (wouldOverwrite) {
            setPendingTemplate(template);
            return;
          }

          onTemplateSelect(template.code);
          setSelected(value);
        }}
      >
        <SelectTrigger className="w-[120px] h-7 bg-background/50 border-border/50 text-xs">
          <SelectValue placeholder="examples" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {TEMPLATES.map((template) => (
            <SelectItem key={template.value} value={template.value} className="text-xs">
              {template.label}
            </SelectItem>
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
              This will overwrite your current content.
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
                  onTemplateSelect(pendingTemplate.code);
                  setSelected(pendingTemplate.value);
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
