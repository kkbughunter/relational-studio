import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MousePointer2, 
  Circle, 
  Square, 
  Diamond, 
  Hexagon,
  Octagon,
  Trash2, 
  Download, 
  Upload, 
  Undo, 
  Redo,
  FileText,
  Route,
  Database,
  Cloud,
  Clock,
  Hand
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFlowchartStore } from '@/projects/flowchart-designer/store/useFlowchartStore';
import { NodeType } from '@/projects/flowchart-designer/types/flowchart';
import { toast } from 'sonner';

export const FlowchartToolbar = () => {
  const {
    selectedTool,
    selectedNodeType,
    globalRoutingMode,
    nodes,
    connections,
    setSelectedTool,
    setSelectedNodeType,
    setGlobalRoutingMode,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
    loadFlowchart,
  } = useFlowchartStore();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImport(file);
      e.target.value = '';
    }
  };

  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.nodes || !Array.isArray(data.nodes)) {
        toast.error('Invalid flowchart file: missing nodes');
        return;
      }

      if (!data.connections || !Array.isArray(data.connections)) {
        toast.error('Invalid flowchart file: missing connections');
        return;
      }

      loadFlowchart(data.nodes, data.connections);
      toast.success(`Flowchart imported! Loaded ${data.nodes.length} nodes and ${data.connections.length} connections.`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import flowchart. Please check the file format.');
    }
  };

  const handleExportJSON = () => {
    if (nodes.length === 0 && connections.length === 0) {
      toast.error('Nothing to export. Add some nodes first.');
      return;
    }

    const flowchartData = {
      version: '1.0',
      nodes,
      connections,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(flowchartData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `flowchart-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Flowchart exported as JSON!');
  };

  const handleClear = () => {
    clearAll();
  };

  const handleToolChange = (tool: 'select' | 'node' | 'connection' | 'group') => {
    setSelectedTool(tool);
    if (tool === 'node') {
      toast.info('Select a node type and click on the canvas to add nodes');
    } else if (tool === 'connection') {
      toast.info('Click on node ports to create connections');
    }
  };

  const getNodeIcon = (type: NodeType) => {
    switch (type) {
      case 'start':
      case 'end':
        return Circle;
      case 'process':
        return Square;
      case 'decision':
        return Diamond;
      case 'input':
      case 'output':
        return Hexagon;
      case 'document':
        return FileText;
      case 'database':
        return Database;
      case 'cloud':
        return Cloud;
      case 'subroutine':
        return Octagon;
      case 'delay':
        return Clock;
      case 'manual':
        return Hand;
      case 'connector':
        return Circle;
      default:
        return Square;
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0 overflow-x-auto">
      {/* Routing Mode */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Route className="h-4 w-4 text-gray-500" />
        <Select value={globalRoutingMode} onValueChange={setGlobalRoutingMode}>
          <SelectTrigger className="w-24">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* Tools */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant={selectedTool === 'select' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolChange('select')}
          className="gap-2"
        >
          <MousePointer2 className="h-4 w-4" />
          Select
        </Button>
        
        <Button
          variant={selectedTool === 'node' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolChange('node')}
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          Node
        </Button>
        
        <Button
          variant={selectedTool === 'connection' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolChange('connection')}
          className="gap-2"
        >
          <Route className="h-4 w-4" />
          Connection
        </Button>
      </div>

      {/* Node Type Selector */}
      {selectedTool === 'node' && (
        <>
          <div className="h-6 w-px bg-gray-300" />
          <div className="flex items-center gap-2 flex-shrink-0">
            <Select value={selectedNodeType} onValueChange={(value: NodeType) => setSelectedNodeType(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="start">Start</SelectItem>
                <SelectItem value="process">Process</SelectItem>
                <SelectItem value="decision">Decision</SelectItem>
                <SelectItem value="input">Input</SelectItem>
                <SelectItem value="output">Output</SelectItem>
                <SelectItem value="document">Document</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="cloud">Cloud</SelectItem>
                <SelectItem value="subroutine">Subroutine</SelectItem>
                <SelectItem value="delay">Delay</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="connector">Connector</SelectItem>
                <SelectItem value="end">End</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      <div className="h-6 w-px bg-gray-300" />

      {/* History */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={undo}
          disabled={!canUndo()}
          className="gap-2"
          title="Undo (Ctrl+Z)"
        >
          <Undo className="h-4 w-4" />
          Undo
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={redo}
          disabled={!canRedo()}
          className="gap-2"
          title="Redo (Ctrl+Y)"
        >
          <Redo className="h-4 w-4" />
          Redo
        </Button>
      </div>

      <div className="h-6 w-px bg-gray-300" />

      {/* Import/Export */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleImportClick}
          className="gap-2"
        >
          <Upload className="h-4 w-4" />
          Import
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer gap-2">
              <FileText className="h-4 w-4" />
              Export JSON
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      <div className="flex-1" />

      {/* Clear */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleClear}
        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        Clear
      </Button>
    </div>
  );
};