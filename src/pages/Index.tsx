import { useEffect, useState } from 'react';
import { EnhancedToolbar } from '@/components/EnhancedToolbar';
import { EnhancedCanvas } from '@/components/EnhancedCanvas';
import { Sidebar } from '@/components/Sidebar';
import { useSchemaStore } from '@/store/useSchemaStore';
import { DatabaseType } from '@/types/schema';
import { toast } from 'sonner';

const Index = () => {
  const [databaseType, setDatabaseType] = useState<DatabaseType>('postgresql');
  const { tables, relations, undo, redo } = useSchemaStore();

  // Keyboard shortcuts
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement)?.closest(
        'input, textarea, [contenteditable=""], [contenteditable="true"]'
      );
      if (isInput) return;

      const isMac = navigator.platform.toLowerCase().includes('mac');
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      if (!ctrlOrCmd) return;

      if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey)) {
        e.preventDefault();
        redo();
      }
    };
    
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [undo, redo]);

  // Auto-save functionality
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      const hasContent = tables.length > 0 || relations.length > 0;
      if (!hasContent) return;

      const snapshot = {
        version: '1.0',
        databaseType,
        tables,
        relations,
        exportedAt: new Date().toISOString(),
      };
      
      try {
        localStorage.setItem('relational_studio_autosave', JSON.stringify(snapshot));
      } catch {}

      e.preventDefault();
      e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
    };

    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [tables, relations, databaseType]);

  // Auto-restore on load
  useEffect(() => {
    const raw = localStorage.getItem('relational_studio_autosave');
    if (!raw) return;
    
    try {
      const data = JSON.parse(raw);
      if (data.tables && data.relations) {
        // Auto-download the backup
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `schema-autosave-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.info('Auto-exported your schema from the previous session.');
      }
    } catch {}
    
    localStorage.removeItem('relational_studio_autosave');
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Relational Studio</h3>
          </div>
        </div>
      </header>

      {/* Toolbar */}
      <div className="flex-shrink-0">
        <EnhancedToolbar
          databaseType={databaseType}
          onDatabaseTypeChange={setDatabaseType}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-h-0">
        <Sidebar />
        <EnhancedCanvas databaseType={databaseType} />
      </div>
    </div>
  );
};

export default Index;
