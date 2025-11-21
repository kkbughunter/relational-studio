import { useState, useEffect } from 'react';
import { X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Table, Relation as RelationType, RELATIONSHIP_ACTIONS } from '@/types/schema';
import { ExternalPathfinder } from '@/utils/externalPathfinding';
import { useSchemaStore } from '@/store/useSchemaStore';

interface RelationProps {
  relation: RelationType;
  sourceTable: Table;
  targetTable: Table;
  allTables: Table[];
  allRelations: RelationType[];
  selectedTableId?: string | null;
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
  allTables,
  allRelations,
  selectedTableId,
  isSelected,
  onSelect,
  onDelete,
  onUpdate,
  scale = 1,
}: RelationProps) => {
  const { globalRoutingMode } = useSchemaStore();
  const [showSettings, setShowSettings] = useState(false);
  const [draggingHandle, setDraggingHandle] = useState<'source' | 'target' | number | null>(null);
  const [tempWaypoints, setTempWaypoints] = useState<Array<{ x: number; y: number }>>(relation.waypoints || []);
  
  // Update temp waypoints when relation waypoints change
  useEffect(() => {
    setTempWaypoints(relation.waypoints || []);
  }, [relation.waypoints]);
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Safety check for required props
  if (!relation || !sourceTable || !targetTable) {
    return null;
  }

  const isTableSelected = sourceTable.id === selectedTableId || targetTable.id === selectedTableId;
  const strokeColor = isSelected ? 'hsl(var(--primary))' : (isHovered || isTableSelected) ? '#3B82F6' : '#6B7280';
  const strokeWidth = isSelected ? 3 : (isHovered || isTableSelected) ? 2.5 : 2;

  // Calculate offset for multiple relations from same column
  const getRelationOffset = (tableId: string, columnId: string, relationId: string) => {
    const sameColumnRelations = allRelations.filter(r => 
      (r.fromTableId === tableId && r.fromColumnId === columnId) ||
      (r.toTableId === tableId && r.toColumnId === columnId)
    );
    const index = sameColumnRelations.findIndex(r => r.id === relationId);
    const totalRelations = sameColumnRelations.length;
    
    if (totalRelations === 1) return 0;
    
    // Distribute relations above and below center
    const spacing = 12;
    const centerIndex = (totalRelations - 1) / 2;
    return (index - centerIndex) * spacing;
  };

  // Calculate column-specific anchor points
  const getColumnAnchorPoint = (table: Table, columnId: string) => {
    const width = 480;
    const headerHeight = 60;
    const columnHeight = 40;
    
    const columnIndex = table.columns.findIndex(col => col.id === columnId);
    if (columnIndex === -1) {
      // Fallback to table center if column not found
      const height = Math.max(120, headerHeight + table.columns.length * columnHeight);
      return { x: table.position.x + width / 2, y: table.position.y + height / 2 };
    }
    
    const paddingTop = 12; // p-3 = 12px padding
    const columnSpacing = 4; // space-y-1 = 4px gap
    const columnPadding = 16; // py-3 = 12px vertical padding per column
    const actualColumnHeight = 40 + columnPadding; // min-h-[40px] + py-3 padding
    const columnY = table.position.y + headerHeight + paddingTop + (columnIndex * (actualColumnHeight + columnSpacing)) + (actualColumnHeight / 2);
    
    // Determine which side to connect from based on table positions
    const sourceCenter = { x: sourceTable.position.x + width / 2, y: sourceTable.position.y + headerHeight / 2 };
    const targetCenter = { x: targetTable.position.x + width / 2, y: targetTable.position.y + headerHeight / 2 };
    
    const offset = getRelationOffset(table.id, columnId, relation.id);
    
    if (table === sourceTable) {
      // Connect from right side if target is to the right, otherwise from left
      const connectFromRight = targetCenter.x > sourceCenter.x;
      return {
        x: table.position.x + (connectFromRight ? width : 0),
        y: columnY + offset
      };
    } else {
      // Connect from left side if source is to the left, otherwise from right
      const connectFromLeft = sourceCenter.x < targetCenter.x;
      return {
        x: table.position.x + (connectFromLeft ? 0 : width),
        y: columnY + offset
      };
    }
  };

  let sourcePoint, targetPoint;
  try {
    sourcePoint = getColumnAnchorPoint(sourceTable, relation.fromColumnId);
    targetPoint = getColumnAnchorPoint(targetTable, relation.toColumnId);
    
    // Validate points
    if (!sourcePoint || !targetPoint || isNaN(sourcePoint.x) || isNaN(sourcePoint.y) || isNaN(targetPoint.x) || isNaN(targetPoint.y)) {
      return null;
    }
  } catch (error) {
    console.warn('Error calculating anchor points:', error);
    return null;
  }

  // Use waypoints from relation or temp waypoints during dragging
  const waypoints = draggingHandle !== null ? tempWaypoints : (relation.waypoints || []);

  // Calculate midpoint for controls
  const midX = (sourcePoint.x + targetPoint.x) / 2;
  const midY = (sourcePoint.y + targetPoint.y) / 2;

  // Get path based on routing mode
  const getPath = () => {
    const routingMode = relation.routingMode || globalRoutingMode;
    
    if (routingMode === 'manual') {
      if (waypoints.length > 0) {
        let path = `M ${sourcePoint.x} ${sourcePoint.y}`;
        waypoints.forEach(wp => {
          if (wp && !isNaN(wp.x) && !isNaN(wp.y)) {
            path += ` L ${wp.x} ${wp.y}`;
          }
        });
        return path + ` L ${targetPoint.x} ${targetPoint.y}`;
      }
      return `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`;
    }

    // Straight line connection with small horizontal segments at start and end
    const gap = 15;
    const sourceIsLeft = sourcePoint.x < targetPoint.x;
    const startX = sourceIsLeft ? sourcePoint.x + gap : sourcePoint.x - gap;
    const endX = sourceIsLeft ? targetPoint.x - gap : targetPoint.x + gap;
    
    return `M ${sourcePoint.x} ${sourcePoint.y} L ${startX} ${sourcePoint.y} L ${endX} ${targetPoint.y} L ${targetPoint.x} ${targetPoint.y}`;
  };

  let path;
  try {
    path = getPath();
  } catch (error) {
    console.warn('Error creating path:', error);
    path = `M ${sourcePoint.x} ${sourcePoint.y} L ${targetPoint.x} ${targetPoint.y}`;
  }

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
      const snappedX = Math.round(svgP.x / 20) * 20;
      const snappedY = Math.round(svgP.y / 20) * 20;
      newWaypoints[draggingHandle] = { x: snappedX, y: snappedY };
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
    // Add relationship type label on the middle of the line
    const labelX = (sourcePoint.x + targetPoint.x) / 2;
    const labelY = (sourcePoint.y + targetPoint.y) / 2;
    
    // Calculate positions outside tables
    const gap = 15;
    const sourceIsLeft = sourcePoint.x < targetPoint.x;
    const sourceMarkerX = sourceIsLeft ? sourcePoint.x + gap - 5 : sourcePoint.x - gap + 5;
    const targetMarkerX = sourceIsLeft ? targetPoint.x - gap + 5 : targetPoint.x + gap - 5;

    return (
      <>
        {/* Start line marker - show | for 1 side, N for many side */}
        {relation.type === '1:1' ? (
          <line
            x1={sourceMarkerX}
            y1={sourcePoint.y - 5}
            x2={sourceMarkerX}
            y2={sourcePoint.y + 5}
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ) : relation.type === '1:N' ? (
          <line
            x1={sourceMarkerX}
            y1={sourcePoint.y - 5}
            x2={sourceMarkerX}
            y2={sourcePoint.y + 5}
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ) : relation.type === 'N:1' ? (
          <g>
            <line
              x1={sourceMarkerX}
              y1={sourcePoint.y}
              x2={sourceMarkerX - 10}
              y2={sourcePoint.y - 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={sourceMarkerX}
              y1={sourcePoint.y}
              x2={sourceMarkerX - 10}
              y2={sourcePoint.y}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={sourceMarkerX}
              y1={sourcePoint.y}
              x2={sourceMarkerX - 10}
              y2={sourcePoint.y + 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ) : (
          <g>
            <line
              x1={sourceMarkerX}
              y1={sourcePoint.y}
              x2={sourceMarkerX - 10}
              y2={sourcePoint.y - 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={sourceMarkerX}
              y1={sourcePoint.y}
              x2={sourceMarkerX - 10}
              y2={sourcePoint.y}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={sourceMarkerX}
              y1={sourcePoint.y}
              x2={sourceMarkerX - 10}
              y2={sourcePoint.y + 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
        
        {/* End line marker - show | for 1 side, N for many side */}
        {relation.type === '1:1' ? (
          <line
            x1={targetMarkerX}
            y1={targetPoint.y - 5}
            x2={targetMarkerX}
            y2={targetPoint.y + 5}
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ) : relation.type === '1:N' ? (
          <g>
            <line
              x1={targetMarkerX}
              y1={targetPoint.y}
              x2={targetMarkerX + 10}
              y2={targetPoint.y - 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetMarkerX}
              y1={targetPoint.y}
              x2={targetMarkerX + 10}
              y2={targetPoint.y}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetMarkerX}
              y1={targetPoint.y}
              x2={targetMarkerX + 10}
              y2={targetPoint.y + 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        ) : relation.type === 'N:1' ? (
          <line
            x1={targetMarkerX}
            y1={targetPoint.y - 5}
            x2={targetMarkerX}
            y2={targetPoint.y + 5}
            stroke={strokeColor}
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        ) : (
          <g>
            <line
              x1={targetMarkerX}
              y1={targetPoint.y}
              x2={targetMarkerX + 10}
              y2={targetPoint.y - 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetMarkerX}
              y1={targetPoint.y}
              x2={targetMarkerX + 10}
              y2={targetPoint.y}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            <line
              x1={targetMarkerX}
              y1={targetPoint.y}
              x2={targetMarkerX + 10}
              y2={targetPoint.y + 6}
              stroke={strokeColor}
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
          </g>
        )}
        
        {/* Relationship type label */}
        <rect
          x={labelX - 15}
          y={labelY - 8}
          width="30"
          height="16"
          fill="white"
          stroke={strokeColor}
          strokeWidth="1"
          rx="3"
          className="cursor-pointer hover:fill-gray-100"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={(e) => {
            e.stopPropagation();
            setTooltipPosition({ x: labelX, y: labelY });
            setShowTooltip(true);
            onSelect();
          }}
        />
        <text
          x={labelX}
          y={labelY + 4}
          textAnchor="middle"
          fontSize="12"
          fill={strokeColor}
          fontWeight="bold"
          className="cursor-pointer pointer-events-none"
        >
          {relation.type}
        </text>
      </>
    );
  };

  return (
    <g 
      onMouseMove={handleMouseMove} 
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowTooltip(false);
      }}
      className="pointer-events-auto"
    >
      {/* Main path */}
      {/* Base path */}
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        className="cursor-pointer transition-all duration-200"
        pointerEvents="stroke"
        vectorEffect="non-scaling-stroke"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={(e) => {
          e.stopPropagation();
          const svg = (e.target as SVGElement).closest('svg');
          if (svg) {
            const pt = svg.createSVGPoint();
            pt.x = e.clientX;
            pt.y = e.clientY;
            const svgP = pt.matrixTransform(svg.getScreenCTM()?.inverse());
            setTooltipPosition({ x: svgP.x, y: svgP.y });
          }
          setShowTooltip(true);
          onSelect();
        }}
      />
      
      {/* Animated highlight overlay on hover */}
      {isHovered && (
        <path
          d={path}
          stroke="#60A5FA"
          strokeWidth={strokeWidth }
          strokeDasharray="12,8"
          fill="none"
          className="pointer-events-none"
          vectorEffect="non-scaling-stroke"
          style={{
            filter: 'drop-shadow(0 0 3px #60A5FA)'
          }}
        >
          <animate
            attributeName="stroke-dashoffset"
            values="0;20"
            dur="1s"
            repeatCount="indefinite"
          />
        </path>
      )}
      
      {/* Relationship notation */}
      {renderNotation()}
      
      {/* Waypoint handles - only in manual mode */}
      {isSelected && onUpdate && (relation.routingMode || globalRoutingMode) === 'manual' && waypoints.map((wp, index) => (
        <g key={index}>
          <circle
            cx={wp.x}
            cy={wp.y}
            r={8 / scale}
            fill="#3B82F6"
            stroke="white"
            strokeWidth={2 / scale}
            className="cursor-move hover:fill-blue-600"
            onMouseDown={(e) => handleMouseDown(e, index)}
          />
          <text
            x={wp.x}
            y={wp.y + 2 / scale}
            textAnchor="middle"
            fontSize={`${10 / scale}px`}
            fill="white"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            {index + 1}
          </text>
          <circle
            cx={wp.x + 15 / scale}
            cy={wp.y - 15 / scale}
            r={6 / scale}
            fill="#EF4444"
            stroke="white"
            strokeWidth={1 / scale}
            className="cursor-pointer hover:fill-red-600"
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveWaypoint(index);
            }}
          />
          <text
            x={wp.x + 15 / scale}
            y={wp.y - 12 / scale}
            textAnchor="middle"
            fontSize={`${8 / scale}px`}
            fill="white"
            fontWeight="bold"
            className="pointer-events-none select-none"
          >
            ×
          </text>
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
                        onValueChange={(value: '1:1' | '1:N' | 'N:1' | 'N:M') => updateRelation({ type: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-60 overflow-y-auto">
                          <SelectItem value="1:1">One-to-One (1:1)</SelectItem>
                          <SelectItem value="1:N">One-to-Many (1:N)</SelectItem>
                          <SelectItem value="N:1">Many-to-One (N:1)</SelectItem>
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
                    
                    <div>
                      <Label htmlFor="routing-mode">Routing Mode</Label>
                      <Select
                        value={relation.routingMode || 'auto'}
                        onValueChange={(value: 'auto' | 'manual') => updateRelation({ routingMode: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">Automatic</SelectItem>
                          <SelectItem value="manual">Manual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </foreignObject>
          )}
          
          {/* Add waypoint button - only in manual mode */}
          {onUpdate && (relation.routingMode || globalRoutingMode) === 'manual' && (
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
      
      {/* Tooltip */}
      {showTooltip && (
        <g>
          {/* Background */}
          <rect
            x={tooltipPosition.x - 80}
            y={tooltipPosition.y - 40}
            width="160"
            height="80"
            fill="white"
            stroke="#d1d5db"
            strokeWidth="1"
            rx="8"
            className="drop-shadow-lg"
          />
          
          {/* Relationship type buttons */}
          <foreignObject
            x={tooltipPosition.x - 75}
            y={tooltipPosition.y - 35}
            width="150"
            height="25"
          >
            <div className="flex gap-1">
              {['1:1', '1:N', 'N:1', 'N:M'].map((type) => (
                <button
                  key={type}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateRelation({ type: type as '1:1' | '1:N' | 'N:1' | 'N:M' });
                  }}
                  className={`px-2 py-1 text-xs rounded ${
                    relation.type === type
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </foreignObject>
          
          {/* Relationship info */}
          <foreignObject
            x={tooltipPosition.x - 75}
            y={tooltipPosition.y - 5}
            width="150"
            height="15"
          >
            <div className="text-xs text-gray-600">
              {relation.name || `${sourceTable.name}_${targetTable.name}`}
            </div>
          </foreignObject>
          
          {/* ON DELETE/UPDATE info */}
          <foreignObject
            x={tooltipPosition.x - 75}
            y={tooltipPosition.y + 10}
            width="150"
            height="15"
          >
            <div className="text-xs text-gray-500">
              DEL: {relation.onDelete} | UPD: {relation.onUpdate}
            </div>
          </foreignObject>
          
          {/* Action buttons */}
          <circle
            cx={tooltipPosition.x - 15}
            cy={tooltipPosition.y + 30}
            r="12"
            fill="white"
            stroke="#d1d5db"
            strokeWidth="1"
            className="cursor-pointer hover:fill-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              setShowSettings(true);
            }}
          />
          <foreignObject
            x={tooltipPosition.x - 21}
            y={tooltipPosition.y + 24}
            width="12"
            height="12"
            className="pointer-events-none"
          >
            <Settings className="h-3 w-3 text-gray-600" />
          </foreignObject>
          
          <circle
            cx={tooltipPosition.x + 15}
            cy={tooltipPosition.y + 30}
            r="12"
            fill="white"
            stroke="#d1d5db"
            strokeWidth="1"
            className="cursor-pointer hover:fill-red-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowTooltip(false);
              onDelete();
            }}
          />
          <foreignObject
            x={tooltipPosition.x + 9}
            y={tooltipPosition.y + 24}
            width="12"
            height="12"
            className="pointer-events-none"
          >
            <X className="h-3 w-3 text-red-600" />
          </foreignObject>
        </g>
      )}
    </g>
  );
};