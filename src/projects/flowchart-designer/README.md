# Flowchart Designer

A modern, web-based flowchart design tool built with React, TypeScript, and Tailwind CSS. Create, edit, and export flowcharts with an intuitive drag-and-drop interface.

## 🚀 Features (Planned)

### Core Functionality
- **Visual Flowchart Design**: Drag-and-drop interface for creating flowchart nodes and connections
- **Multiple Node Types**: Process, Decision, Start/End, Input/Output, and Connector nodes
- **Real-time Editing**: Live updates as you modify nodes and connections
- **Connection Management**: Smart connection routing with visual arrows

### Advanced Features
- **Export Options**: Export flowcharts as PNG, SVG, or JSON
- **Import/Export**: Save and load flowcharts in JSON format
- **Undo/Redo**: Full history management with keyboard shortcuts
- **Auto-save**: Automatic backup on page unload
- **Templates**: Pre-built flowchart templates

### User Interface
- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive Layout**: Works on desktop and tablet devices
- **Dark/Light Mode**: Automatic theme detection
- **Keyboard Shortcuts**: Efficient workflow with hotkeys
- **Zoom & Pan**: Navigate large flowcharts with ease

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **UI Components**: Radix UI + Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system

## 📦 Reusable Components

This project will reuse components from the relational-studio project:

### Canvas Components
- `EnhancedCanvas` - Main canvas with zoom/pan functionality
- `Sidebar` - Explorer and properties panel
- `EnhancedToolbar` - Tool selection and actions

### UI Components
- All UI components from `@/components/ui/`
- Dialog components for various interactions
- Form components for node editing

### Utilities
- Canvas utilities for zoom/pan/coordinate conversion
- Export/import utilities
- History management utilities

## 🎯 Usage (Future)

### Creating Nodes
1. Select the node type from the toolbar
2. Click on the canvas to create a new node
3. Double-click the node to edit its properties
4. Resize nodes by dragging corners

### Creating Connections
1. Click on a node's output port
2. Drag to another node's input port
3. The connection will be created automatically

### Exporting Flowcharts
- **PNG/SVG Export**: Generate image files
- **JSON Export**: Save flowchart for later import

## 🏗️ Architecture (Planned)

### Component Structure
```
src/projects/flowchart-designer/
├── components/
│   ├── FlowchartNode.tsx      # Individual flowchart nodes
│   ├── Connection.tsx         # Connection lines between nodes
│   ├── FlowchartCanvas.tsx    # Main canvas component
│   ├── FlowchartToolbar.tsx   # Toolbar with node types
│   └── FlowchartSidebar.tsx   # Properties and explorer
├── store/
│   └── useFlowchartStore.ts   # Zustand state management
├── types/
│   └── flowchart.ts           # TypeScript type definitions
├── utils/
│   ├── flowchartExporter.ts   # Export utilities
│   └── nodeTemplates.ts       # Node templates
└── pages/
    └── FlowchartIndex.tsx     # Main application page
```

### State Management
The application will use Zustand for state management with:
- Centralized flowchart state (nodes, connections)
- UI state (selected items, tools, canvas position)
- History management for undo/redo
- Persistent storage for auto-save

## 🎨 Design System

Will inherit the design system from relational-studio:
- **Colors**: Same color palette for consistency
- **Typography**: Inter font family
- **Components**: Reuse existing UI components

---

**Built with ❤️ for visual workflow design**