import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TemplateSelectorProps {
  onTemplateSelect: (template: string) => void;
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

export const TemplateSelector = ({ onTemplateSelect }: TemplateSelectorProps) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">--template</span>
      <Select onValueChange={(value) => {
        const template = TEMPLATES.find(t => t.value === value);
        if (template) {
          onTemplateSelect(template.code);
        }
      }}>
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
    </div>
  );
};
