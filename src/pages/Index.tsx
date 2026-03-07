import { useState, useEffect } from "react";
import { CodeEditor } from "@/components/CodeEditor";
import { DiagramPreview } from "@/components/DiagramPreview";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import {
  DEFAULT_DIAGRAM_TYPE,
  detectDiagramType,
  getDefaultDiagramCode,
  isDiagramType,
  type DiagramType,
} from "@/lib/diagramType";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STORAGE_KEYS = {
  CODE: "seqify-diagram-code",
  LEGACY_CODE: "seqify-plantuml-code",
  STYLE: "seqify-style",
  DIAGRAM_TYPE: "seqify-diagram-type",
};

const Index = () => {
  const getStoredValue = (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
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

  const getStoredDiagramType = (): DiagramType => {
    const saved = getStoredValue(STORAGE_KEYS.DIAGRAM_TYPE);
    return isDiagramType(saved) ? saved : DEFAULT_DIAGRAM_TYPE;
  };

  const getStoredCode = () => {
    const savedCode = getStoredValue(STORAGE_KEYS.CODE);
    if (savedCode !== null) return savedCode;

    // Keep compatibility with users that already stored PlantUML under the previous key.
    const legacyCode = getStoredValue(STORAGE_KEYS.LEGACY_CODE);
    return legacyCode ?? getDefaultDiagramCode(DEFAULT_DIAGRAM_TYPE);
  };

  // Load from localStorage on mount
  const [diagramCode, setDiagramCode] = useState(getStoredCode);
  const [diagramType, setDiagramType] = useState<DiagramType>(() =>
    detectDiagramType(getStoredCode(), getStoredDiagramType())
  );
  const [style, setStyle] = useState(() => getStoredValue(STORAGE_KEYS.STYLE) ?? "");

  useEffect(() => {
    const detected = detectDiagramType(diagramCode, diagramType);
    if (detected !== diagramType) {
      setDiagramType(detected);
    }
  }, [diagramCode, diagramType]);

  // Auto-save to localStorage whenever code, style, or type changes
  useEffect(() => {
    setStoredValue(STORAGE_KEYS.CODE, diagramCode);
  }, [diagramCode]);

  useEffect(() => {
    setStoredValue(STORAGE_KEYS.STYLE, style);
  }, [style]);

  useEffect(() => {
    setStoredValue(STORAGE_KEYS.DIAGRAM_TYPE, diagramType);
  }, [diagramType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + S - Download diagram (prevent default save)
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        // Trigger download by dispatching custom event
        window.dispatchEvent(new CustomEvent("seqify-download"));
      }

      // Ctrl/Cmd + Shift + C - Copy code
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        e.preventDefault();
        navigator.clipboard.writeText(diagramCode);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [diagramCode]);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <ThemeToggle />
      {/* Main Content - Single integrated interface */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Mobile layout */}
        <div className="md:hidden h-full min-h-0 flex flex-col">
          <div className="flex-1 min-h-0 border-b border-border/30">
            <CodeEditor
              value={diagramCode}
              onChange={setDiagramCode}
              style={style}
              onStyleChange={setStyle}
              diagramType={diagramType}
            />
          </div>
          <div className="flex-1 min-h-0">
            <DiagramPreview
              diagramCode={diagramCode}
              diagramType={diagramType}
              style={style}
              onStyleChange={setStyle}
            />
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
              <CodeEditor
                value={diagramCode}
                onChange={setDiagramCode}
                style={style}
                onStyleChange={setStyle}
                diagramType={diagramType}
              />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="bg-border/30 hover:bg-border/60 transition-colors cursor-col-resize" />
          <ResizablePanel defaultSize={50} minSize={25}>
            <div className="h-full min-h-0">
              <DiagramPreview
                diagramCode={diagramCode}
                diagramType={diagramType}
                style={style}
                onStyleChange={setStyle}
              />
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
                  <p className="text-muted-foreground">Uses Mermaid for client-side Mermaid diagram rendering.</p>
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
