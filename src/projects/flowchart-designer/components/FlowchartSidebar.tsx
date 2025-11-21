import { useState } from 'react';
import { Search, Circle, Square, Diamond, Eye, EyeOff, Info, ChevronLeft, ChevronRight, Trash2, Edit2, Check, X, FileText, Database, Cloud, Hexagon, Clock, Hand } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useFlowchartStore } from '@/projects/flowchart-designer/store/useFlowchartStore';
import { NodeType } from '@/projects/flowchart-designer/types/flowchart';

export const FlowchartSidebar = () => {
  const {
    nodes,
    connections,
    selectedNodeId,
    selectedConnectionId,
    navigateToNode,
    navigateToConnection,
    deleteNode,
    deleteConnection,
    updateNode,
    updateConnection,
    setSelectedTool,
    setSelectedNodeType,
    addNode,
  } = useFlowchartStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [showNodes, setShowNodes] = useState(true);
  const [showConnections, setShowConnections] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [editingNode, setEditingNode] = useState<string | null>(null);
  const [editingConnection, setEditingConnection] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

  const filteredNodes = nodes.filter(node =>
    node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    node.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredConnections = connections.filter(connection => {
    const sourceNode = nodes.find(n => n.id === connection.fromNodeId);
    const targetNode = nodes.find(n => n.id === connection.toNodeId);
    return (
      sourceNode?.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      targetNode?.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      connection.label?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'start':
      case 'end':
        return Circle;
      case 'process':
        return Square;
      case 'decision':
        return Diamond;
      case 'document':
        return FileText;
      case 'database':
        return Database;
      case 'cloud':
        return Cloud;
      case 'subroutine':
        return Hexagon;
      case 'delay':
        return Clock;
      case 'manual':
        return Hand;
      default:
        return Square;
    }
  };

  const nodeTypes: { type: NodeType; label: string; color: string }[] = [
    { type: 'start', label: 'Start', color: '#10B981' },
    { type: 'process', label: 'Process', color: '#3B82F6' },
    { type: 'decision', label: 'Decision', color: '#F59E0B' },
    { type: 'input', label: 'Input', color: '#8B5CF6' },
    { type: 'output', label: 'Output', color: '#EF4444' },
    { type: 'document', label: 'Document', color: '#06B6D4' },
    { type: 'database', label: 'Database', color: '#84CC16' },
    { type: 'cloud', label: 'Cloud', color: '#F97316' },
    { type: 'subroutine', label: 'Subroutine', color: '#EC4899' },
    { type: 'delay', label: 'Delay', color: '#6366F1' },
    { type: 'manual', label: 'Manual', color: '#14B8A6' },
    { type: 'connector', label: 'Connector', color: '#6B7280' },
    { type: 'end', label: 'End', color: '#EF4444' },
  ];

  const handleNodeTypeClick = (nodeType: NodeType) => {
    setSelectedNodeType(nodeType);
    setSelectedTool('node');
  };

  const getConnectionLabel = (connection: any) => {
    const sourceNode = nodes.find(n => n.id === connection.fromNodeId);
    const targetNode = nodes.find(n => n.id === connection.toNodeId);
    return `${sourceNode?.label || 'Unknown'} → ${targetNode?.label || 'Unknown'}`;
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
            title="Expand Flowchart Explorer"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-2 space-y-2">
          <div className="text-center">
            <div className="text-xs text-gray-500">Nodes</div>
            <div className="text-sm font-semibold">{nodes.length}</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-500">Connections</div>
            <div className="text-sm font-semibold">{connections.length}</div>
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
          <h2 className="text-lg font-semibold text-gray-900">Flowchart Explorer</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(true)}
            className="w-8 h-8 p-0"
            title="Collapse Flowchart Explorer"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search nodes, connections..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-3">
          {/* Node Palette */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Node Types</h3>
            <div className="grid grid-cols-2 gap-2">
              {nodeTypes.map((nodeType) => {
                const NodeIcon = getNodeIcon(nodeType.type);
                return (
                  <Button
                    key={nodeType.type}
                    variant="ghost"
                    size="sm"
                    className="h-auto p-2 flex flex-col items-center gap-1 hover:bg-gray-50"
                    onClick={() => handleNodeTypeClick(nodeType.type)}
                    title={`Add ${nodeType.label} node`}
                  >
                    <div
                      className="w-6 h-6 rounded flex items-center justify-center"
                      style={{ backgroundColor: nodeType.color }}
                    >
                      <NodeIcon className="h-3 w-3 text-white" />
                    </div>
                    <span className="text-xs text-gray-600">{nodeType.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Flowchart Stats */}
          <div className="bg-white rounded-lg p-4 border border-gray-200">
            <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Flowchart Stats
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

          {/* Nodes Section */}
          <Collapsible open={showNodes} onOpenChange={setShowNodes}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Square className="h-4 w-4" />
                  <span className="font-medium">Nodes</span>
                  <Badge variant="secondary">{filteredNodes.length}</Badge>
                </div>
                {showNodes ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filteredNodes.map((node) => {
                const isSelected = node.id === selectedNodeId;
                const NodeIcon = getNodeIcon(node.type);
                
                return (
                  <div
                    key={node.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => navigateToNode(node.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: node.color }}
                        />
                        {editingNode === node.id ? (
                          <Input
                            value={editValues.label || node.label}
                            onChange={(e) => setEditValues({ ...editValues, label: e.target.value })}
                            className="h-6 text-sm font-medium"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                updateNode({ ...node, label: editValues.label || node.label });
                                setEditingNode(null);
                                setEditValues({});
                              }
                              if (e.key === 'Escape') {
                                setEditingNode(null);
                                setEditValues({});
                              }
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-sm">{node.label}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        {editingNode === node.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateNode({ ...node, label: editValues.label || node.label });
                                setEditingNode(null);
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
                                setEditingNode(null);
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
                                setEditingNode(node.id);
                                setEditValues({ label: node.label });
                              }}
                              title="Edit node"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNode(node.id);
                              }}
                              title="Delete node"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 mb-2">
                      Type: {node.type}
                      {node.description && (
                        <div className="mt-1 text-gray-600">{node.description}</div>
                      )}
                    </div>
                    
                    <Badge variant="outline" className="text-xs px-1 py-0 capitalize">
                      {node.type}
                    </Badge>
                  </div>
                );
              })}
              
              {filteredNodes.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  {searchTerm ? 'No nodes match your search' : 'No nodes yet'}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <Separator />

          {/* Connections Section */}
          <Collapsible open={showConnections} onOpenChange={setShowConnections}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-2 h-auto"
              >
                <div className="flex items-center gap-2">
                  <Circle className="h-4 w-4" />
                  <span className="font-medium">Connections</span>
                  <Badge variant="secondary">{filteredConnections.length}</Badge>
                </div>
                {showConnections ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {filteredConnections.map((connection) => {
                const isSelected = connection.id === selectedConnectionId;
                
                return (
                  <div
                    key={connection.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-white border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => navigateToConnection(connection.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="text-xs">
                        Connection
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConnection(connection.id);
                        }}
                        title="Delete connection"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {getConnectionLabel(connection)}
                    </div>
                    
                    {connection.label && (
                      <div className="text-xs text-gray-600 mb-2">
                        Label: {connection.label}
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500">
                      {connection.fromPort} → {connection.toPort}
                    </div>
                  </div>
                );
              })}
              
              {filteredConnections.length === 0 && (
                <div className="text-center text-gray-500 text-sm py-4">
                  {searchTerm ? 'No connections match your search' : 'No connections yet'}
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
};