import { Textarea } from "@/components/ui/textarea";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
}

export const CodeEditor = ({ value, onChange }: CodeEditorProps) => {
  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-card">
        <h2 className="text-sm font-medium text-foreground">PlantUML Source</h2>
      </div>
      <div className="flex-1 p-4 bg-editor overflow-hidden">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full font-mono text-sm bg-transparent border-none focus-visible:ring-0 resize-none"
          placeholder="@startuml&#10;Alice -> Bob: Hello&#10;Bob -> Alice: Hi!&#10;@enduml"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
