import { useState } from "react";
import { EntityData } from "./Entity";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RelationshipType = "one-to-one" | "one-to-many" | "many-to-many";

export interface RelationshipData {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationshipType;
  sourceAttributeId?: string;
  targetAttributeId?: string;
  sourceAnchor?: { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number };
  targetAnchor?: { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number };
  waypoints?: Array<{ x: number; y: number }>;
}

interface RelationshipProps {
  relationship: RelationshipData;
  sourceEntity: EntityData;
  targetEntity: EntityData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate?: (relationship: RelationshipData) => void;
  scale?: number;
}

export const Relationship = ({
  relationship,
  sourceEntity,
  targetEntity,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  scale = 1,
}: RelationshipProps) => {
  const strokeColor = isSelected ? "hsl(var(--primary))" : "hsl(var(--entity-header))";

  // Local drag state for endpoints and optional intermediate waypoints
  const [draggingHandle, setDraggingHandle] = useState<'source' | 'target' | number | null>(null);
  const [tempWaypoints, setTempWaypoints] = useState<Array<{ x: number; y: number }>>(relationship.waypoints || []);

  // Compute an anchor point on an entity box by side and offset (0..1)
  const getAnchorPoint = (
    entity: EntityData,
    anchor?: { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number }
  ) => {
    const width = 250;
    const height = 100;
    const offset = anchor?.offset ?? 0.5;
    if (!anchor) {
      return { x: entity.x + width / 2, y: entity.y + height / 2 };
    }
    switch (anchor.side) {
      case 'top':
        return { x: entity.x + width * offset, y: entity.y };
      case 'bottom':
        return { x: entity.x + width * offset, y: entity.y + height };
      case 'left':
        return { x: entity.x, y: entity.y + height * offset };
      case 'right':
        return { x: entity.x + width, y: entity.y + height * offset };
    }
  };

  // Choose a reasonable edge point if no explicit anchor is set
  const calculateEdgePoint = (
    fromEntity: EntityData,
    toEntity: EntityData,
    customAnchor?: { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number }
  ) => {
    // If a custom anchor is provided, respect it. Otherwise, default to the TOP edge centered.
    if (customAnchor) return getAnchorPoint(fromEntity, customAnchor);
    return getAnchorPoint(fromEntity, { side: 'top', offset: 0.5 });

    // Unreachable, but keeps function explicit if default handling changes later
    // return { x: fromEntity.x + 125, y: fromEntity.y + 50 };
  };
  // Calculate anchor points. If attribute anchors exist, connect to them; else connect entity centers.
  const sourceAnchorEl = relationship.sourceAttributeId
    ? document.getElementById(`attr-anchor-${relationship.sourceEntityId}-${relationship.sourceAttributeId}`)
    : null;
  const targetAnchorEl = relationship.targetAttributeId
    ? document.getElementById(`attr-anchor-${relationship.targetEntityId}-${relationship.targetAttributeId}`)
    : null;

  let sourcePoint = calculateEdgePoint(sourceEntity, targetEntity, relationship.sourceAnchor);
  let targetPoint = calculateEdgePoint(targetEntity, sourceEntity, relationship.targetAnchor);

  // Override with attribute anchors if they exist
  if (sourceAnchorEl) {
    const rect = sourceAnchorEl.getBoundingClientRect();
    const inner = sourceAnchorEl.closest('[data-canvas-inner="true"]') as HTMLElement | null;
    if (inner) {
      const innerRect = inner.getBoundingClientRect();
      sourcePoint = {
        x: (rect.left - innerRect.left) / scale,
        y: (rect.top - innerRect.top) / scale,
      };
    }
  }
  if (targetAnchorEl) {
    const rect = targetAnchorEl.getBoundingClientRect();
    const inner = targetAnchorEl.closest('[data-canvas-inner="true"]') as HTMLElement | null;
    if (inner) {
      const innerRect = inner.getBoundingClientRect();
      targetPoint = {
        x: (rect.left - innerRect.left) / scale,
        y: (rect.top - innerRect.top) / scale,
      };
    }
  }

  const sourceX = sourcePoint.x;
  const sourceY = sourcePoint.y;
  const targetX = targetPoint.x;
  const targetY = targetPoint.y;

  // Use waypoints if they exist
  const waypoints = (tempWaypoints.length > 0 ? tempWaypoints : (relationship.waypoints || []));

  // Calculate midpoint for the delete button and add waypoint button
  let midX, midY;
  if (waypoints.length > 0) {
    const midIndex = Math.floor(waypoints.length / 2);
    midX = waypoints[midIndex].x;
    midY = waypoints[midIndex].y;
  } else {
    midX = (sourceX + targetX) / 2;
    midY = (sourceY + targetY) / 2;
  }

  // Create path with waypoints
  let path = `M ${sourceX} ${sourceY}`;
  waypoints.forEach(wp => {
    path += ` L ${wp.x} ${wp.y}`;
  });
  path += ` L ${targetX} ${targetY}`;

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent, type: 'source' | 'target' | number) => {
    e.stopPropagation();
    setDraggingHandle(type);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingHandle === null || !onUpdate) return;
    
    const svg = (e.target as Element).closest('svg');
    if (!svg) return;
    
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    
    if (draggingHandle === 'source' || draggingHandle === 'target') {
      const entity = draggingHandle === 'source' ? sourceEntity : targetEntity;
      const width = 250;
      const height = 100;
      
      // Determine which side and offset
      const relX = svgP.x - entity.x;
      const relY = svgP.y - entity.y;
      
      let side: 'top' | 'right' | 'bottom' | 'left';
      let offset: number;
      
      const distToTop = Math.abs(relY);
      const distToBottom = Math.abs(relY - height);
      const distToLeft = Math.abs(relX);
      const distToRight = Math.abs(relX - width);
      
      const minDist = Math.min(distToTop, distToBottom, distToLeft, distToRight);
      
      if (minDist === distToTop) {
        side = 'top';
        offset = Math.max(0, Math.min(1, relX / width));
      } else if (minDist === distToBottom) {
        side = 'bottom';
        offset = Math.max(0, Math.min(1, relX / width));
      } else if (minDist === distToLeft) {
        side = 'left';
        offset = Math.max(0, Math.min(1, relY / height));
      } else {
        side = 'right';
        offset = Math.max(0, Math.min(1, relY / height));
      }
      
      onUpdate({
        ...relationship,
        [draggingHandle === 'source' ? 'sourceAnchor' : 'targetAnchor']: { side, offset }
      });
    } else if (typeof draggingHandle === 'number') {
      const newWaypoints = [...waypoints];
      newWaypoints[draggingHandle] = { x: svgP.x, y: svgP.y };
      setTempWaypoints(newWaypoints);
    }
  };

  const handleMouseUp = () => {
    if (draggingHandle !== null && typeof draggingHandle === 'number' && onUpdate) {
      onUpdate({
        ...relationship,
        waypoints: tempWaypoints
      });
    }
    setDraggingHandle(null);
  };

  const handleAddWaypoint = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdate) return;
    
    const newWaypoints = [...waypoints, { x: midX, y: midY }];
    setTempWaypoints(newWaypoints);
    onUpdate({
      ...relationship,
      waypoints: newWaypoints
    });
  };

  const handleRemoveWaypoint = (index: number) => {
    if (!onUpdate) return;
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setTempWaypoints(newWaypoints);
    onUpdate({
      ...relationship,
      waypoints: newWaypoints
    });
  };

  // Render different notations based on relationship type
  const renderNotation = () => {
    const angle = Math.atan2(targetY - sourceY, targetX - sourceX);
    const distance = Math.sqrt(Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2));
    
    // Source side notation (always "many" or "one")
    const sourceNotationX = sourceX + Math.cos(angle) * 30;
    const sourceNotationY = sourceY + Math.sin(angle) * 30;
    
    // Target side notation
    const targetNotationX = targetX - Math.cos(angle) * 30;
    const targetNotationY = targetY - Math.sin(angle) * 30;

    if (relationship.type === "one-to-one") {
      return (
        <>
          {/* One side at source */}
          <line
            x1={sourceNotationX - Math.sin(angle) * 8}
            y1={sourceNotationY + Math.cos(angle) * 8}
            x2={sourceNotationX + Math.sin(angle) * 8}
            y2={sourceNotationY - Math.cos(angle) * 8}
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* One side at target */}
          <line
            x1={targetNotationX - Math.sin(angle) * 8}
            y1={targetNotationY + Math.cos(angle) * 8}
            x2={targetNotationX + Math.sin(angle) * 8}
            y2={targetNotationY - Math.cos(angle) * 8}
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </>
      );
    } else if (relationship.type === "one-to-many") {
      return (
        <>
          {/* One side at source */}
          <line
            x1={sourceNotationX - Math.sin(angle) * 8}
            y1={sourceNotationY + Math.cos(angle) * 8}
            x2={sourceNotationX + Math.sin(angle) * 8}
            y2={sourceNotationY - Math.cos(angle) * 8}
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          {/* Many side at target (crow's foot) */}
          <g>
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 - Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 + Math.cos(angle) * 8}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 + Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 - Math.cos(angle) * 8}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15}
              y2={targetNotationY - Math.sin(angle) * 15}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </>
      );
    } else if (relationship.type === "many-to-many") {
      return (
        <>
          {/* Many side at source (crow's foot) */}
          <g>
            <line
              x1={sourceNotationX}
              y1={sourceNotationY}
              x2={sourceNotationX + Math.cos(angle) * 15 - Math.sin(angle) * 8}
              y2={sourceNotationY + Math.sin(angle) * 15 + Math.cos(angle) * 8}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={sourceNotationX}
              y1={sourceNotationY}
              x2={sourceNotationX + Math.cos(angle) * 15 + Math.sin(angle) * 8}
              y2={sourceNotationY + Math.sin(angle) * 15 - Math.cos(angle) * 8}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={sourceNotationX}
              y1={sourceNotationY}
              x2={sourceNotationX + Math.cos(angle) * 15}
              y2={sourceNotationY + Math.sin(angle) * 15}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
          {/* Many side at target (crow's foot) */}
          <g>
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 - Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 + Math.cos(angle) * 8}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 + Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 - Math.cos(angle) * 8}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15}
              y2={targetNotationY - Math.sin(angle) * 15}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        </>
      );
    }
  };

  return (
    <g onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={isSelected ? "3" : "2"}
        fill="none"
        className="cursor-pointer"
        pointerEvents="stroke"
        vectorEffect="non-scaling-stroke"
        markerEnd="url(#arrowhead)"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />
      {renderNotation()}
      
      {/* Connection handles for alignment */}
      {isSelected && onUpdate && (
        <>
          {/* Source handle */}
          <circle
            cx={sourceX}
            cy={sourceY}
            r={6 / scale}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={2 / scale}
            className="cursor-move"
            onMouseDown={(e) => handleMouseDown(e, 'source')}
          />
          
          {/* Target handle */}
          <circle
            cx={targetX}
            cy={targetY}
            r={6 / scale}
            fill="hsl(var(--primary))"
            stroke="white"
            strokeWidth={2 / scale}
            className="cursor-move"
            onMouseDown={(e) => handleMouseDown(e, 'target')}
          />
          
          {/* Waypoint handles */}
          {waypoints.map((wp, index) => (
            <g key={index}>
              <circle
                cx={wp.x}
                cy={wp.y}
                r={6 / scale}
                fill="hsl(var(--accent))"
                stroke="white"
                strokeWidth={2 / scale}
                className="cursor-move"
                onMouseDown={(e) => handleMouseDown(e, index)}
              />
              {/* Remove waypoint button */}
              <circle
                cx={wp.x + 12 / scale}
                cy={wp.y - 12 / scale}
                r={4 / scale}
                fill="hsl(var(--destructive))"
                className="cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveWaypoint(index);
                }}
              />
            </g>
          ))}
        </>
      )}
      
      {isSelected && (
        <>
          {/* Delete button */}
          <foreignObject
            x={midX - 12}
            y={midY - 12}
            width="24"
            height="24"
          >
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="h-6 w-6 p-0 rounded-full"
            >
              <X className="h-3 w-3" />
            </Button>
          </foreignObject>
          
          {/* Add waypoint button */}
          {onUpdate && (
            <foreignObject
              x={midX + 16}
              y={midY - 12}
              width="24"
              height="24"
            >
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAddWaypoint}
                className="h-6 w-6 p-0 rounded-full"
                title="Add waypoint"
              >
                +
              </Button>
            </foreignObject>
          )}
        </>
      )}
    </g>
  );
};
