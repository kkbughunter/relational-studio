import { useState } from 'react';
import { Search, Table2, GitBranch, Eye, EyeOff, Palette, Info, ChevronLeft, ChevronRight, Trash2, Edit2, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
    updateTable,
    updateRelation,
  } = useSchemaStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showTables, setShowTables] = useState(true);
  const [showRelations, setShowRelations] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingTable, setEditingTable] = useState<string | null>(null);
  const [editingRelation, setEditingRelation] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

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
                        {editingTable === table.id ? (
                          <Input
                            value={editValues.name || table.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="h-6 text-sm font-medium"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateTable({ ...table, name: editValues.name || table.name });
                                setEditingTable(null);
                                setEditValues({});
                              }
                              if (e.key === 'Escape') {
                                setEditingTable(null);
                                setEditValues({});
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-sm">{table.name}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {editingTable === table.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateTable({ ...table, name: editValues.name || table.name });
                                setEditingTable(null);
                                setEditValues({});
                              }}
                              title="Save changes"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTable(null);
                                setEditValues({});
                              }}
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTable(table.id);
                                setEditValues({ name: table.name });
                              }}
                              title="Edit table"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
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
                          </>
                        )}
                      </div>
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
                      {editingRelation === relation.id ? (
                        <Select
                          value={editValues.type || relation.type}
                          onValueChange={(value) => setEditValues({ ...editValues, type: value })}
                        >
                          <SelectTrigger className="h-6 text-xs w-20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1:1">1:1</SelectItem>
                            <SelectItem value="1:N">1:N</SelectItem>
                            <SelectItem value="N:1">N:1</SelectItem>
                            <SelectItem value="N:M">N:M</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {relation.type}
                        </Badge>
                      )}
                      <div className="flex gap-1">
                        {editingRelation === relation.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateRelation({ 
                                  ...relation, 
                                  type: editValues.type || relation.type,
                                  onDelete: editValues.onDelete || relation.onDelete,
                                  onUpdate: editValues.onUpdate || relation.onUpdate
                                });
                                setEditingRelation(null);
                                setEditValues({});
                              }}
                              title="Save changes"
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRelation(null);
                                setEditValues({});
                              }}
                              title="Cancel"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingRelation(relation.id);
                                setEditValues({ 
                                  type: relation.type,
                                  onDelete: relation.onDelete,
                                  onUpdate: relation.onUpdate
                                });
                              }}
                              title="Edit relation"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
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
                          </>
                        )}
                      </div>
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
                    
                    <div className="space-y-1">
                      {editingRelation === relation.id ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 w-16">ON DELETE:</span>
                            <Select
                              value={editValues.onDelete || relation.onDelete}
                              onValueChange={(value) => setEditValues({ ...editValues, onDelete: value })}
                            >
                              <SelectTrigger className="h-6 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NO ACTION">NO ACTION</SelectItem>
                                <SelectItem value="CASCADE">CASCADE</SelectItem>
                                <SelectItem value="SET NULL">SET NULL</SelectItem>
                                <SelectItem value="RESTRICT">RESTRICT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 w-16">ON UPDATE:</span>
                            <Select
                              value={editValues.onUpdate || relation.onUpdate}
                              onValueChange={(value) => setEditValues({ ...editValues, onUpdate: value })}
                            >
                              <SelectTrigger className="h-6 text-xs flex-1">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="NO ACTION">NO ACTION</SelectItem>
                                <SelectItem value="CASCADE">CASCADE</SelectItem>
                                <SelectItem value="SET NULL">SET NULL</SelectItem>
                                <SelectItem value="RESTRICT">RESTRICT</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 text-xs text-gray-500">
                          <span>ON DELETE: {relation.onDelete}</span>
                          <span>ON UPDATE: {relation.onUpdate}</span>
                        </div>
                      )}
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