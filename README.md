# Relational Studio

A modern, web-based database schema design and visualization platform built with React, TypeScript, and Tailwind CSS. Create, edit, and export database schemas with an intuitive drag-and-drop interface.

## 🚀 Features

### Core Functionality
- **Visual Schema Design**: Drag-and-drop interface for creating database tables and relationships
- **Multi-Database Support**: PostgreSQL, MySQL, SQLite, SQL Server, and Oracle
- **Real-time Editing**: Live updates as you modify tables and relationships
- **Relationship Management**: Support for 1:1, 1:N, and N:M relationships with visual notation

### Advanced Features
- **SQL Generation**: Export schemas as database-specific SQL scripts
- **Import/Export**: Save and load schemas in JSON format
- **Undo/Redo**: Full history management with keyboard shortcuts
- **Auto-save**: Automatic backup on page unload
- **Sample Data**: Pre-built e-commerce schema for testing

### User Interface
- **Modern Design**: Clean, professional interface with Tailwind CSS
- **Responsive Layout**: Works on desktop and tablet devices
- **Dark/Light Mode**: Automatic theme detection
- **Keyboard Shortcuts**: Efficient workflow with hotkeys
- **Zoom & Pan**: Navigate large schemas with ease

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript
- **State Management**: Zustand
- **UI Components**: Radix UI + Tailwind CSS
- **Icons**: Lucide React
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with custom design system

## 📦 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd relational-studio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🎯 Usage

### Creating Tables
1. Select the "Table" tool from the toolbar
2. Click on the canvas to create a new table
3. Double-click the table name to edit it
4. Add columns using the "Add Column" button
5. Configure column properties (type, constraints, etc.)

### Creating Relationships
1. Select the "Relation" tool from the toolbar
2. Choose the relationship type (1:1, 1:N, N:M)
3. Click on the source table, then the target table
4. The relationship will be created automatically

### Exporting Schemas
- **SQL Export**: Generate database-specific SQL scripts
- **JSON Export**: Save schema for later import
- **Sample Data**: Load a pre-built e-commerce schema

### Keyboard Shortcuts
- `Ctrl/Cmd + Z`: Undo
- `Ctrl/Cmd + Y`: Redo
- `Space + Drag`: Pan canvas
- `Mouse Wheel`: Zoom in/out

## 🏗️ Architecture

### Component Structure
```
src/
├── components/
│   ├── Table.tsx              # Table component with column editing
│   ├── Relation.tsx           # Relationship visualization
│   ├── EnhancedCanvas.tsx     # Main canvas with zoom/pan
│   ├── EnhancedToolbar.tsx    # Toolbar with tools and actions
│   └── Sidebar.tsx            # Schema explorer and stats
├── store/
│   └── useSchemaStore.ts      # Zustand state management
├── types/
│   └── schema.ts              # TypeScript type definitions
├── utils/
│   ├── sqlGenerator.ts        # SQL generation utilities
│   └── sampleData.ts          # Sample schema data
└── pages/
    └── Index.tsx              # Main application page
```

### State Management
The application uses Zustand for state management with the following key features:
- Centralized schema state (tables, relations)
- UI state (selected items, tools, canvas position)
- History management for undo/redo
- Persistent storage for auto-save

### SQL Generation
The SQL generator supports multiple database dialects:
- Database-specific data types
- Constraint generation (PK, FK, UNIQUE, CHECK)
- Index creation
- Relationship constraints (ON DELETE, ON UPDATE)

## 🎨 Design System

### Colors
- **Primary**: Blue (#3B82F6) - Main actions and selected states
- **Success**: Green (#10B981) - Positive actions
- **Warning**: Amber (#F59E0B) - Caution states
- **Danger**: Red (#EF4444) - Destructive actions
- **Purple**: (#8B5CF6) - Secondary elements

### Typography
- **Font Family**: Inter (system font fallback)
- **Headings**: 600-700 weight
- **Body**: 400-500 weight
- **Code**: JetBrains Mono

## 🔧 Configuration

### Database Types
The application supports the following database types with specific data type mappings:

- **PostgreSQL**: SERIAL, BIGSERIAL, UUID, JSONB, ARRAY types
- **MySQL**: AUTO_INCREMENT, ENUM, SET, JSON types
- **SQLite**: Simplified type system (INTEGER, REAL, TEXT, BLOB)
- **SQL Server**: UNIQUEIDENTIFIER, DATETIME2, NVARCHAR types
- **Oracle**: NUMBER, VARCHAR2, TIMESTAMP WITH TIME ZONE types

### Customization
You can customize the application by modifying:
- `src/types/schema.ts` - Add new data types or constraints
- `src/utils/sqlGenerator.ts` - Extend SQL generation
- `src/index.css` - Modify the design system colors
- `src/utils/sampleData.ts` - Create new sample schemas

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Radix UI](https://www.radix-ui.com/) for accessible UI components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Lucide](https://lucide.dev/) for beautiful icons
- [Zustand](https://github.com/pmndrs/zustand) for simple state management

## 📞 Support

If you have any questions or need help, please:
1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Built with ❤️ for the developer community**