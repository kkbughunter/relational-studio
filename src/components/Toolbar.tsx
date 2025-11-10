import { Button } from "@/components/ui/button";
import { MousePointer2, Square, GitBranch, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RelationshipType } from "./Relationship";

interface ToolbarProps {
  selectedTool: "select" | "entity" | "relationship";
  relationshipType: RelationshipType;
  onToolChange: (tool: "select" | "entity" | "relationship") => void;
  onRelationshipTypeChange: (type: RelationshipType) => void;
  onClear: () => void;
}

export const Toolbar = ({
  selectedTool,
  relationshipType,
  onToolChange,
  onRelationshipTypeChange,
  onClear,
}: ToolbarProps) => {
  const getRelationshipLabel = (type: RelationshipType) => {
    switch (type) {
      case "one-to-one":
        return "1:1";
      case "one-to-many":
        return "1:N";
      case "many-to-many":
        return "N:M";
    }
  };

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
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant={selectedTool === "relationship" ? "default" : "ghost"}
              size="sm"
              className="gap-2"
            >
              <GitBranch className="h-4 w-4" />
              Relationship ({getRelationshipLabel(relationshipType)})
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-popover z-50">
            <DropdownMenuItem
              onClick={() => {
                onRelationshipTypeChange("one-to-one");
                onToolChange("relationship");
              }}
              className="cursor-pointer"
            >
              One-to-One (1:1)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onRelationshipTypeChange("one-to-many");
                onToolChange("relationship");
              }}
              className="cursor-pointer"
            >
              One-to-Many (1:N)
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onRelationshipTypeChange("many-to-many");
                onToolChange("relationship");
              }}
              className="cursor-pointer"
            >
              Many-to-Many (N:M)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
