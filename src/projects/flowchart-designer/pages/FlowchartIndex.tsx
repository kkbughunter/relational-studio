import { useState } from 'react';
import { FlowchartCanvas } from '@/projects/flowchart-designer/components/FlowchartCanvas';
import { FlowchartToolbar } from '@/projects/flowchart-designer/components/FlowchartToolbar';
import { FlowchartSidebar } from '@/projects/flowchart-designer/components/FlowchartSidebar';
import { ClearConfirmDialog } from '@/projects/flowchart-designer/components/ClearConfirmDialog';

export const FlowchartIndex = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <FlowchartToolbar />
      
      <div className="flex-1 flex min-h-0">
        {!sidebarCollapsed && <FlowchartSidebar />}
        <FlowchartCanvas />
      </div>

      <ClearConfirmDialog />
    </div>
  );
};