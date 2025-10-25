import { useEffect, useState } from "react";
import { encode } from "plantuml-encoder";
import { Loader2 } from "lucide-react";

interface DiagramPreviewProps {
  plantUmlCode: string;
  style: string;
}

export const DiagramPreview = ({ plantUmlCode, style }: DiagramPreviewProps) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

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

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-card">
        <h2 className="text-sm font-medium text-foreground">Live Preview</h2>
      </div>
      <div className="flex-1 p-8 bg-preview overflow-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="flex items-center justify-center h-full">
            <p className="text-destructive">{error}</p>
          </div>
        )}
        {!loading && !error && imageUrl && (
          <div className="flex items-start justify-center">
            <img 
              src={imageUrl} 
              alt="PlantUML Diagram" 
              className="max-w-full h-auto rounded-lg shadow-soft"
            />
          </div>
        )}
        {!loading && !error && !imageUrl && (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Start typing to see the diagram...</p>
          </div>
        )}
      </div>
    </div>
  );
};
