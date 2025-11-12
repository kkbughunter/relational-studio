import { useState, useRef, useEffect } from 'react';
import { GripVertical, Plus, X, Settings, Key, Hash, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Table as TableType, Column, DatabaseType, DATA_TYPES, TABLE_COLORS } from '@/types/schema';

interface TableProps {
  table: TableType;
  isSelected: boolean;
  databaseType: DatabaseType;
  onSelect: () => void;
  onUpdate: (table: TableType) => void;
  onDelete: () => void;
  getWorldFromClient?: (x: number, y: number) => { x: number; y: number };
  onColumnClick?: (columnId: string, tableId: string) => void;
  connectedColumns?: string[];
}

export const Table = ({ 
  table, 
  isSelected, 
  databaseType,
  onSelect, 
  onUpdate, 
  onDelete, 
  getWorldFromClient, 
  onColumnClick,
  connectedColumns = []
}: TableProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isEditingName, setIsEditingName] = useState(false);
  const [localName, setLocalName] = useState(table.name);
  const [showSettings, setShowSettings] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalName(table.name);
  }, [table.name]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('input, button, select, textarea')) return;
    
    setIsDragging(true);
    const world = getWorldFromClient ? getWorldFromClient(e.clientX, e.clientY) : { x: e.clientX, y: e.clientY };
    setDragOffset({
      x: world.x - table.position.x,
      y: world.y - table.position.y,
    });
    onSelect();
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const world = getWorldFromClient ? getWorldFromClient(e.clientX, e.clientY) : { x: e.clientX, y: e.clientY };
        onUpdate({
          ...table,
          position: {
            x: world.x - dragOffset.x,
            y: world.y - dragOffset.y,
          },
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset, table, onUpdate]);

  const addColumn = () => {
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      name: 'new_column',
      type: databaseType === 'postgresql' ? 'VARCHAR' : 'VARCHAR(255)',
      isPrimary: false,
      isForeign: false,
      isUnique: false,
      isNullable: true,
      isAutoIncrement: false,
    };
    onUpdate({
      ...table,
      columns: [...table.columns, newColumn],
    });
  };

  const updateColumn = (columnId: string, updates: Partial<Column>) => {
    onUpdate({
      ...table,
      columns: table.columns.map((col) =>
        col.id === columnId ? { ...col, ...updates } : col
      ),
    });
  };

  const deleteColumn = (columnId: string) => {
    onUpdate({
      ...table,
      columns: table.columns.filter((col) => col.id !== columnId),
    });
  };

  const handleNameSubmit = () => {
    setIsEditingName(false);
    if (localName.trim()) {
      onUpdate({ ...table, name: localName.trim() });
    } else {
      setLocalName(table.name);
    }
  };

  const updateTableSettings = (updates: Partial<TableType>) => {
    onUpdate({ ...table, ...updates });
  };

  const getColumnIcon = (column: Column) => {
    if (column.isPrimary) return <Key className="h-3 w-3 text-yellow-500" />;
    if (column.isForeign) return <Hash className="h-3 w-3 text-blue-500" />;
    if (column.isUnique) return <Hash className="h-3 w-3 text-green-500" />;
    return null;
  };

  const availableDataTypes = DATA_TYPES[databaseType] || [];

  return (
    <div
      ref={tableRef}
      id={`table-root-${table.id}`}
      data-table-root="true"
      className={`absolute bg-white border-2 rounded-lg shadow-lg cursor-move select-none w-[420px] ${
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'
      }`}
      style={{
        left: `${table.position.x}px`,
        top: `${table.position.y}px`,
        borderTopColor: table.color || '#3B82F6',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Table Header */}
      <div 
        className="px-4 py-3 rounded-t-md flex items-center justify-between text-white"
        style={{ backgroundColor: table.color || '#3B82F6' }}
      >
        <div className="flex items-center gap-2 flex-1">
          <GripVertical className="h-4 w-4 opacity-70" />
          {isEditingName ? (
            <Input
              value={localName}
              onChange={(e) => setLocalName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleNameSubmit();
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setLocalName(table.name);
                }
              }}
              className="h-7 bg-white text-gray-900 border-none"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3
              className="font-semibold cursor-text"
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditingName(true);
              }}
            >
              {table.name}
            </h3>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="h-6 w-6 p-0 hover:bg-white/20 text-white"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="table-description">Description</Label>
                  <Textarea
                    id="table-description"
                    value={table.description || ''}
                    onChange={(e) => updateTableSettings({ description: e.target.value })}
                    placeholder="Table description..."
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Color</Label>
                  <div className="flex gap-2 mt-2">
                    {TABLE_COLORS.map((color) => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded border-2 ${
                          table.color === color ? 'border-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        onClick={() => updateTableSettings({ color })}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 p-0 hover:bg-white/20 text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Columns */}
      <div className="p-3 space-y-1">
        {table.columns.map((column) => (
          <div
            key={column.id}
            className="flex items-center gap-2 text-sm py-3 px-2 rounded hover:bg-gray-50 group relative border border-transparent hover:border-gray-200 min-h-[40px]"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {table.position.x > 50 && (
              <div
                className={`absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer transition-all ${
                  connectedColumns.includes(column.id)
                    ? 'bg-green-500 hover:bg-green-600 opacity-100'
                    : 'bg-blue-500 hover:bg-blue-600 opacity-0 group-hover:opacity-100'
                }`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (onColumnClick) onColumnClick(column.id, table.id);
                }}
                title={connectedColumns.includes(column.id) ? 'Connected column' : 'Click to connect to another column'}
              />
            )}
            
            <div
              className={`absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full cursor-pointer transition-all ${
                connectedColumns.includes(column.id)
                  ? 'bg-green-500 hover:bg-green-600 opacity-100'
                  : 'bg-blue-500 hover:bg-blue-600 opacity-0 group-hover:opacity-100'
              }`}
              onMouseDown={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (onColumnClick) onColumnClick(column.id, table.id);
              }}
              title={connectedColumns.includes(column.id) ? 'Connected column' : 'Click to connect to another column'}
            />
            
            <div className="flex items-center gap-1 w-6 flex-shrink-0">
              {getColumnIcon(column)}
            </div>
            
            <div className="w-32 flex-shrink-0">
              <Input
                value={column.name}
                onChange={(e) => updateColumn(column.id, { name: e.target.value })}
                className="h-8 w-full text-sm border border-gray-200 bg-white hover:border-gray-300 focus:border-blue-500"
                placeholder="column name"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            <div className="w-28 flex-shrink-0">
              <Select
                value={column.type}
                onValueChange={(value) => updateColumn(column.id, { type: value })}
              >
                <SelectTrigger className="h-8 w-full text-sm border border-gray-200 bg-white hover:border-gray-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableDataTypes.map((type) => (
                    <SelectItem key={type} value={type} className="text-sm">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  updateColumn(column.id, { isPrimary: !column.isPrimary });
                }}
                className={`h-6 px-2 text-[10px] ${
                  column.isPrimary ? 'bg-yellow-500 text-white hover:bg-yellow-600' : 'hover:bg-gray-100'
                }`}
                title="Primary Key"
              >
                PK
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  updateColumn(column.id, { isUnique: !column.isUnique });
                }}
                className={`h-6 px-2 text-[10px] ${
                  column.isUnique ? 'bg-green-500 text-white hover:bg-green-600' : 'hover:bg-gray-100'
                }`}
                title="Unique"
              >
                UQ
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  updateColumn(column.id, { isNullable: !column.isNullable });
                }}
                className={`h-6 px-1 text-[10px] ${
                  !column.isNullable ? 'bg-red-500 text-white hover:bg-red-600' : 'hover:bg-gray-100'
                }`}
                title="Not Null"
              >
                {column.isNullable ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                deleteColumn(column.id);
              }}
              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        ))}

        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            addColumn();
          }}
          className="w-full gap-2 text-gray-500 hover:text-gray-700 mt-2 border border-dashed border-gray-300 hover:border-gray-400"
        >
          <Plus className="h-4 w-4" />
          Add Column
        </Button>
      </div>
    </div>
  );
};