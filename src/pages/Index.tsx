import { useState, useEffect } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { DiagramPreview } from "@/components/DiagramPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <ThemeToggle />
      {/* Main Content - Single integrated interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Mobile layout */}
        <div className="md:hidden h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 border-b border-border/30">
            <CodeEditor value={plantUmlCode} onChange={setPlantUmlCode} style={style} onStyleChange={setStyle} />
          </div>
          <div className="flex-1 min-h-0">
            <DiagramPreview plantUmlCode={plantUmlCode} style={style} onStyleChange={setStyle} />
          </div>
        </div>

        {/* Desktop layout with draggable center divider */}
        <ResizablePanelGroup
          direction="horizontal"
          autoSaveId="seqify-main-layout"
          className="hidden md:flex h-full min-h-0"
        >
          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full min-h-0">
              <CodeEditor value={plantUmlCode} onChange={setPlantUmlCode} style={style} onStyleChange={setStyle} />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/30 hover:bg-border/60 transition-colors cursor-col-resize" />
          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full min-h-0">
              <DiagramPreview plantUmlCode={plantUmlCode} style={style} onStyleChange={setStyle} />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Footer */}
      <footer className="shrink-0 border-t border-border/30 py-2 px-3">
        <div className="mx-auto flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 text-center text-[10px] sm:text-[11px] leading-tight text-muted-foreground/40">
          {/* CheerpJ license requires this exact message + logo to be visible for end users. */}
          <span className="inline-flex items-center gap-1.5">
            <img src="/cheerpj-mark.svg" alt="CheerpJ" className="h-3.5 opacity-60" />
            <a
              href="https://cheerpj.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-muted-foreground/70 transition-colors underline-offset-4 hover:underline"
            >
              Powered by CheerpJ, a Leaning Technologies Java tool
            </a>
          </span>
          <span className="opacity-30">•</span>
          <Dialog>
            <DialogTrigger asChild>
              <button
                type="button"
                className="hover:text-muted-foreground/70 transition-colors underline-offset-4 hover:underline"
              >
                made with love ❤️
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>About Seqify</DialogTitle>
                <DialogDescription>
                  Seqify is intentionally designed as an offline-friendly tool that renders diagrams in your browser, with no remote processing.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="space-y-1">
                  <div className="font-medium">Privacy + offline</div>
                  <p className="text-muted-foreground">
                    Rendering happens locally in your browser. There is no server-side rendering and no server storage of your diagram text.
                    After the first successful load, it can work offline once the renderer assets are cached.
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">Credits</div>
                  <p className="text-muted-foreground">
                    Uses PlantUML Core + CheerpJ for in-browser rendering. CheerpJ license requires the “Powered by CheerpJ, a Leaning
                    Technologies Java tool” message and logo to be visible for end users.
                  </p>
                  <p className="text-muted-foreground">
                    Author:{" "}
                    <a
                      href="https://gcarella.me"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-foreground/90 hover:text-foreground underline-offset-4 hover:underline"
                    >
                      gcarella.me
                    </a>
                  </p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <span>by</span>
          <a
            href="https://gcarella.me"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-muted-foreground/70 transition-colors underline-offset-4 hover:underline"
          >
            gcarella.me
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
