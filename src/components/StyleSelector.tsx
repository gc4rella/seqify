import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette } from "lucide-react";

interface StyleSelectorProps {
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
  BackgroundColor gradient {
    #FF6B6B
    #4ECDC4
  }
  BorderColor #333333
  FontColor #ffffff
  FontStyle bold
}
skinparam sequenceArrowThickness 2
skinparam sequenceArrowColor #333333`,
  },
];

export const StyleSelector = ({ onStyleChange }: StyleSelectorProps) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
      <Palette className="w-4 h-4 text-primary" />
      <span className="text-sm font-medium text-foreground">Style:</span>
      <Select defaultValue="default" onValueChange={(value) => {
        const style = STYLES.find(s => s.value === value);
        onStyleChange(style?.code || "");
      }}>
        <SelectTrigger className="w-[180px] bg-secondary border-border">
          <SelectValue placeholder="Select style" />
        </SelectTrigger>
        <SelectContent>
          {STYLES.map((style) => (
            <SelectItem key={style.value} value={style.value}>
              {style.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
