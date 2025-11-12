import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from './Table';
import { Relation } from './Relation';
import { RelationshipDialog } from './RelationshipDialog';
import { useSchemaStore } from '@/store/useSchemaStore';
import { Table as TableType, Relation as RelationType, DatabaseType } from '@/types/schema';

interface EnhancedCanvasProps {
  databaseType: DatabaseType;
}

export const EnhancedCanvas = ({ databaseType }: EnhancedCanvasProps) => {
  const {
    tables,
    relations,
    selectedTableId,
    selectedRelationId,
    selectedTool,
    relationshipType,
    globalRoutingMode,
    canvasOffset,
    canvasScale,
    setSelectedTable,
    setSelectedRelation,
    addTable,
    updateTable,
    deleteTable,
    addRelation,
    updateRelation,
    deleteRelation,
    setCanvasOffset,
    setCanvasScale,
  } = useSchemaStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [pendingRelation, setPendingRelation] = useState<{
    sourceTableId: string;
    sourceColumnId: string;
    targetTableId?: string;
    targetColumnId?: string;
    waypoints?: Array<{ x: number; y: number }>;
  } | null>(null);
  const [showRelationDialog, setShowRelationDialog] = useState(false);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  // Clamp to prevent panning beyond top and left boundaries
  const clampOffset = (x: number, y: number) => ({
    x: Math.min(x, 0), // Prevent panning beyond left edge
    y: Math.min(y, 0), // Prevent panning beyond top edge
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpaceDown(true);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpaceDown(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clickedTable = target.closest('[data-table-root="true"]');
    
    if (selectedTool === 'table' && !clickedTable) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const worldY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      
      const newTable: TableType = {
        id: `table-${Date.now()}`,
        name: 'new_table',
        position: { x: worldX - 140, y: worldY - 60 },
        columns: [
          {
            id: `col-${Date.now()}`,
            name: 'id',
            type: databaseType === 'postgresql' ? 'SERIAL' : 'INT',
            isPrimary: true,
            isForeign: false,
            isUnique: false,
            isNullable: false,
            isAutoIncrement: true,
          },
        ],
        color: '#3B82F6',
        description: '',
        indexes: [],
        constraints: [],
      };
      
      addTable(newTable);
      return;
    }

    // Handle waypoint creation in manual mode
    if (pendingRelation && !pendingRelation.targetTableId && globalRoutingMode === 'manual' && !clickedTable) {
      const rect = canvasRef.current!.getBoundingClientRect();
      let worldX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      let worldY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      
      // Snap to grid (20px grid)
      worldX = Math.round(worldX / 20) * 20;
      worldY = Math.round(worldY / 20) * 20;
      
      setPendingRelation({
        ...pendingRelation,
        waypoints: [...(pendingRelation.waypoints || []), { x: worldX, y: worldY }]
      });
      return;
    }

    if (!clickedTable) {
      setSelectedTable(null);
      setSelectedRelation(null);
      setPendingRelation(null);
    }
  };

  const clientToWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: clientX, y: clientY };
    return {
      x: (clientX - rect.left - canvasOffset.x) / canvasScale,
      y: (clientY - rect.top - canvasOffset.y) / canvasScale,
    };
  };

  const handleTableClick = (tableId: string) => {
    setSelectedTable(tableId);
  };

  const handleColumnClick = (columnId: string, tableId: string) => {
    if (!pendingRelation) {
      setPendingRelation({
        sourceTableId: tableId,
        sourceColumnId: columnId,
      });
    } else if (pendingRelation.sourceTableId !== tableId || pendingRelation.sourceColumnId !== columnId) {
      const sourceTable = tables.find(t => t.id === pendingRelation.sourceTableId);
      const targetTable = tables.find(t => t.id === tableId);
      const sourceColumn = sourceTable?.columns.find(c => c.id === pendingRelation.sourceColumnId);
      const targetColumn = targetTable?.columns.find(c => c.id === columnId);
      
      if (sourceTable && targetTable && sourceColumn && targetColumn) {
        setPendingRelation({
          ...pendingRelation,
          targetTableId: tableId,
          targetColumnId: columnId,
        });
        setShowRelationDialog(true);
      }
    } else {
      setPendingRelation(null);
    }
  };

  const createRelation = (type: '1:1' | '1:N' | 'N:M') => {
    if (!pendingRelation?.targetTableId || !pendingRelation?.targetColumnId || !pendingRelation?.sourceColumnId) return;
    
    const newRelation: RelationType = {
      id: `rel-${Date.now()}`,
      fromTableId: pendingRelation.sourceTableId,
      toTableId: pendingRelation.targetTableId,
      fromColumnId: pendingRelation.sourceColumnId,
      toColumnId: pendingRelation.targetColumnId,
      type,
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
      routingMode: globalRoutingMode,
      waypoints: pendingRelation.waypoints || [],
    };
    
    addRelation(newRelation);
    setPendingRelation(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const isPanTrigger = e.button === 1 || e.button === 2 || (e.button === 0 && isSpaceDown);
    if (!isPanTrigger) return;
    
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomIntensity = 0.001;
    const delta = -e.deltaY;
    const newScaleUnclamped = canvasScale * (1 + delta * zoomIntensity);
    const newScale = Math.min(3, Math.max(0.1, newScaleUnclamped));
    const scaleFactor = newScale / canvasScale;

    const newOffsetX = mouseX - (mouseX - canvasOffset.x) * scaleFactor;
    const newOffsetY = mouseY - (mouseY - canvasOffset.y) * scaleFactor;

    const clamped = clampOffset(newOffsetX, newOffsetY);
    setCanvasOffset(clamped);
    setCanvasScale(newScale);
  };

  const applyZoomAtPoint = (newScale: number, focalX: number, focalY: number) => {
    const clamped = Math.min(2, Math.max(0.25, newScale));
    const scaleFactor = clamped / canvasScale;
    const newOffsetX = focalX - (focalX - canvasOffset.x) * scaleFactor;
    const newOffsetY = focalY - (focalY - canvasOffset.y) * scaleFactor;
    const clampedOffset = clampOffset(newOffsetX, newOffsetY);
    setCanvasOffset(clampedOffset);
    setCanvasScale(clamped);
  };

  const zoomIn = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    applyZoomAtPoint(canvasScale * 1.1, centerX, centerY);
  };

  const zoomOut = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    applyZoomAtPoint(canvasScale / 1.1, centerX, centerY);
  };

  const resetZoom = () => {
    setCanvasScale(1);
    setCanvasOffset({ x: 0, y: 0 });
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isPanning || !panStart) return;
      const nextX = e.clientX - panStart.x;
      const nextY = e.clientY - panStart.y;
      const clamped = clampOffset(nextX, nextY);
      setCanvasOffset(clamped);
    };
    const onUp = () => setIsPanning(false);
    
    if (isPanning) {
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [isPanning, panStart]);

  return (
    <div className="flex-1 relative min-w-0 min-h-0 overflow-hidden">
      <div
        ref={canvasRef}
        data-canvas-root="true"
        className={`w-full h-full bg-gray-50 relative ${
          isPanning ? 'cursor-grabbing' : isSpaceDown ? 'cursor-grab' : ''
        }`}
        style={{
          backgroundImage: `
            linear-gradient(#e5e7eb 1px, transparent 1px),
            linear-gradient(90deg, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px',
        }}
        onClick={handleCanvasClick}
        onMouseDownCapture={handleMouseDown}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      >
          <div
            data-canvas-inner="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
              transformOrigin: '0 0',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, overflow: 'visible', pointerEvents: 'none' }}>
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#6B7280" />
                </marker>
              </defs>
              
              {relations.map((relation) => {
                try {
                  const sourceTable = tables.find((t) => t.id === relation.fromTableId);
                  const targetTable = tables.find((t) => t.id === relation.toTableId);

                  if (!sourceTable || !targetTable || !relation.fromColumnId || !relation.toColumnId) {
                    return null;
                  }

                  return (
                    <Relation
                      key={relation.id}
                      relation={relation}
                      sourceTable={sourceTable}
                      targetTable={targetTable}
                      allTables={tables}
                      allRelations={relations}
                      selectedTableId={selectedTableId}
                      isSelected={relation.id === selectedRelationId}
                      onSelect={() => setSelectedRelation(relation.id)}
                      onDelete={() => deleteRelation(relation.id)}
                      onUpdate={updateRelation}
                      scale={canvasScale}
                    />
                  );
                } catch (error) {
                  console.warn('Error rendering relation:', relation.id, error);
                  return null;
                }
              })}
              
              {/* Pending connection line */}
              {pendingRelation && !pendingRelation.targetTableId && (
                <g>
                  {/* Waypoint circles with numbers */}
                  {(pendingRelation.waypoints || []).map((wp, index) => (
                    <g key={index}>
                      <circle
                        cx={wp.x}
                        cy={wp.y}
                        r={8}
                        fill="#3B82F6"
                        stroke="white"
                        strokeWidth={2}
                        className="pointer-events-none"
                      />
                      <text
                        x={wp.x}
                        y={wp.y + 3}
                        textAnchor="middle"
                        fontSize="10"
                        fill="white"
                        fontWeight="bold"
                        className="pointer-events-none"
                      >
                        {index + 1}
                      </text>
                    </g>
                  ))}
                  
                  {/* Connection path */}
                  <path
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                    fill="none"
                    className="pointer-events-none"
                    ref={(path) => {
                      if (path && pendingRelation) {
                        const sourceTable = tables.find(t => t.id === pendingRelation.sourceTableId);
                        const sourceColumn = sourceTable?.columns.find(c => c.id === pendingRelation.sourceColumnId);
                        if (sourceTable && sourceColumn) {
                          const columnIndex = sourceTable.columns.findIndex(c => c.id === sourceColumn.id);
                          const sourceY = sourceTable.position.y + 60 + (columnIndex * 40) + 20;
                          const sourceX = sourceTable.position.x + 420;
                          
                          const handleMouseMove = (e: MouseEvent) => {
                            const rect = canvasRef.current?.getBoundingClientRect();
                            if (rect) {
                              const worldX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
                              const worldY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
                              
                              let pathStr = `M ${sourceX} ${sourceY}`;
                              (pendingRelation.waypoints || []).forEach(wp => {
                                pathStr += ` L ${wp.x} ${wp.y}`;
                              });
                              pathStr += ` L ${worldX} ${worldY}`;
                              
                              path.setAttribute('d', pathStr);
                            }
                          };
                          
                          document.addEventListener('mousemove', handleMouseMove);
                          return () => document.removeEventListener('mousemove', handleMouseMove);
                        }
                      }
                    }}
                  />
                </g>
              )}
            </svg>

            {tables.map((table) => {
              const connectedColumns = relations
                .filter(rel => rel.fromTableId === table.id || rel.toTableId === table.id)
                .map(rel => rel.fromTableId === table.id ? rel.fromColumnId : rel.toColumnId)
                .filter(Boolean);
              
              return (
                <div key={table.id} className="pointer-events-auto relative" style={{ zIndex: 10 }}>
                  <Table
                    table={table}
                    isSelected={
                      table.id === selectedTableId ||
                      table.id === pendingRelation?.sourceTableId
                    }
                    databaseType={databaseType}
                    onSelect={() => handleTableClick(table.id)}
                    onUpdate={updateTable}
                    onDelete={() => deleteTable(table.id)}
                    getWorldFromClient={clientToWorld}
                    onColumnClick={handleColumnClick}
                    connectedColumns={connectedColumns}
                  />
                </div>
              );
            })}
          </div>

          {tables.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">
                  Click "Table" and then click on the canvas to add tables
                </p>
                <p className="text-sm mb-2">Click column connection points to create relationships</p>
                <p className="text-xs text-gray-400">
                  Mouse wheel to zoom • Drag to pan
                </p>
              </div>
            </div>
          )}

          {pendingRelation && !pendingRelation.targetTableId && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none z-50">
              {globalRoutingMode === 'manual' 
                ? `Click to add waypoints (${(pendingRelation.waypoints || []).length} added), then click another column to finish`
                : 'Click on another column to create relationship'
              }
            </div>
          )}
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-white border border-gray-300 rounded-md shadow-lg px-2 py-1 z-50">
        <Button variant="ghost" size="sm" onClick={zoomOut} className="h-8 w-8 p-0" title="Zoom Out">
          −
        </Button>
        <div className="text-sm w-16 text-center select-none" title="Current Zoom Level">
          {Math.round(canvasScale * 100)}%
        </div>
        <Button variant="ghost" size="sm" onClick={zoomIn} className="h-8 w-8 p-0" title="Zoom In">
          +
        </Button>
        <Button variant="ghost" size="sm" onClick={resetZoom} className="h-8 px-2" title="Reset Zoom">
          Reset
        </Button>
      </div>
      
      <div className="absolute bottom-4 left-4 bg-white border border-gray-300 rounded-md shadow-lg px-3 py-2 z-50 text-xs text-gray-600">
        <div>Mouse Wheel: Zoom in/out</div>
        <div>Space+Drag: Pan view</div>
        <div>Drag: Pan view</div>
      </div>
      
      {pendingRelation?.targetTableId && (
        <RelationshipDialog
          isOpen={showRelationDialog}
          onClose={() => {
            setShowRelationDialog(false);
            setPendingRelation(null);
          }}
          onSelect={createRelation}
          sourceTable={tables.find(t => t.id === pendingRelation.sourceTableId)?.name || ''}
          targetTable={tables.find(t => t.id === pendingRelation.targetTableId)?.name || ''}
          sourceColumn={tables.find(t => t.id === pendingRelation.sourceTableId)?.columns.find(c => c.id === pendingRelation.sourceColumnId)?.name || ''}
          targetColumn={tables.find(t => t.id === pendingRelation.targetTableId)?.columns.find(c => c.id === pendingRelation.targetColumnId)?.name || ''}
        />
      )}
    </div>
  );
};