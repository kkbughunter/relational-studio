import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MousePointer2, 
  Square, 
  GitBranch, 
  Trash2, 
  Download, 
  Upload, 
  Undo, 
  Redo,
  FileText,
  Database,
  Save
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useSchemaStore } from '@/store/useSchemaStore';
import { DatabaseType } from '@/types/schema';
import { SQLGenerator } from '@/utils/sqlGenerator';
import { generateSampleECommerceSchema } from '@/utils/sampleData';
import { toast } from 'sonner';

interface EnhancedToolbarProps {
  databaseType: DatabaseType;
  onDatabaseTypeChange: (type: DatabaseType) => void;
}

export const EnhancedToolbar = ({ databaseType, onDatabaseTypeChange }: EnhancedToolbarProps) => {
  const {
    selectedTool,
    relationshipType,
    tables,
    relations,
    setSelectedTool,
    setRelationshipType,
    clearAll,
    undo,
    redo,
    canUndo,
    canRedo,
    loadSchema,
  } = useSchemaStore();

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

      if (!data.tables || !Array.isArray(data.tables)) {
        toast.error('Invalid schema file: missing tables');
        return;
      }

      if (!data.relations || !Array.isArray(data.relations)) {
        toast.error('Invalid schema file: missing relations');
        return;
      }

      loadSchema(data.tables, data.relations);
      toast.success(
        `Schema imported! Loaded ${data.tables.length} tables and ${data.relations.length} relations.`
      );
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import schema. Please check the file format.');
    }
  };

  const handleExportJSON = () => {
    if (tables.length === 0 && relations.length === 0) {
      toast.error('Nothing to export. Add some tables first.');
      return;
    }

    const schemaData = {
      version: '1.0',
      databaseType,
      tables,
      relations,
      exportedAt: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(schemaData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Schema exported as JSON!');
  };

  const handleExportSQL = () => {
    if (tables.length === 0) {
      toast.error('Nothing to export. Add some tables first.');
      return;
    }

    const generator = new SQLGenerator(databaseType, {
      includeDropStatements: false,
      includeIfNotExists: true,
      includeComments: true,
      includeIndexes: true,
      wrapInTransaction: false,
    });

    const sql = generator.generateSchema(tables, relations);
    const dataBlob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schema-${databaseType}-${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`SQL exported for ${databaseType}!`);
  };

  const handleClear = () => {
    if (tables.length === 0 && relations.length === 0) {
      toast.info('Canvas is already empty');
      return;
    }
    clearAll();
    toast.success('Canvas cleared');
  };

  const handleToolChange = (tool: 'select' | 'table') => {
    setSelectedTool(tool);
    if (tool === 'table') {
      toast.info('Click on the canvas to add a table');
    }
  };

  const getRelationshipLabel = (type: '1:1' | '1:N' | 'N:M') => {
    switch (type) {
      case '1:1':
        return '1:1';
      case '1:N':
        return '1:N';
      case 'N:M':
        return 'N:M';
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0 overflow-x-auto">
      {/* Database Type Selector */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Database className="h-4 w-4 text-gray-500" />
        <Select value={databaseType} onValueChange={onDatabaseTypeChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="postgresql">PostgreSQL</SelectItem>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="sqlite">SQLite</SelectItem>
            <SelectItem value="sqlserver">SQL Server</SelectItem>
            <SelectItem value="oracle">Oracle</SelectItem>
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
          variant={selectedTool === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => handleToolChange('table')}
          className="gap-2"
        >
          <Square className="h-4 w-4" />
          Table
        </Button>
      </div>

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
            <DropdownMenuItem onClick={handleExportSQL} className="cursor-pointer gap-2">
              <Database className="h-4 w-4" />
              Export SQL
            </DropdownMenuItem>
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

      {/* Sample Data */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const { tables: sampleTables, relations: sampleRelations } = generateSampleECommerceSchema(databaseType);
          loadSchema(sampleTables, sampleRelations);
          toast.success('Sample e-commerce schema loaded!');
        }}
        className="gap-2"
      >
        <Database className="h-4 w-4" />
        Sample Data
      </Button>

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