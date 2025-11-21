# Relational Studio

A modern, web-based database schema design and visualization platform built with React, TypeScript, and Tailwind CSS. Create, edit, and export database schemas with an intuitive drag-and-drop interface.

## 📁 Project Structure

This is the main relational studio project containing all the database schema design functionality.

### Components
- `EnhancedCanvas.tsx` - Main canvas with zoom/pan and table rendering
- `EnhancedToolbar.tsx` - Toolbar with tools and database actions
- `Sidebar.tsx` - Schema explorer and statistics
- `Table.tsx` - Individual database table component
- `Relation.tsx` - Relationship visualization between tables
- `SchemaMinimap.tsx` - Minimap for navigation
- Various dialog components for interactions

### Store
- `useSchemaStore.ts` - Zustand state management for schema data

### Types
- `schema.ts` - TypeScript definitions for tables, relations, and database types

### Utils
- `sqlGenerator.ts` - SQL generation for different databases
- `sampleData.ts` - Sample schema data
- Pathfinding utilities for relation routing

### Pages
- `Index.tsx` - Main application page
- `Home.tsx` - Landing page
- `NotFound.tsx` - 404 page

## 🔄 Reusable for Other Projects

Many components in this project are designed to be reusable:

### Canvas System
- `EnhancedCanvas` - Generic canvas with zoom/pan
- Canvas utilities for coordinate conversion
- Mouse/keyboard event handling

### UI Components
- All components in `@/components/ui/` are generic
- Dialog patterns for various interactions
- Toolbar and sidebar patterns

### State Management Patterns
- Zustand store patterns
- History management (undo/redo)
- Import/export functionality

### Utilities
- Export/import utilities
- File handling
- Toast notifications

These components can be adapted for other visual design tools like flowchart designers, mind mapping tools, etc.

---

**Part of the Visual Design Tools Suite**