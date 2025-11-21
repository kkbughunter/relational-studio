import { FlowchartNode, Connection } from '@/projects/flowchart-designer/types/flowchart';

interface FlowchartConnectionProps {
  connection: Connection;
  sourceNode?: FlowchartNode;
  targetNode?: FlowchartNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (connection: Connection) => void;
  scale: number;
}

export const FlowchartConnection = ({
  connection,
  sourceNode,
  targetNode,
  isSelected,
  onSelect,
  onDelete,
  scale,
}: FlowchartConnectionProps) => {
  if (!sourceNode || !targetNode) return null;

  const getPortPosition = (node: FlowchartNode, port: 'top' | 'right' | 'bottom' | 'left') => {
    const { x, y } = node.position;
    const { width, height } = node.size;
    
    // For decision nodes, adjust connection points to diamond edges
    if (node.type === 'decision') {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      switch (port) {
        case 'top':
          return { x: centerX, y: y + height * -0.3 };
        case 'right':
          return { x: x + width - width * -0.3, y: centerY };
        case 'bottom':
          return { x: centerX, y: y + height - height * -0.3 };
        case 'left':
          return { x: x + width * -0.3, y: centerY };
      }
    }
    
    // Default positioning for other node types
    switch (port) {
      case 'top':
        return { x: x + width / 2, y };
      case 'right':
        return { x: x + width, y: y + height / 2 };
      case 'bottom':
        return { x: x + width / 2, y: y + height };
      case 'left':
        return { x, y: y + height / 2 };
    }
  };

  const sourcePos = getPortPosition(sourceNode, connection.fromPort);
  const targetPos = getPortPosition(targetNode, connection.toPort);

  // Simple straight line connection
  const pathData = `M ${sourcePos.x} ${sourcePos.y} L ${targetPos.x} ${targetPos.y}`;

  // Calculate midpoint for label
  const midX = (sourcePos.x + targetPos.x) / 2;
  const midY = (sourcePos.y + targetPos.y) / 2;

  return (
    <g>
      {/* Connection line */}
      <path
        d={pathData}
        stroke={isSelected ? '#3B82F6' : '#6B7280'}
        strokeWidth={isSelected ? 3 : 2}
        fill="none"
        markerEnd="url(#arrowhead)"
        className="cursor-pointer hover:stroke-blue-500"
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
      />
      
      {/* Connection label */}
      {connection.label && (
        <g>
          <rect
            x={midX - 20}
            y={midY - 8}
            width={40}
            height={16}
            fill="white"
            stroke="#6B7280"
            strokeWidth={1}
            rx={2}
          />
          <text
            x={midX}
            y={midY + 3}
            textAnchor="middle"
            fontSize="10"
            fill="#374151"
            className="pointer-events-none"
          >
            {connection.label}
          </text>
        </g>
      )}

      {/* Delete button when selected */}
      {isSelected && (
        <g>
          <circle
            cx={midX}
            cy={midY - 15}
            r={8}
            fill="#EF4444"
            stroke="white"
            strokeWidth={2}
            className="cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          />
          <text
            x={midX}
            y={midY - 11}
            textAnchor="middle"
            fontSize="10"
            fill="white"
            className="pointer-events-none font-bold"
          >
            ×
          </text>
        </g>
      )}
    </g>
  );
};