import { useEffect, useState } from "react";
import { encode } from "plantuml-encoder";
import { Loader2, Download, ZoomIn, ZoomOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface DiagramPreviewProps {
  plantUmlCode: string;
  style: string;
}

export const DiagramPreview = ({ plantUmlCode, style }: DiagramPreviewProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [zoom, setZoom] = useState(100);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = async () => {
    if (!imageUrl) return;

    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `seqify-diagram-${Date.now()}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  useEffect(() => {
    if (!plantUmlCode.trim()) {
      setImageUrl("");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Add style to the PlantUML code if not already present
      let codeWithStyle = plantUmlCode;
      if (style && !plantUmlCode.includes("skinparam")) {
        // Insert style after @startuml
        codeWithStyle = plantUmlCode.replace(
          /@startuml/i,
          `@startuml\n${style}`
        );
      }

      const encoded = encode(codeWithStyle);
      const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;

      // Preload image to handle loading state
      const img = new Image();
      img.onload = () => {
        setImageUrl(url);
        setLoading(false);
      };
      img.onerror = () => {
        setError("Failed to render diagram");
        setLoading(false);
      };
      img.src = url;
    } catch (err) {
      setError("Invalid PlantUML syntax");
      setLoading(false);
    }
  }, [plantUmlCode, style]);

  // Listen for keyboard shortcut download event
  useEffect(() => {
    const handleDownloadEvent = () => {
      handleDownload();
    };

    window.addEventListener('seqify-download', handleDownloadEvent);
    return () => window.removeEventListener('seqify-download', handleDownloadEvent);
  }, [imageUrl]);

  return (
    <div className="h-full flex flex-col bg-preview">
      {/* Terminal-style prompt - integrated */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-accent text-xs">›</span>
          <h2 className="text-sm text-accent font-medium">output</h2>
          <span className="text-muted-foreground text-xs">--live</span>
          {imageUrl && !loading && !error && (
            <>
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
            </>
          )}
          {mounted && (
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="px-2 py-1 text-xs text-muted-foreground hover:text-accent transition-colors border border-border/50 rounded h-7"
              title="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-3 h-3" />
              ) : (
                <Moon className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
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
        {!loading && !error && imageUrl && (
          <div className="flex items-start justify-center h-full">
            <div className="inline-block p-6 bg-black/20 rounded border border-border/30">
              <img
                src={imageUrl}
                alt="PlantUML Diagram"
                className="max-w-full h-auto"
                style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
              />
            </div>
          </div>
        )}
        {!loading && !error && !imageUrl && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground text-xs">awaiting input...</p>
          </div>
        )}
      </div>
    </div>
  );
};
