import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table } from './Table';
import { Relation } from './Relation';
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
  const [pendingRelationSource, setPendingRelationSource] = useState<{
    tableId: string;
    columnId?: string;
  } | null>(null);
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

    if (!clickedTable) {
      setSelectedTable(null);
      setSelectedRelation(null);
      setPendingRelationSource(null);
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

  const handleTableClickForRelation = (tableId: string) => {
    if (selectedTool === 'relation') {
      if (!pendingRelationSource) {
        setPendingRelationSource({ tableId });
        setSelectedTable(tableId);
      } else if (pendingRelationSource.tableId !== tableId) {
        createRelation(pendingRelationSource.tableId, tableId);
        setPendingRelationSource(null);
        setSelectedTable(null);
      }
    } else {
      setSelectedTable(tableId);
    }
  };

  const handleColumnClickForRelation = (tableId: string, columnId: string) => {
    if (selectedTool !== 'relation') return;
    
    if (!pendingRelationSource) {
      setPendingRelationSource({ tableId, columnId });
      setSelectedTable(tableId);
      return;
    }
    
    if (pendingRelationSource.tableId === tableId && pendingRelationSource.columnId === columnId) {
      return;
    }
    
    createRelation(
      pendingRelationSource.tableId,
      tableId,
      pendingRelationSource.columnId,
      columnId
    );
    setPendingRelationSource(null);
    setSelectedTable(null);
  };

  const createRelation = (
    sourceTableId: string,
    targetTableId: string,
    sourceColumnId?: string,
    targetColumnId?: string
  ) => {
    const newRelation: RelationType = {
      id: `rel-${Date.now()}`,
      fromTableId: sourceTableId,
      toTableId: targetTableId,
      fromColumnId: sourceColumnId || '',
      toColumnId: targetColumnId || '',
      type: relationshipType,
      onDelete: 'NO ACTION',
      onUpdate: 'NO ACTION',
    };
    
    addRelation(newRelation);
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
            className="absolute inset-0 w-full h-full"
            style={{
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${canvasScale})`,
              transformOrigin: '0 0',
            }}
          >
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0, overflow: 'visible' }}>
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
                const sourceTable = tables.find((t) => t.id === relation.fromTableId);
                const targetTable = tables.find((t) => t.id === relation.toTableId);

                if (!sourceTable || !targetTable) return null;

                return (
                  <g key={relation.id} className="pointer-events-auto">
                    <Relation
                      relation={relation}
                      sourceTable={sourceTable}
                      targetTable={targetTable}
                      isSelected={relation.id === selectedRelationId}
                      onSelect={() => setSelectedRelation(relation.id)}
                      onDelete={() => deleteRelation(relation.id)}
                      onUpdate={updateRelation}
                      scale={canvasScale}
                    />
                  </g>
                );
              })}
            </svg>

            {tables.map((table) => (
              <Table
                key={table.id}
                table={table}
                isSelected={
                  table.id === selectedTableId ||
                  (selectedTool === 'relation' && table.id === pendingRelationSource?.tableId)
                }
                databaseType={databaseType}
                onSelect={() => handleTableClickForRelation(table.id)}
                onUpdate={updateTable}
                onDelete={() => deleteTable(table.id)}
                getWorldFromClient={clientToWorld}
                onColumnClick={(columnId) => handleColumnClickForRelation(table.id, columnId)}
              />
            ))}
          </div>

          {tables.length === 0 && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
              <div className="text-center">
                <p className="text-lg font-medium mb-2">
                  Click "Table" and then click on the canvas to add tables
                </p>
                <p className="text-sm mb-2">Use the Relation tool to connect tables</p>
                <p className="text-xs text-gray-400">
                  Mouse wheel to zoom • Drag to pan
                </p>
              </div>
            </div>
          )}

          {pendingRelationSource && (
            <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none z-50">
              Click on a table or column to complete the relationship
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
    </div>
  );
};