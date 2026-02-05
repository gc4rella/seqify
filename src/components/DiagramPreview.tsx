import { useEffect, useState } from "react";
import { Loader2, Download, ZoomIn, ZoomOut } from "lucide-react";
import { useTheme } from "next-themes";
import { PLANTUML_ASSET_HINT, renderPlantumlSvg } from "@/lib/plantumlRenderer";

interface DiagramPreviewProps {
  plantUmlCode: string;
  style: string;
}

export const DiagramPreview = ({ plantUmlCode, style }: DiagramPreviewProps) => {
  const [svgMarkup, setSvgMarkup] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const { resolvedTheme } = useTheme();

  const getRenderMode = () => {
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
      return;
    }

    let cancelled = false;

    const render = async () => {
      setLoading(true);
      setError("");

      try {
        // Add style to the PlantUML code if not already present
        let codeWithStyle = plantUmlCode;
        if (style && !plantUmlCode.includes("skinparam")) {
          const lines = style.split(/\r?\n/);
          const preLines = lines.filter((line) => line.trim().startsWith("!"));
          const bodyLines = lines.filter((line) => !line.trim().startsWith("!"));
          const preamble = preLines.join("\n").trim();
          const body = bodyLines.join("\n").trim();

          codeWithStyle = plantUmlCode.replace(/@startuml/i, (match) => {
            const preText = preamble ? `${preamble}\n` : "";
            const bodyText = body ? `\n${body}` : "";
            return `${preText}${match}${bodyText}`;
          });
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

  return (
    <div className="h-full flex flex-col bg-preview">
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
          </div>
        )}
      </div>

      {/* Preview area */}
      <div className="flex-1 p-4 overflow-auto">
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
            <div className="flex items-center gap-2">
              <span className="text-destructive text-xs">✗</span>
              <p className="text-destructive text-sm">{error}</p>
            </div>
          </div>
        )}
        {!loading && !error && svgMarkup && (
          <div className="flex items-start justify-center h-full">
            <div className="inline-block p-6 bg-black/20 rounded border border-border/30">
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
