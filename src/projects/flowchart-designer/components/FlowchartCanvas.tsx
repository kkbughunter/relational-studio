import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FlowchartNode } from './FlowchartNode';
import { FlowchartConnection } from './FlowchartConnection';
import { useFlowchartStore } from '@/projects/flowchart-designer/store/useFlowchartStore';
import { FlowchartNode as FlowchartNodeType, Connection as ConnectionType } from '@/projects/flowchart-designer/types/flowchart';
import { Info } from 'lucide-react';

export const FlowchartCanvas = () => {
  const {
    nodes,
    connections,
    selectedNodeId,
    selectedConnectionId,
    selectedTool,
    selectedNodeType,
    globalRoutingMode,
    canvasOffset,
    canvasScale,
    setSelectedNode,
    setSelectedConnection,
    addNode,
    updateNode,
    deleteNode,
    addConnection,
    updateConnection,
    deleteConnection,
    setCanvasOffset,
    setCanvasScale,
  } = useFlowchartStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [pendingConnection, setPendingConnection] = useState<{
    sourceNodeId: string;
    sourcePort: 'top' | 'right' | 'bottom' | 'left';
    targetNodeId?: string;
    targetPort?: 'top' | 'right' | 'bottom' | 'left';
    waypoints?: Array<{ x: number; y: number }>;
  } | null>(null);
  const [isSpaceDown, setIsSpaceDown] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);

  const clampOffset = (x: number, y: number) => ({
    x: Math.min(x, 0),
    y: Math.min(y, 0),
  });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') setIsSpaceDown(true);
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          deleteNode(selectedNodeId);
        } else if (selectedConnectionId) {
          deleteConnection(selectedConnectionId);
        }
      }
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
  }, [selectedNodeId, selectedConnectionId, deleteNode, deleteConnection]);

  const handleCanvasClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const clickedNode = target.closest('[data-node-root="true"]');
    
    if (selectedTool === 'node' && !clickedNode) {
      const rect = canvasRef.current!.getBoundingClientRect();
      const worldX = (e.clientX - rect.left - canvasOffset.x) / canvasScale;
      const worldY = (e.clientY - rect.top - canvasOffset.y) / canvasScale;
      
      const newNode: FlowchartNodeType = {
        id: `node-${Date.now()}`,
        type: selectedNodeType,
        label: selectedNodeType === 'start' ? 'Start' : 
               selectedNodeType === 'end' ? 'End' :
               selectedNodeType === 'decision' ? 'Decision?' :
               selectedNodeType === 'input' ? 'Input' :
               selectedNodeType === 'output' ? 'Output' : 'Process',
        position: { x: worldX - 60, y: worldY - 30 },
        size: selectedNodeType === 'decision' ? { width: 80, height: 80 } : { width: 120, height: 60 },
        color: selectedNodeType === 'start' ? '#10B981' :
               selectedNodeType === 'end' ? '#EF4444' :
               selectedNodeType === 'decision' ? '#F59E0B' :
               selectedNodeType === 'input' ? '#8B5CF6' :
               selectedNodeType === 'output' ? '#06B6D4' : '#3B82F6',
        description: '',
      };
      
      addNode(newNode);
      return;
    }

    if (!clickedNode) {
      setSelectedNode(null);
      setSelectedConnection(null);
      setPendingConnection(null);
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

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const handlePortClick = (nodeId: string, port: 'top' | 'right' | 'bottom' | 'left') => {
    if (!pendingConnection) {
      setPendingConnection({
        sourceNodeId: nodeId,
        sourcePort: port,
      });
    } else if (pendingConnection.sourceNodeId !== nodeId) {
      const newConnection: ConnectionType = {
        id: `conn-${Date.now()}`,
        fromNodeId: pendingConnection.sourceNodeId,
        toNodeId: nodeId,
        fromPort: pendingConnection.sourcePort,
        toPort: port,
        routingMode: globalRoutingMode,
        waypoints: pendingConnection.waypoints || [],
      };
      
      addConnection(newConnection);
      setPendingConnection(null);
    } else {
      setPendingConnection(null);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const isPanTrigger = e.button === 1 || e.button === 2 || (e.button === 0 && isSpaceDown);
    if (!isPanTrigger) return;
    
    e.preventDefault();
    setIsPanning(true);
    setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
  };

  const handleWheel = (e: React.WheelEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[role="listbox"]') || target.closest('.select-content')) {
      return;
    }
    
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

  const zoomIn = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newScale = Math.min(2, canvasScale * 1.1);
    const scaleFactor = newScale / canvasScale;
    const newOffsetX = centerX - (centerX - canvasOffset.x) * scaleFactor;
    const newOffsetY = centerY - (centerY - canvasOffset.y) * scaleFactor;
    const clamped = clampOffset(newOffsetX, newOffsetY);
    setCanvasOffset(clamped);
    setCanvasScale(newScale);
  };

  const zoomOut = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const newScale = Math.max(0.25, canvasScale / 1.1);
    const scaleFactor = newScale / canvasScale;
    const newOffsetX = centerX - (centerX - canvasOffset.x) * scaleFactor;
    const newOffsetY = centerY - (centerY - canvasOffset.y) * scaleFactor;
    const clamped = clampOffset(newOffsetX, newOffsetY);
    setCanvasOffset(clamped);
    setCanvasScale(newScale);
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
          <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1, overflow: 'visible' }}>
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
            
            {connections.map((connection) => (
              <FlowchartConnection
                key={connection.id}
                connection={connection}
                sourceNode={nodes.find(n => n.id === connection.fromNodeId)}
                targetNode={nodes.find(n => n.id === connection.toNodeId)}
                isSelected={connection.id === selectedConnectionId}
                onSelect={() => setSelectedConnection(connection.id)}
                onDelete={() => deleteConnection(connection.id)}
                onUpdate={updateConnection}
                scale={canvasScale}
              />
            ))}
          </svg>

          {nodes.map((node) => (
            <div key={node.id} className="pointer-events-auto relative" style={{ zIndex: 10 }}>
              <FlowchartNode
                node={node}
                isSelected={node.id === selectedNodeId}
                onSelect={() => handleNodeClick(node.id)}
                onUpdate={updateNode}
                onDelete={() => deleteNode(node.id)}
                onPortClick={handlePortClick}
                getWorldFromClient={clientToWorld}
                scale={canvasScale}
              />
            </div>
          ))}
        </div>

        {nodes.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-500 pointer-events-none z-10">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                Select a node type and click on the canvas to add nodes
              </p>
              <p className="text-sm mb-2">Click node ports to create connections</p>
              <p className="text-xs text-gray-400">
                Mouse wheel to zoom • Drag to pan
              </p>
            </div>
          </div>
        )}

        {pendingConnection && !pendingConnection.targetNodeId && (
          <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg pointer-events-none z-50">
            Click on another node port to create connection
          </div>
        )}
      </div>

      {/* Quick Info - Top right corner */}
      <div className="absolute top-4 right-4 space-y-2 z-50">
        <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-600">
          <div>Working Area: {Math.round(canvasRef.current?.clientWidth || 0)} × {Math.round(canvasRef.current?.clientHeight || 0)}</div>
          <div>Zoom: {Math.round(canvasScale * 100)}%</div>
        </div>
        
        {/* Flowchart Overview */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Flowchart Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-500">Nodes</div>
              <div className="font-semibold text-lg">{nodes.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Connections</div>
              <div className="font-semibold text-lg">{connections.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Start Nodes</div>
              <div className="font-semibold text-lg">
                {nodes.filter(n => n.type === 'start').length}
              </div>
            </div>
            <div>
              <div className="text-gray-500">End Nodes</div>
              <div className="font-semibold text-lg">
                {nodes.filter(n => n.type === 'end').length}
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
};