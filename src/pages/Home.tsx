import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Database, Zap, Code, Download } from 'lucide-react';
import { useSchemaStore } from '@/store/useSchemaStore';
import { DatabaseType } from '@/types/schema';
import { toast } from 'sonner';

export const Home = () => {
  const [selectedDatabase, setSelectedDatabase] = useState<DatabaseType>('postgresql');
  const navigate = useNavigate();
  const { setDatabaseType, tables, relations, databaseType, clearAll } = useSchemaStore();

  // Auto-export existing work when coming from designer
  useEffect(() => {
    const hasContent = tables.length > 0 || relations.length > 0;
    if (hasContent) {
      const snapshot = {
        version: '1.0',
        databaseType,
        tables,
        relations,
        exportedAt: new Date().toISOString(),
      };
      
      const dataStr = JSON.stringify(snapshot, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schema-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Your schema has been automatically exported!');
      clearAll();
    }
  }, []);

  const handleStartDesigning = () => {
    setDatabaseType(selectedDatabase);
    navigate('/designer');
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-100 overflow-y-auto">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Relational Studio
          </h1>
          <p className="text-base text-gray-600 max-w-xl mx-auto">
            A modern, web-based database schema design and visualization platform. 
            Create, edit, and export database schemas with an intuitive drag-and-drop interface.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader>
              <Database className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Visual Schema Design</CardTitle>
              <CardDescription>
                Drag-and-drop interface for creating database tables and relationships with real-time editing.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>Multi-Database Support</CardTitle>
              <CardDescription>
                Support for PostgreSQL and MySQL with database-specific features and data types.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>SQL Generation</CardTitle>
              <CardDescription>
                Export schemas as database-specific SQL scripts with proper constraints and relationships.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Get Started */}
        <Card className="max-w-sm mx-auto">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg">Start Designing</CardTitle>
            <CardDescription className="text-sm">
              Choose your database type and begin creating your schema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Database Type
              </label>
              <Select value={selectedDatabase} onValueChange={(value: DatabaseType) => setSelectedDatabase(value)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="postgresql">PostgreSQL</SelectItem>
                  <SelectItem value="mysql">MySQL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleStartDesigning} className="w-full" size="default">
              Start Designing
            </Button>
          </CardContent>
        </Card>

        {/* Additional Features */}
        <div className="mt-8 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Features</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Database className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Relationship Management</h3>
              <p className="text-xs text-gray-600">1:1, 1:N, and N:M relationships with visual notation</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Real-time Editing</h3>
              <p className="text-xs text-gray-600">Live updates as you modify tables and relationships</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Code className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Undo/Redo</h3>
              <p className="text-xs text-gray-600">Full history management with keyboard shortcuts</p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="font-semibold mb-1 text-sm">Import/Export</h3>
              <p className="text-xs text-gray-600">Save and load schemas in JSON format</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};