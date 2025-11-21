import { useState } from 'react';
import { Search, Table2, GitBranch, Eye, EyeOff, Palette, Info, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useSchemaStore } from '@/store/useSchemaStore';
import { SchemaMinimap } from './SchemaMinimap';
import { Table, Relation } from '@/types/schema';

export const Sidebar = () => {
  const {
    tables,
    relations,
    selectedTableId,
    selectedRelationId,
    navigateToTable,
    navigateToRelation,
    deleteTable,
    deleteRelation,
  } = useSchemaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showTables, setShowTables] = useState(true);
  const [showRelations, setShowRelations] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filteredTables = tables.filter(table =>
    table.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    table.columns.some(col => col.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredRelations = relations.filter(relation => {
    const sourceTable = tables.find(t => t.id === relation.fromTableId);
    const targetTable = tables.find(t => t.id === relation.toTableId);
    return (
      sourceTable?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetTable?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      relation.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getTableStats = (table: Table) => {
    const primaryKeys = table.columns.filter(col => col.isPrimary).length;
    const foreignKeys = table.columns.filter(col => col.isForeign).length;
    const indexes = table.indexes.length;
    
    return { primaryKeys, foreignKeys, indexes };
  };

  const getRelationLabel = (relation: Relation) => {
    const sourceTable = tables.find(t => t.id === relation.fromTableId);
    const targetTable = tables.find(t => t.id === relation.toTableId);
    return `${sourceTable?.name || 'Unknown'} → ${targetTable?.name || 'Unknown'}`;
  };



  if (isCollapsed) {
    return (
      <div className="w-12 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
        <div className="p-2 border-b border-gray-200 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(false)}
            className="w-8 h-8 p-0"
            title="Expand Schema Explorer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Collapsed stats */}
        <div className="p-2 space-y-2">
          <div className="text-center">
            <div className="text-xs text-gray-500">Tables</div>
            <div className="text-sm font-semibold">{tables.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Relations</div>
            <div className="text-sm font-semibold">{relations.length}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Schema Explorer</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="w-8 h-8 p-0"
            title="Collapse Schema Explorer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search tables, columns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {/* Schema Minimap */}
          <SchemaMinimap />
          
          {/* Schema Stats */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Schema Stats
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Tables</div>
                <div className="font-semibold text-lg">{tables.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Relations</div>
                <div className="font-semibold text-lg">{relations.length}</div>
              </div>
              <div>
                <div className="text-gray-500">Total Columns</div>
                <div className="font-semibold text-lg">
                  {tables.reduce((sum, table) => sum + table.columns.length, 0)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Indexes</div>
                <div className="font-semibold text-lg">
                  {tables.reduce((sum, table) => sum + table.indexes.length, 0)}
                </div>
              </div>
            </div>
          </div>

          {/* Tables Section */}
          <Collapsible open={showTables} onOpenChange={setShowTables}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Table2 className="h-4 w-4" />
                  <span className="font-medium">Tables</span>
                  <Badge variant="secondary">{filteredTables.length}</Badge>
                </div>
                {showTables ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filteredTables.map((table) => {
                const stats = getTableStats(table);
                const isSelected = table.id === selectedTableId;
                
                return (
                  <div
                    key={table.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => navigateToTable(table.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: table.color || '#3B82F6' }}
                        />
                        <span className="font-medium text-sm">{table.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTable(table.id);
                        }}
                        title="Delete table"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      {table.columns.length} columns
                      {table.description && (
                        <div className="mt-1 text-gray-600">{table.description}</div>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      {stats.primaryKeys > 0 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          PK: {stats.primaryKeys}
                        </Badge>
                      )}
                      {stats.foreignKeys > 0 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          FK: {stats.foreignKeys}
                        </Badge>
                      )}
                      {stats.indexes > 0 && (
                        <Badge variant="outline" className="text-xs px-1 py-0">
                          IDX: {stats.indexes}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Column list */}
                    <div className="mt-2 space-y-1">
                      {table.columns.slice(0, 3).map((column) => (
                        <div key={column.id} className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            {column.isPrimary && (
                              <div className="w-2 h-2 bg-yellow-400 rounded" title="Primary Key" />
                            )}
                            {column.isForeign && (
                              <div className="w-2 h-2 bg-blue-400 rounded" title="Foreign Key" />
                            )}
                            {column.isUnique && !column.isPrimary && (
                              <div className="w-2 h-2 bg-green-400 rounded" title="Unique" />
                            )}
                          </div>
                          <span className="text-gray-700">{column.name}</span>
                          <span className="text-gray-500">{column.type}</span>
                        </div>
                      ))}
                      {table.columns.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{table.columns.length - 3} more columns
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {filteredTables.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  {searchTerm ? 'No tables match your search' : 'No tables yet'}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Relations Section */}
          <Collapsible open={showRelations} onOpenChange={setShowRelations}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" />
                  <span className="font-medium">Relations</span>
                  <Badge variant="secondary">{filteredRelations.length}</Badge>
                </div>
                {showRelations ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filteredRelations.map((relation) => {
                const isSelected = relation.id === selectedRelationId;
                
                return (
                  <div
                    key={relation.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => navigateToRelation(relation.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        {relation.type}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteRelation(relation.id);
                        }}
                        title="Delete relation"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Column connection info */}
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {(() => {
                        const sourceTable = tables.find(t => t.id === relation.fromTableId);
                        const targetTable = tables.find(t => t.id === relation.toTableId);
                        const sourceColumn = sourceTable?.columns.find(c => c.id === relation.fromColumnId);
                        const targetColumn = targetTable?.columns.find(c => c.id === relation.toColumnId);
                        return `${sourceTable?.name || 'unknown'}.${sourceColumn?.name || 'unknown'} → ${targetTable?.name || 'unknown'}.${targetColumn?.name || 'unknown'}`;
                      })()} 
                    </div>
                    
                    {relation.name && (
                      <div className="text-xs text-gray-600 mb-2">
                        {relation.name}
                      </div>
                    )}
                    
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span>ON DELETE: {relation.onDelete}</span>
                      <span>ON UPDATE: {relation.onUpdate}</span>
                    </div>
                  </div>
                );
              })}
              
              {filteredRelations.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  {searchTerm ? 'No relations match your search' : 'No relations yet'}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};