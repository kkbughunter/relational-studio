import { EntityData } from "./Entity";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RelationshipType = "one-to-one" | "one-to-many" | "many-to-many";

export interface RelationshipData {
  id: string;
  sourceEntityId: string;
  targetEntityId: string;
  type: RelationshipType;
}

interface RelationshipProps {
  relationship: RelationshipData;
  sourceEntity: EntityData;
  targetEntity: EntityData;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const Relationship = ({
  relationship,
  sourceEntity,
  targetEntity,
  isSelected,
  onSelect,
  onDelete,
}: RelationshipProps) => {
  // Calculate center points of entities
  const sourceX = sourceEntity.x + 125; // Center of 250px wide entity
  const sourceY = sourceEntity.y + 50;
  const targetX = targetEntity.x + 125;
  const targetY = targetEntity.y + 50;

  // Calculate midpoint for the delete button
  const midX = (sourceX + targetX) / 2;
  const midY = (sourceY + targetY) / 2;

  // Create path
  const path = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;

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
            stroke="hsl(var(--entity-header))"
            strokeWidth="2"
          />
          {/* One side at target */}
          <line
            x1={targetNotationX - Math.sin(angle) * 8}
            y1={targetNotationY + Math.cos(angle) * 8}
            x2={targetNotationX + Math.sin(angle) * 8}
            y2={targetNotationY - Math.cos(angle) * 8}
            stroke="hsl(var(--entity-header))"
            strokeWidth="2"
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
            stroke="hsl(var(--entity-header))"
            strokeWidth="2"
          />
          {/* Many side at target (crow's foot) */}
          <g>
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 - Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 + Math.cos(angle) * 8}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 + Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 - Math.cos(angle) * 8}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15}
              y2={targetNotationY - Math.sin(angle) * 15}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
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
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
            <line
              x1={sourceNotationX}
              y1={sourceNotationY}
              x2={sourceNotationX + Math.cos(angle) * 15 + Math.sin(angle) * 8}
              y2={sourceNotationY + Math.sin(angle) * 15 - Math.cos(angle) * 8}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
            <line
              x1={sourceNotationX}
              y1={sourceNotationY}
              x2={sourceNotationX + Math.cos(angle) * 15}
              y2={sourceNotationY + Math.sin(angle) * 15}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
          </g>
          {/* Many side at target (crow's foot) */}
          <g>
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 - Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 + Math.cos(angle) * 8}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15 + Math.sin(angle) * 8}
              y2={targetNotationY - Math.sin(angle) * 15 - Math.cos(angle) * 8}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
            <line
              x1={targetNotationX}
              y1={targetNotationY}
              x2={targetNotationX - Math.cos(angle) * 15}
              y2={targetNotationY - Math.sin(angle) * 15}
              stroke="hsl(var(--entity-header))"
              strokeWidth="2"
            />
          </g>
        </>
      );
    }
  };

  return (
    <>
      <path
        d={path}
        stroke={isSelected ? "hsl(var(--primary))" : "hsl(var(--entity-header))"}
        strokeWidth={isSelected ? "3" : "2"}
        fill="none"
        className="cursor-pointer"
        onClick={onSelect}
      />
      {renderNotation()}
      
      {isSelected && (
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
      )}
    </>
  );
};
