import { Textarea } from "@/components/ui/textarea";
import { StyleSelector } from "./StyleSelector";
import { TemplateSelector } from "./TemplateSelector";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  style: string;
  onStyleChange: (style: string) => void;
}

export const CodeEditor = ({ value, onChange, style, onStyleChange }: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-editor">
      {/* Terminal-style prompt - integrated */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-primary text-xs">$</span>
          <h1 className="text-sm text-primary font-medium">seqify</h1>
          <span className="text-muted-foreground text-xs">--render</span>
          <StyleSelector onStyleChange={onStyleChange} />
          <TemplateSelector onTemplateSelect={onChange} />
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors border border-border/50 rounded h-7"
            title="Copy code (Ctrl+Shift+C)"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full px-4 py-2 text-sm bg-transparent border-none focus-visible:ring-0 resize-none text-foreground/90"
          placeholder="@startuml&#10;Alice -> Bob: Hello&#10;Bob -> Alice: Hi!&#10;@enduml"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
