import { useSchemaStore } from '@/store/useSchemaStore';

interface SchemaMinimapProps {}

export const SchemaMinimap = () => {
  const { tables, relations, selectedTableId, setSelectedTable, canvasScale, canvasOffset } = useSchemaStore();

  if (tables.length === 0) {
    return (
      <div className="bg-white rounded-lg p-4 border border-gray-200 h-32 flex items-center justify-center">
        <div className="text-xs text-gray-400">No tables to display</div>
      </div>
    );
  }

  // Fixed minimap dimensions and scale
  const minimapWidth = 200;
  const minimapHeight = 120;
  const canvasWidth = 4000;
  const canvasHeight = 4000;
  const scaleX = minimapWidth / canvasWidth;
  const scaleY = minimapHeight / canvasHeight;

  const handleTableClick = (table: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTable(table.id);
    
    // Navigate by updating canvas offset to center the table
    const { setCanvasOffset } = useSchemaStore.getState();
    const canvasElement = document.querySelector('[data-canvas-root="true"]') as HTMLElement;
    if (canvasElement) {
      const rect = canvasElement.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      setCanvasOffset({
        x: centerX - table.position.x - 140,
        y: centerY - table.position.y - 60
      });
    }
  };

  return (
    <div className="bg-white rounded-lg p-3 border border-gray-200">
      <div className="text-xs font-medium text-gray-700 mb-2">Schema Overview</div>
      <div 
        className="relative bg-gray-50 rounded border overflow-hidden cursor-pointer"
        style={{ width: '200px', height: '120px' }}
      >
        <svg
          width="200"
          height="120"
          viewBox="0 0 4000 4000"
          className="w-full h-full"
        >
          {/* Viewport indicator */}
          <rect
            x={-canvasOffset.x / canvasScale}
            y={-canvasOffset.y / canvasScale}
            width={800 / canvasScale}
            height={600 / canvasScale}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3B82F6"
            strokeWidth="4"
            rx="8"
            className="pointer-events-none"
          />
          {/* Relations */}
          {relations.map((relation) => {
            const sourceTable = tables.find(t => t.id === relation.fromTableId);
            const targetTable = tables.find(t => t.id === relation.toTableId);
            if (!sourceTable || !targetTable) return null;

            return (
              <line
                key={relation.id}
                x1={sourceTable.position.x + 140}
                y1={sourceTable.position.y + 60}
                x2={targetTable.position.x + 140}
                y2={targetTable.position.y + 60}
                stroke="#9CA3AF"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}

          {/* Tables */}
          {tables.map((table) => (
            <g key={table.id}>
              <rect
                x={table.position.x}
                y={table.position.y}
                width="280"
                height="120"
                fill={table.id === selectedTableId ? '#3B82F6' : table.color || '#6B7280'}
                stroke={table.id === selectedTableId ? '#1D4ED8' : '#9CA3AF'}
                strokeWidth="8"
                rx="8"
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => handleTableClick(table, e)}
              >
                <title>{table.name} ({table.columns.length} columns)</title>
              </rect>
              <text
                x={table.position.x + 140}
                y={table.position.y + 60}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="48"
                fontWeight="500"
                className="pointer-events-none select-none"
              >
                {table.name.length > 8 ? table.name.substring(0, 8) + '...' : table.name}
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
        <span>Click tables to navigate</span>
        <span>Zoom: {Math.round(canvasScale * 100)}%</span>
      </div>
    </div>
  );
};