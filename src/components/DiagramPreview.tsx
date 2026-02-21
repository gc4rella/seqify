import { useEffect, useState } from "react";
import { Loader2, Download, ZoomIn, ZoomOut, Maximize2, Minimize2, Copy } from "lucide-react";
import { useTheme } from "next-themes";
import { PLANTUML_ASSET_HINT, renderPlantumlSvg } from "@/lib/plantumlRenderer";
import { cn } from "@/lib/utils";

interface DiagramPreviewProps {
  plantUmlCode: string;
  style: string;
  onStyleChange?: (style: string) => void;
}

const PLAIN_THEME_DIRECTIVE_REGEX = /^\s*!theme\s+plain(?:\s|$)/im;
const PLAIN_THEME_DIRECTIVE_LINE_REGEX = /^\s*!theme\s+plain(?:\s|$).*$/gim;

const stripPlainThemeDirective = (input: string) => input.replace(PLAIN_THEME_DIRECTIVE_LINE_REGEX, "");
const normalizePlantumlCompatibility = (input: string) =>
  stripPlainThemeDirective(input)
    .replace(/^\s*!option\s+handwritten\s+true\s*$/gim, "skinparam handwritten true")
    .replace(/\bskinparam\s+sequenceMessageAlign\b/gi, "skinparam sequenceMessageAlignment")
    .replace(/\bskinparam\s+maxMessageSize\b/gi, "skinparam maxmessagesize");

export const DiagramPreview = ({ plantUmlCode, style, onStyleChange }: DiagramPreviewProps) => {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [effectiveSource, setEffectiveSource] = useState("");
  const [copiedInput, setCopiedInput] = useState(false);
  const { resolvedTheme } = useTheme();
  const hasActiveStyle = style.trim().length > 0;
  const errorLineMatch = error.match(/\bline[:\s]+(\d+)\b/i);
  const errorLine = errorLineMatch ? errorLineMatch[1] : null;

  const getRenderMode = () => {
    const sourceWithStyle = `${plantUmlCode}\n${style}`;
    if (PLAIN_THEME_DIRECTIVE_REGEX.test(sourceWithStyle)) {
      // PlantUML "plain" theme expects light mode colors.
      return "light";
    }

    const trimmedStyle = style.trim();
    if (!trimmedStyle) {
      return resolvedTheme === "dark" ? "dark" : "light";
    }

    const globalBgMatch = trimmedStyle.match(
      /skinparam\s+backgroundColor\s+#([0-9a-fA-F]{3,6})/i
    );
    const anyBgMatch =
      globalBgMatch ?? trimmedStyle.match(/backgroundColor\s+#([0-9a-fA-F]{3,6})/i);

    if (!anyBgMatch) {
      // Custom style with no explicit background: prefer light to avoid low-contrast dark mode defaults.
      return "light";
    }

    const hex = anyBgMatch[1];
    const fullHex =
      hex.length === 3
        ? hex
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : hex.padEnd(6, "0");

    const r = parseInt(fullHex.slice(0, 2), 16) / 255;
    const g = parseInt(fullHex.slice(2, 4), 16) / 255;
    const b = parseInt(fullHex.slice(4, 6), 16) / 255;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    return luminance < 0.45 ? "dark" : "light";
  };

  const buildEffectiveSource = () => {
    const sanitizedCode = normalizePlantumlCompatibility(plantUmlCode);
    const sanitizedStyle = normalizePlantumlCompatibility(style);

    let codeWithStyle = sanitizedCode;
    if (sanitizedStyle.trim()) {
      const lines = sanitizedStyle.split(/\r?\n/);
      const preLines = lines.filter((line) => line.trim().startsWith("!"));
      const bodyLines = lines.filter((line) => !line.trim().startsWith("!"));
      const preamble = preLines.join("\n").trim();
      const body = bodyLines.join("\n").trim();
      const injectedText = [preamble, body].filter(Boolean).join("\n");

      if (/@startuml/i.test(sanitizedCode)) {
        codeWithStyle = sanitizedCode.replace(
          /@startuml/i,
          (match) => (injectedText ? `${match}\n${injectedText}` : match)
        );
      } else {
        codeWithStyle = [preamble, sanitizedCode, body].filter(Boolean).join("\n");
      }
    }

    return codeWithStyle;
  };

  const handleCopyEffectiveSource = async () => {
    const source = (effectiveSource || plantUmlCode).trim();
    if (!source) return;
    await navigator.clipboard.writeText(source);
    setCopiedInput(true);
    window.setTimeout(() => setCopiedInput(false), 1500);
  };

  const handleDownload = () => {
    if (!svgMarkup) return;

    try {
      const blob = new Blob([svgMarkup], { type: "image/svg+xml" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `seqify-diagram-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  useEffect(() => {
    if (!plantUmlCode.trim()) {
      setSvgMarkup("");
      setError("");
      setEffectiveSource("");
      return;
    }

    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError("");

      try {
        const codeWithStyle = buildEffectiveSource();
        setEffectiveSource(codeWithStyle);

        if (/@startuml/i.test(codeWithStyle) && !/@enduml/i.test(codeWithStyle)) {
          throw new Error("Missing @enduml");
        }

        const mode = getRenderMode();
        const svg = await renderPlantumlSvg(codeWithStyle, mode);
        if (cancelled) return;
        setSvgMarkup(svg);
      } catch (err) {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : "Failed to render diagram";
        const needsHint =
          message.includes("CheerpJ") ||
          message.includes("plantuml-core.jar") ||
          message.includes("Failed to load");
        setError(needsHint ? `${message} ${PLANTUML_ASSET_HINT}` : message);
        setSvgMarkup("");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    const timeout = window.setTimeout(render, 200);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [plantUmlCode, style, resolvedTheme]);

  // Listen for keyboard shortcut download event
  useEffect(() => {
    const handleDownloadEvent = () => {
      handleDownload();
    };

    window.addEventListener('seqify-download', handleDownloadEvent);
    return () => window.removeEventListener('seqify-download', handleDownloadEvent);
  }, [svgMarkup]);

  useEffect(() => {
    if (!isFullscreen) return;

    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFullscreen]);

  return (
    <div
      className={cn(
        "h-full flex flex-col bg-preview",
        isFullscreen && "fixed inset-0 z-[70] bg-background"
      )}
    >
      {/* Terminal-style prompt - integrated */}
      <div className="px-4 pt-4 pb-2 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-accent text-xs">›</span>
          <h2 className="text-sm text-accent font-medium">output</h2>
          <span className="text-muted-foreground text-xs">--live</span>
        </div>
        {svgMarkup && !loading && !error && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setZoom(Math.max(25, zoom - 25))}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 rounded h-7"
              title="Zoom out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-xs text-muted-foreground px-1 min-w-[3rem] text-center border border-border/50 rounded h-7 flex items-center justify-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 25))}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 rounded h-7"
              title="Zoom in"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 rounded h-7"
              title="Download diagram (Ctrl+S)"
            >
              <Download className="w-3 h-3" />
              <span>export</span>
            </button>
            <button
              onClick={() => setIsFullscreen((value) => !value)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 rounded h-7"
              title={isFullscreen ? "Exit full screen (Esc)" : "View full screen"}
            >
              {isFullscreen ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
              <span>{isFullscreen ? "exit" : "full"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className={cn("flex-1 p-4 overflow-auto", isFullscreen && "p-6")}>
        {loading && (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">rendering...</span>
            </div>
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <div className="w-full max-w-3xl space-y-3 rounded border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-2">
                <span className="text-destructive text-xs">✗</span>
                <p className="text-destructive text-sm">{error}</p>
              </div>
              {hasActiveStyle && (
                <p className="text-xs text-muted-foreground">
                  An active style block is merged into your diagram before rendering.
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleCopyEffectiveSource}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 rounded h-7"
                >
                  <Copy className="w-3 h-3" />
                  <span>{copiedInput ? "copied" : "copy renderer input"}</span>
                </button>
                {hasActiveStyle && onStyleChange && (
                  <button
                    onClick={() => onStyleChange("")}
                    className="px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 rounded h-7"
                  >
                    clear active style
                  </button>
                )}
                {errorLine && (
                  <span className="text-xs text-muted-foreground">reported line: {errorLine}</span>
                )}
              </div>
              <details className="rounded border border-border/40 bg-black/20">
                <summary className="cursor-pointer px-3 py-2 text-xs text-muted-foreground">
                  show renderer input
                </summary>
                <pre className="max-h-56 overflow-auto px-3 pb-3 text-[11px] leading-5 text-foreground/80 whitespace-pre-wrap">
                  {effectiveSource || plantUmlCode}
                </pre>
              </details>
            </div>
          </div>
        )}
        {!loading && !error && svgMarkup && (
          <div className="flex items-start justify-center h-full">
            <div className={cn("inline-block p-6 bg-black/20 rounded border border-border/30", isFullscreen && "p-8")}>
              <div
                className="max-w-full h-auto plantuml-svg"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
                dangerouslySetInnerHTML={{ __html: svgMarkup }}
              />
            </div>
          </div>
        )}
        {!loading && !error && !svgMarkup && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-xs">awaiting input...</p>
          </div>
        )}
      </div>
    </div>
  );
};
