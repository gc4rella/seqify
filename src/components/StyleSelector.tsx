import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface StyleSelectorProps {
  style: string;
  onStyleChange: (style: string) => void;
}

const STYLES = [
  { value: "default", label: "Default", code: "" },
  {
    value: "blueprint",
    label: "Blueprint",
    code: `skinparam backgroundColor #EEEBDC
skinparam sequenceArrowThickness 2
skinparam roundcorner 20
skinparam maxmessagesize 60
skinparam sequenceParticipant underline`,
  },
  {
    value: "modern",
    label: "Modern Dark",
    code: `skinparam backgroundColor #1e1e1e
skinparam sequenceMessageAlign center
skinparam sequenceArrowThickness 2
skinparam participant {
  BackgroundColor #2d2d2d
  BorderColor #6366f1
  FontColor #ffffff
}
skinparam sequence {
  ArrowColor #6366f1
  LifeLineBorderColor #6366f1
}`,
  },
  {
    value: "minimal",
    label: "Minimal",
    code: `skinparam monochrome true
skinparam shadowing false
skinparam defaultFontName Arial
skinparam defaultFontSize 14`,
  },
  {
    value: "vibrant",
    label: "Vibrant",
    code: `skinparam backgroundColor #f0f0f0
skinparam participant {
  BackgroundColor #FF6B6B-#4ECDC4
  BorderColor #333333
  FontColor #ffffff
  FontStyle bold
}
skinparam sequenceArrowThickness 2
skinparam sequenceArrowColor #333333`,
  },
  {
    value: "sketch",
    label: "Sketch (Excalidraw)",
    code: `skinparam handwritten true
skinparam shadowing false
skinparam backgroundColor #faf8f1
skinparam defaultFontName "Comic Sans MS"
skinparam defaultFontSize 14
skinparam participant {
  BackgroundColor #fff3e0
  BorderColor #374151
  FontColor #111827
}
skinparam sequenceMessageAlign center
skinparam sequenceArrowColor #374151
skinparam sequenceArrowThickness 2`,
  },
];

const normalizeStyle = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .replace(/^\s*!option\s+handwritten\s+true\s*$/gim, "skinparam handwritten true")
    .replace(/\bskinparam\s+sequenceMessageAlign\b/gi, "skinparam sequenceMessageAlignment")
    .replace(/\bskinparam\s+maxMessageSize\b/gi, "skinparam maxmessagesize")
    .trim();

const getSelectedStyleValue = (style: string) => {
  const normalizedCurrent = normalizeStyle(style);
  if (!normalizedCurrent) {
    return "default";
  }

  const matched = STYLES.find((candidate) => normalizeStyle(candidate.code) === normalizedCurrent);
  return matched?.value ?? "custom";
};

export const StyleSelector = ({ style, onStyleChange }: StyleSelectorProps) => {
  const selectedValue = getSelectedStyleValue(style);
  const hasCustomStyle = selectedValue === "custom";

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">--style</span>
      <Select
        value={selectedValue}
        onValueChange={(value) => {
          if (value === "custom") return;
          const selectedStyle = STYLES.find((candidate) => candidate.value === value);
          onStyleChange(selectedStyle?.code || "");
        }}
      >
        <SelectTrigger className="w-[150px] h-7 bg-background/50 border-border/50 text-xs">
          <SelectValue placeholder="default" />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {STYLES.map((style) => (
            <SelectItem key={style.value} value={style.value} className="text-xs">
              {style.label}
            </SelectItem>
          ))}
          {hasCustomStyle && (
            <SelectItem value="custom" disabled className="text-xs">
              Custom (imported)
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};
