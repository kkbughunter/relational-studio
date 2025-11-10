import { useState, useRef, useEffect } from "react";
import { GripVertical, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface Attribute {
  id: string;
  name: string;
  type: string;
  isPrimaryKey?: boolean;
}

export interface EntityData {
  id: string;
  name: string;
  x: number;
  y: number;
  attributes: Attribute[];
}

interface EntityProps {
  entity: EntityData;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (entity: EntityData) => void;
  onDelete: () => void;
}

export const Entity = ({ entity, isSelected, onSelect, onUpdate, onDelete }: EntityProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(entity.name);
  const entityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalName(entity.name);
  }, [entity.name]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, button')) return;
    
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - entity.x,
      y: e.clientY - entity.y,
    });
    onSelect();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        onUpdate({
          ...entity,
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragOffset, entity, onUpdate]);

  const addAttribute = () => {
    const newAttribute: Attribute = {
      id: `attr-${Date.now()}`,
      name: "attribute",
      type: "VARCHAR(255)",
    };
    onUpdate({
      ...entity,
      attributes: [...entity.attributes, newAttribute],
    });
  };

  const updateAttribute = (attrId: string, updates: Partial<Attribute>) => {
    onUpdate({
      ...entity,
      attributes: entity.attributes.map((attr) =>
        attr.id === attrId ? { ...attr, ...updates } : attr
      ),
    });
  };

  const deleteAttribute = (attrId: string) => {
    onUpdate({
      ...entity,
      attributes: entity.attributes.filter((attr) => attr.id !== attrId),
    });
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (localName.trim()) {
      onUpdate({ ...entity, name: localName.trim() });
    } else {
      setLocalName(entity.name);
    }
  };

  return (
    <div
      ref={entityRef}
      className={`absolute bg-entity-background border-2 rounded-lg shadow-lg cursor-move select-none min-w-[250px] ${
        isSelected ? "border-primary" : "border-entity-border"
      }`}
      style={{
        left: `${entity.x}px`,
        top: `${entity.y}px`,
      }}
      onMouseDown={handleMouseDown}
    >
      <div className="bg-entity-header text-primary-foreground px-4 py-3 rounded-t-md flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 opacity-70" />
          {isEditingName ? (
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNameSubmit();
                if (e.key === "Escape") {
                  setIsEditingName(false);
                  setLocalName(entity.name);
                }
              }}
              className="h-7 bg-primary-foreground text-foreground border-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="font-semibold cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
            >
              {entity.name}
            </h3>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="h-6 w-6 p-0 hover:bg-primary-foreground/20 text-primary-foreground"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-3 space-y-1">
        {entity.attributes.map((attr) => (
          <div
            key={attr.id}
            className="flex items-center gap-2 text-sm py-1.5 px-2 rounded hover:bg-muted group"
            onClick={(e) => e.stopPropagation()}
          >
            <Input
              value={attr.name}
              onChange={(e) => updateAttribute(attr.id, { name: e.target.value })}
              className="h-7 flex-1 text-xs"
              placeholder="attribute name"
            />
            <Input
              value={attr.type}
              onChange={(e) => updateAttribute(attr.id, { type: e.target.value })}
              className="h-7 w-32 text-xs"
              placeholder="type"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => deleteAttribute(attr.id)}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            addAttribute();
          }}
          className="w-full gap-2 text-muted-foreground hover:text-foreground mt-2"
        >
          <Plus className="h-4 w-4" />
          Add Attribute
        </Button>
      </div>
    </div>
  );
};
