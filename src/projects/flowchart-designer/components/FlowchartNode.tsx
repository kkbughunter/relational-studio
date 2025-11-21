import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Edit2, Check, X } from 'lucide-react';
import { FlowchartNode as FlowchartNodeType } from '@/projects/flowchart-designer/types/flowchart';
import React from 'react';

interface FlowchartNodeProps {
  node: FlowchartNodeType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (node: FlowchartNodeType) => void;
  onDelete: () => void;
  onPortClick: (nodeId: string, port: 'top' | 'right' | 'bottom' | 'left') => void;
  getWorldFromClient: (clientX: number, clientY: number) => { x: number; y: number };
  scale: number;
}

export const FlowchartNode = ({
  node,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onPortClick,
  getWorldFromClient,
  scale,
}: FlowchartNodeProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(node.label);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string | null>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    
    setIsDragging(true);
    const world = getWorldFromClient(e.clientX, e.clientY);
    setDragStart({
      x: world.x - node.position.x,
      y: world.y - node.position.y,
    });
    onSelect();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return;
    
    const world = getWorldFromClient(e.clientX, e.clientY);
    const newPosition = {
      x: world.x - dragStart.x,
      y: world.y - dragStart.y,
    };
    
    onUpdate({ ...node, position: newPosition });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setIsResizing(false);
    setResizeHandle(null);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
    const world = getWorldFromClient(e.clientX, e.clientY);
    setDragStart(world);
  };

  const handleResizeMouseMove = (e: MouseEvent) => {
    if (!isResizing || !dragStart || !resizeHandle) return;
    
    const world = getWorldFromClient(e.clientX, e.clientY);
    const deltaX = world.x - dragStart.x;
    const deltaY = world.y - dragStart.y;
    
    let newSize = { ...node.size };
    let newPosition = { ...node.position };
    
    if (node.type === 'decision') {
      // Keep decision nodes square
      const avgDelta = (Math.abs(deltaX) + Math.abs(deltaY)) / 2;
      const newDimension = Math.max(60, node.size.width + (deltaX > 0 || deltaY > 0 ? avgDelta : -avgDelta));
      
      switch (resizeHandle) {
        case 'se':
          newSize.width = newSize.height = newDimension;
          break;
        case 'sw':
          newSize.width = newSize.height = newDimension;
          newPosition.x = node.position.x + (node.size.width - newDimension);
          break;
        case 'ne':
          newSize.width = newSize.height = newDimension;
          newPosition.y = node.position.y + (node.size.height - newDimension);
          break;
        case 'nw':
          newSize.width = newSize.height = newDimension;
          newPosition.x = node.position.x + (node.size.width - newDimension);
          newPosition.y = node.position.y + (node.size.height - newDimension);
          break;
      }
    } else {
      // Regular resize for other node types
      switch (resizeHandle) {
        case 'se':
          newSize.width = Math.max(60, node.size.width + deltaX);
          newSize.height = Math.max(40, node.size.height + deltaY);
          break;
        case 'sw':
          newSize.width = Math.max(60, node.size.width - deltaX);
          newSize.height = Math.max(40, node.size.height + deltaY);
          newPosition.x = node.position.x + deltaX;
          break;
        case 'ne':
          newSize.width = Math.max(60, node.size.width + deltaX);
          newSize.height = Math.max(40, node.size.height - deltaY);
          newPosition.y = node.position.y + deltaY;
          break;
        case 'nw':
          newSize.width = Math.max(60, node.size.width - deltaX);
          newSize.height = Math.max(40, node.size.height - deltaY);
          newPosition.x = node.position.x + deltaX;
          newPosition.y = node.position.y + deltaY;
          break;
      }
    }
    
    onUpdate({ ...node, size: newSize, position: newPosition });
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else if (isResizing) {
      document.addEventListener('mousemove', handleResizeMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousemove', handleResizeMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeHandle]);

  const handleSave = () => {
    onUpdate({ ...node, label: editLabel });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditLabel(node.label);
    setIsEditing(false);
  };

  const getNodeShape = () => {
    switch (node.type) {
      case 'start':
      case 'end':
      case 'terminator':
        return 'rounded-full';
      case 'decision':
        return 'transform rotate-45 scale-110';
      case 'input':
      case 'output':
      case 'data':
        return 'transform skew-x-12';
      case 'document':
        return 'rounded-t-lg';
      case 'multiple-documents':
        return 'rounded-t-lg';
      case 'database':
      case 'stored-data':
        return 'rounded-lg';
      case 'cloud':
        return 'rounded-full';
      case 'subroutine':
      case 'preparation':
        return 'rounded-lg border-l-4 border-r-4';
      case 'delay':
        return 'rounded-r-full';
      case 'manual':
      case 'manual-input':
        return 'transform skew-y-6';
      case 'display':
        return 'rounded-lg';
      case 'manual-loop':
      case 'loop-limit':
        return 'rounded-lg';
      case 'off-page-connector':
        return 'rounded-full';
      case 'or':
      case 'and':
        return 'rounded-full';
      case 'collate':
      case 'sort':
      case 'merge':
        return 'transform rotate-45';
      case 'internal-storage':
        return 'rounded-lg border-l-4';
      default:
        return 'rounded-lg';
    }
  };

  const getNodeBorder = () => {
    switch (node.type) {
      case 'decision':
        return 'border-2 border-gray-300';
      case 'database':
        return 'border-2 border-gray-300 border-dashed';
      case 'cloud':
        return 'border-2 border-gray-300 border-dotted';
      case 'subroutine':
        return 'border-2 border-gray-300';
      default:
        return 'border border-gray-300';
    }
  };

  return (
    <div
      data-node-root="true"
      className="absolute"
      style={{
        left: node.position.x,
        top: node.position.y,
        width: node.size.width,
        height: node.size.height,
      }}
    >
      {/* Connection Ports */}
      {node.type === 'decision' ? (
        // Decision node ports positioned at diamond edges
        <>
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20"
            style={{
              left: '50%',
              top: `${node.size.height * -0.3}px`,
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'top');
            }}
            title="Top port"
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20"
            style={{
              right: `${node.size.width * -0.3}px`,
              top: '50%',
              transform: 'translate(50%, -50%)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'right');
            }}
            title="Right port"
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20"
            style={{
              left: '50%',
              bottom: `${node.size.height * -0.3}px`,
              transform: 'translate(-50%, 50%)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'bottom');
            }}
            title="Bottom port"
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20"
            style={{
              left: `${node.size.width * -0.3}px`,
              top: '50%',
              transform: 'translate(-50%, -50%)'
            }}
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'left');
            }}
            title="Left port"
          />
        </>
      ) : (
        // Regular node ports
        <>
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20 -top-1.5 left-1/2 transform -translate-x-1/2"
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'top');
            }}
            title="Top port"
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20 -right-1.5 top-1/2 transform -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'right');
            }}
            title="Right port"
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20 -bottom-1.5 left-1/2 transform -translate-x-1/2"
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'bottom');
            }}
            title="Bottom port"
          />
          <div
            className="absolute w-3 h-3 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 z-20 -left-1.5 top-1/2 transform -translate-y-1/2"
            onClick={(e) => {
              e.stopPropagation();
              onPortClick(node.id, 'left');
            }}
            title="Left port"
          />
        </>
      )}

      {/* Node Body */}
      <div
        className={`w-full h-full ${getNodeShape()} ${getNodeBorder()} cursor-move transition-all duration-200 ${
          isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''
        }`}
        style={{ backgroundColor: node.color }}
        onMouseDown={handleMouseDown}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      >
        <div className={`w-full h-full flex items-center justify-center p-2 text-white font-medium text-sm ${
          node.type === 'decision' ? 'transform -rotate-45' : ''
        }`}>
          {isEditing ? (
            <div className="w-full space-y-1">
              <Input
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="h-6 text-xs text-black"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') handleCancel();
                }}
                autoFocus
              />
              <div className="flex gap-1 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
                  onClick={handleSave}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                  onClick={handleCancel}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="truncate">{node.label}</div>
              <div className="text-xs opacity-75 capitalize">{node.type}</div>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handles */}
      {isSelected && !isEditing && (
        <>
          {/* Corner resize handles */}
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white cursor-nw-resize -top-1 -left-1"
            onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            title="Resize"
          />
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white cursor-ne-resize -top-1 -right-1"
            onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            title="Resize"
          />
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white cursor-sw-resize -bottom-1 -left-1"
            onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            title="Resize"
          />
          <div
            className="absolute w-2 h-2 bg-blue-500 border border-white cursor-se-resize -bottom-1 -right-1"
            onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            title="Resize"
          />
        </>
      )}

      {/* Action Buttons */}
      {isSelected && !isEditing && (
        <div className="absolute -top-8 right-0 flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-white border border-gray-300 text-blue-600 hover:text-blue-700"
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            title="Edit node"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 bg-white border border-gray-300 text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete node"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};