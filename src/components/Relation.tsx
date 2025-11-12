import { useState } from 'react';
import { X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, Relation as RelationType, RELATIONSHIP_ACTIONS } from '@/types/schema';

interface RelationProps {
  relation: RelationType;
  sourceTable: Table;
  targetTable: Table;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate?: (relation: RelationType) => void;
  scale?: number;
}

export const Relation = ({
  relation,
  sourceTable,
  targetTable,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  scale = 1,
}: RelationProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState<'source' | 'target' | number | null>(null);
  const [tempWaypoints, setTempWaypoints] = useState<Array<{ x: number; y: number }>>(relation.waypoints || []);

  const strokeColor = isSelected ? 'hsl(var(--primary))' : '#6B7280';
  const strokeWidth = isSelected ? 3 : 2;

  // Calculate anchor points
  const getAnchorPoint = (
    table: Table,
    anchor?: { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number }
  ) => {
    const width = 280;
    const height = Math.max(120, 60 + table.columns.length * 32);
    const offset = anchor?.offset ?? 0.5;
    
    if (!anchor) {
      return { x: table.position.x + width / 2, y: table.position.y + height / 2 };
    }
    
    switch (anchor.side) {
      case 'top':
        return { x: table.position.x + width * offset, y: table.position.y };
      case 'bottom':
        return { x: table.position.x + width * offset, y: table.position.y + height };
      case 'left':
        return { x: table.position.x, y: table.position.y + height * offset };
      case 'right':
        return { x: table.position.x + width, y: table.position.y + height * offset };
    }
  };

  const sourcePoint = getAnchorPoint(sourceTable, relation.sourceAnchor);
  const targetPoint = getAnchorPoint(targetTable, relation.targetAnchor);

  // Use waypoints if they exist
  const waypoints = tempWaypoints.length > 0 ? tempWaypoints : (relation.waypoints || []);

  // Calculate midpoint for controls
  let midX, midY;
  if (waypoints.length > 0) {
    const midIndex = Math.floor(waypoints.length / 2);
    midX = waypoints[midIndex].x;
    midY = waypoints[midIndex].y;
  } else {
    midX = (sourcePoint.x + targetPoint.x) / 2;
    midY = (sourcePoint.y + targetPoint.y) / 2;
  }

  // Create path with waypoints
  let path = `M ${sourcePoint.x} ${sourcePoint.y}`;
  waypoints.forEach(wp => {
    path += ` L ${wp.x} ${wp.y}`;
  });
  path += ` L ${targetPoint.x} ${targetPoint.y}`;

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
    
    if (typeof draggingHandle === 'number') {
      const newWaypoints = [...waypoints];
      newWaypoints[draggingHandle] = { x: svgP.x, y: svgP.y };
      setTempWaypoints(newWaypoints);
    }
  };

  const handleMouseUp = () => {
    if (draggingHandle !== null && typeof draggingHandle === 'number' && onUpdate) {
      onUpdate({
        ...relation,
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
      ...relation,
      waypoints: newWaypoints
    });
  };

  const handleRemoveWaypoint = (index: number) => {
    if (!onUpdate) return;
    const newWaypoints = waypoints.filter((_, i) => i !== index);
    setTempWaypoints(newWaypoints);
    onUpdate({
      ...relation,
      waypoints: newWaypoints
    });
  };

  const updateRelation = (updates: Partial<RelationType>) => {
    if (onUpdate) {
      onUpdate({ ...relation, ...updates });
    }
  };

  // Render relationship notation
  const renderNotation = () => {
    const angle = Math.atan2(targetPoint.y - sourcePoint.y, targetPoint.x - sourcePoint.x);
    
    // Source side notation
    const sourceNotationX = sourcePoint.x + Math.cos(angle) * 30;
    const sourceNotationY = sourcePoint.y + Math.sin(angle) * 30;
    
    // Target side notation
    const targetNotationX = targetPoint.x - Math.cos(angle) * 30;
    const targetNotationY = targetPoint.y - Math.sin(angle) * 30;

    if (relation.type === '1:1') {
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
    } else if (relation.type === '1:N') {
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
    } else if (relation.type === 'N:M') {
      return (
        <>
          {/* Many side at source */}
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
          {/* Many side at target */}
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
      {/* Main path */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        className="cursor-pointer"
        pointerEvents="stroke"
        vectorEffect="non-scaling-stroke"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />
      
      {/* Relationship notation */}
      {renderNotation()}
      
      {/* Waypoint handles */}
      {isSelected && onUpdate && waypoints.map((wp, index) => (
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
      
      {/* Controls when selected */}
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
          
          {/* Settings button */}
          {onUpdate && (
            <foreignObject
              x={midX + 16}
              y={midY - 12}
              width="24"
              height="24"
            >
              <Popover open={showSettings} onOpenChange={setShowSettings}>
                <PopoverTrigger asChild>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-6 w-6 p-0 rounded-full"
                  >
                    <Settings className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="relation-name">Relationship Name</Label>
                      <Input
                        id="relation-name"
                        value={relation.name || ''}
                        onChange={(e) => updateRelation({ name: e.target.value })}
                        placeholder="Optional relationship name"
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="relation-type">Type</Label>
                      <Select
                        value={relation.type}
                        onValueChange={(value: '1:1' | '1:N' | 'N:M') => updateRelation({ type: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1:1">One-to-One (1:1)</SelectItem>
                          <SelectItem value="1:N">One-to-Many (1:N)</SelectItem>
                          <SelectItem value="N:M">Many-to-Many (N:M)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="on-delete">On Delete</Label>
                      <Select
                        value={relation.onDelete}
                        onValueChange={(value: typeof relation.onDelete) => updateRelation({ onDelete: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_ACTIONS.map((action) => (
                            <SelectItem key={action} value={action}>
                              {action}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="on-update">On Update</Label>
                      <Select
                        value={relation.onUpdate}
                        onValueChange={(value: typeof relation.onUpdate) => updateRelation({ onUpdate: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RELATIONSHIP_ACTIONS.map((action) => (
                            <SelectItem key={action} value={action}>
                              {action}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </foreignObject>
          )}
          
          {/* Add waypoint button */}
          {onUpdate && (
            <foreignObject
              x={midX - 40}
              y={midY - 12}
              width="24"
              height="24"
            >
              <Button
                variant="outline"
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