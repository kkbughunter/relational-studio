import { Button } from "@/components/ui/button";
import { MousePointer2, Square, Plus, Trash2 } from "lucide-react";

interface ToolbarProps {
  selectedTool: "select" | "entity";
  onToolChange: (tool: "select" | "entity") => void;
  onClear: () => void;
}

export const Toolbar = ({ selectedTool, onToolChange, onClear }: ToolbarProps) => {
  return (
    <div className="bg-toolbar-background border-b border-toolbar-border px-4 py-3 flex items-center gap-2">
      <div className="flex items-center gap-1 border-r border-toolbar-border pr-4">
        <Button
          variant={selectedTool === "select" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("select")}
          className="gap-2"
        >
          <MousePointer2 className="h-4 w-4" />
          Select
        </Button>
        <Button
          variant={selectedTool === "entity" ? "default" : "ghost"}
          size="sm"
          onClick={() => onToolChange("entity")}
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          Entity
        </Button>
      </div>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClear}
        className="gap-2 text-destructive hover:text-destructive"
      >
        <Trash2 className="h-4 w-4" />
        Clear
      </Button>
    </div>
  );
};
