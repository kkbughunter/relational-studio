import { useState, useRef } from "react";
import { Entity, EntityData } from "./Entity";
import { Relationship, RelationshipData, RelationshipType } from "./Relationship";

interface CanvasProps {
  entities: EntityData[];
  relationships: RelationshipData[];
  selectedEntityId: string | null;
  selectedRelationshipId: string | null;
  onSelectEntity: (id: string | null) => void;
  onSelectRelationship: (id: string | null) => void;
  onUpdateEntity: (entity: EntityData) => void;
  onDeleteEntity: (id: string) => void;
  onDeleteRelationship: (id: string) => void;
  selectedTool: "select" | "entity" | "relationship";
  relationshipType: RelationshipType;
  onCreateRelationship: (sourceId: string, targetId: string) => void;
}

export const Canvas = ({
  entities,
  relationships,
  selectedEntityId,
  selectedRelationshipId,
  onSelectEntity,
  onSelectRelationship,
  onUpdateEntity,
  onDeleteEntity,
  onDeleteRelationship,
  selectedTool,
  relationshipType,
  onCreateRelationship,
}: CanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [pendingRelationshipSource, setPendingRelationshipSource] = useState<string | null>(null);

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
      onSelectRelationship(null);
      setPendingRelationshipSource(null);
    }
  };

  const handleEntityClickForRelationship = (entityId: string) => {
    if (selectedTool === "relationship") {
      if (!pendingRelationshipSource) {
        setPendingRelationshipSource(entityId);
        onSelectEntity(entityId);
      } else if (pendingRelationshipSource !== entityId) {
        onCreateRelationship(pendingRelationshipSource, entityId);
        setPendingRelationshipSource(null);
        onSelectEntity(null);
      }
    } else {
      onSelectEntity(entityId);
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
      {/* SVG layer for relationships */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="hsl(var(--entity-header))" />
          </marker>
        </defs>
        {relationships.map((relationship) => {
          const sourceEntity = entities.find((e) => e.id === relationship.sourceEntityId);
          const targetEntity = entities.find((e) => e.id === relationship.targetEntityId);

          if (!sourceEntity || !targetEntity) return null;

          return (
            <g key={relationship.id} className="pointer-events-auto">
              <Relationship
                relationship={relationship}
                sourceEntity={sourceEntity}
                targetEntity={targetEntity}
                isSelected={relationship.id === selectedRelationshipId}
                onSelect={() => onSelectRelationship(relationship.id)}
                onDelete={() => onDeleteRelationship(relationship.id)}
              />
            </g>
          );
        })}
      </svg>

      {/* Entities layer */}
      {entities.map((entity) => (
        <Entity
          key={entity.id}
          entity={entity}
          isSelected={
            entity.id === selectedEntityId ||
            (selectedTool === "relationship" && entity.id === pendingRelationshipSource)
          }
          onSelect={() => handleEntityClickForRelationship(entity.id)}
          onUpdate={onUpdateEntity}
          onDelete={() => onDeleteEntity(entity.id)}
        />
      ))}

      {/* Help text */}
      {entities.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground pointer-events-none">
          <div className="text-center">
            <p className="text-lg font-medium mb-2">Click "Entity" and then click on the canvas to add entities</p>
            <p className="text-sm">Use the Relationship tool to connect entities</p>
          </div>
        </div>
      )}

      {pendingRelationshipSource && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg pointer-events-none z-50">
          Click on another entity to create a relationship
        </div>
      )}
    </div>
  );
};
