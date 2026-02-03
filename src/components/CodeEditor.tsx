import { Textarea } from "@/components/ui/textarea";
import { StyleSelector } from "./StyleSelector";
import { TemplateSelector } from "./TemplateSelector";
import { Copy, Check, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  style: string;
  onStyleChange: (style: string) => void;
}

export const CodeEditor = ({ value, onChange, style, onStyleChange }: CodeEditorProps) => {
  const [copied, setCopied] = useState(false);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const payload = {
      version: 1,
      code: value,
      style,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `seqify-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(link.href);
  };

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleImportChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    try {
      const parsed = JSON.parse(text) as { code?: string; style?: string };
      if (typeof parsed.code === "string") {
        onChange(parsed.code);
        if (typeof parsed.style === "string") {
          onStyleChange(parsed.style);
        }
        event.target.value = "";
        return;
      }
    } catch {
      // Fall through to plain-text import
    }

    onChange(text);
    event.target.value = "";
  };

  return (
    <div className="h-full flex flex-col bg-editor">
      {/* Terminal-style prompt - integrated */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-primary text-xs">$</span>
          <h1 className="text-sm text-primary font-medium">seqify</h1>
          <span className="text-muted-foreground text-xs">--render</span>
          <StyleSelector onStyleChange={onStyleChange} />
          <TemplateSelector onTemplateSelect={onChange} currentCode={value} />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors border border-border/50 rounded h-7"
            title="Export diagram (JSON)"
          >
            <Download className="w-3 h-3" />
            <span>export</span>
          </button>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-primary transition-colors border border-border/50 rounded h-7"
            title="Import diagram (JSON or text)"
          >
            <Upload className="w-3 h-3" />
            <span>import</span>
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,.puml,.txt"
            onChange={handleImportChange}
            className="hidden"
          />
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
