import { useState, useRef } from "react";
import { Entity, EntityData } from "./Entity";

interface CanvasProps {
  entities: EntityData[];
  selectedEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onUpdateEntity: (entity: EntityData) => void;
  onDeleteEntity: (id: string) => void;
  selectedTool: "select" | "entity";
}

export const Canvas = ({
  entities,
  selectedEntityId,
  onSelectEntity,
  onUpdateEntity,
  onDeleteEntity,
  selectedTool,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current && selectedTool === "entity") {
      const rect = canvasRef.current.getBoundingClientRect();
      const newEntity: EntityData = {
        id: `entity-${Date.now()}`,
        name: "NewEntity",
        x: e.clientX - rect.left - 125,
        y: e.clientY - rect.top - 50,
        attributes: [
          {
            id: `attr-${Date.now()}`,
            name: "id",
            type: "INT",
            isPrimaryKey: true,
          },
        ],
      };
      onUpdateEntity(newEntity);
      onSelectEntity(newEntity.id);
    } else if (e.target === canvasRef.current) {
      onSelectEntity(null);
    }
  };

  return (
    <div
      ref={canvasRef}
      className="flex-1 bg-canvas relative overflow-hidden"
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--canvas-grid)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--canvas-grid)) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
      onClick={handleCanvasClick}
    >
      {entities.map((entity) => (
        <Entity
          key={entity.id}
          entity={entity}
          isSelected={entity.id === selectedEntityId}
          onSelect={() => onSelectEntity(entity.id)}
          onUpdate={onUpdateEntity}
          onDelete={() => onDeleteEntity(entity.id)}
        />
      ))}

      {entities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Click "Entity" and then click on the canvas to add entities</p>
            <p className="text-sm">Or use the Select tool to interact with existing entities</p>
          </div>
        </div>
      )}
    </div>
  );
};
