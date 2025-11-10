import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
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
  onCreateRelationship: (
    sourceEntityId: string,
    targetEntityId: string,
    sourceAttributeId?: string,
    targetAttributeId?: string
  ) => void;
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
  const [pendingRelationshipSource, setPendingRelationshipSource] = useState<{
    entityId: string;
    attributeId?: string;
  } | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [scale, setScale] = useState<number>(1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") setIsSpaceDown(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clickedEntity = target.closest('[data-entity-root="true"]');
    if (selectedTool === "entity" && !clickedEntity) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - offset.x) / scale;
      const worldY = (e.clientY - rect.top - offset.y) / scale;
      const newEntity: EntityData = {
        id: `entity-${Date.now()}`,
        name: "NewEntity",
        x: worldX - 125,
        y: worldY - 50,
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
      return;
    }

    if (!clickedEntity) {
      onSelectEntity(null);
      onSelectRelationship(null);
      setPendingRelationshipSource(null);
    }
  };

  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: (clientX - rect.left - offset.x) / scale,
      y: (clientY - rect.top - offset.y) / scale,
    };
  };

  const handleEntityClickForRelationship = (entityId: string) => {
    if (selectedTool === "relationship") {
      if (!pendingRelationshipSource) {
        setPendingRelationshipSource({ entityId });
        onSelectEntity(entityId);
      } else if (pendingRelationshipSource.entityId !== entityId) {
        onCreateRelationship(pendingRelationshipSource.entityId, entityId, pendingRelationshipSource.attributeId, undefined);
        setPendingRelationshipSource(null);
        onSelectEntity(null);
      }
    } else {
      onSelectEntity(entityId);
    }
  };

  const handleAttributeClickForRelationship = (entityId: string, attributeId: string) => {
    if (selectedTool !== "relationship") return;
    if (!pendingRelationshipSource) {
      setPendingRelationshipSource({ entityId, attributeId });
      onSelectEntity(entityId);
      return;
    }
    if (pendingRelationshipSource.entityId === entityId && pendingRelationshipSource.attributeId === attributeId) {
      return;
    }
    onCreateRelationship(
      pendingRelationshipSource.entityId,
      entityId,
      pendingRelationshipSource.attributeId,
      attributeId
    );
    setPendingRelationshipSource(null);
    onSelectEntity(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    if (e.button === 1 || (e.button === 0 && isSpaceDown)) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomIntensity = 0.0015;
    const delta = -e.deltaY;
    const newScaleUnclamped = scale * (1 + delta * zoomIntensity);
    const newScale = Math.min(2, Math.max(0.25, newScaleUnclamped));
    const scaleFactor = newScale / scale;

    // Adjust offset so that the point under cursor remains fixed
    const newOffsetX = mouseX - (mouseX - offset.x) * scaleFactor;
    const newOffsetY = mouseY - (mouseY - offset.y) * scaleFactor;

    setOffset({ x: newOffsetX, y: newOffsetY });
    setScale(newScale);
  };

  const applyZoomAtPoint = (newScale: number, focalX: number, focalY: number) => {
    const clamped = Math.min(2, Math.max(0.25, newScale));
    const scaleFactor = clamped / scale;
    const newOffsetX = focalX - (focalX - offset.x) * scaleFactor;
    const newOffsetY = focalY - (focalY - offset.y) * scaleFactor;
    setOffset({ x: newOffsetX, y: newOffsetY });
    setScale(clamped);
  };

  const zoomIn = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    applyZoomAtPoint(scale * 1.1, centerX, centerY);
  };

  const zoomOut = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    applyZoomAtPoint(scale / 1.1, centerX, centerY);
  };

  const resetZoom = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    applyZoomAtPoint(1, centerX, centerY);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isPanning || !panStart) return;
      setOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    };
    const onUp = () => setIsPanning(false);
    if (isPanning) {
      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    }
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [isPanning, panStart]);

  return (
    <div
      ref={canvasRef}
      data-canvas-root="true"
      className={`flex-1 bg-canvas relative overflow-hidden ${isPanning ? "cursor-grabbing" : isSpaceDown ? "cursor-grab" : ""}`}
      style={{
        backgroundImage: `
          linear-gradient(hsl(var(--canvas-grid)) 1px, transparent 1px),
          linear-gradient(90deg, hsl(var(--canvas-grid)) 1px, transparent 1px)
        `,
        backgroundSize: "20px 20px",
      }}
      onClick={handleCanvasClick}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
    >
      <div
        data-canvas-inner="true"
        className="absolute inset-0"
        style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transformOrigin: "0 0" }}
      >
        {/* SVG layer for relationships */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0, overflow: "visible" }}>
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
                scale={scale}
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
              (selectedTool === "relationship" && entity.id === pendingRelationshipSource?.entityId)
            }
            onSelect={() => handleEntityClickForRelationship(entity.id)}
            onUpdate={onUpdateEntity}
            onDelete={() => onDeleteEntity(entity.id)}
            getWorldFromClient={clientToWorld}
            onAttributeClick={(attributeId) => handleAttributeClickForRelationship(entity.id, attributeId)}
          />
        ))}
      </div>

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
          Click on an attribute to complete the relationship
        </div>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-card border border-border rounded-md shadow-lg px-2 py-1 z-50">
        <Button variant="ghost" size="sm" onClick={zoomOut} className="h-8 w-8 p-0">
          −
        </Button>
        <div className="text-sm w-16 text-center select-none">{Math.round(scale * 100)}%</div>
        <Button variant="ghost" size="sm" onClick={zoomIn} className="h-8 w-8 p-0">
          +
        </Button>
        <Button variant="ghost" size="sm" onClick={resetZoom} className="h-8 px-2">
          Reset
        </Button>
      </div>
    </div>
  );
};
