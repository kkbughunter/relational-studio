import { create } from 'zustand';
import { Table, Relation, DatabaseType, Project } from '@/types/schema';

interface SchemaState {
  // Project data
  currentProject: Project | null;
  
  // Schema data
  tables: Table[];
  relations: Relation[];
  
  // UI state
  selectedTableId: string | null;
  selectedRelationId: string | null;
  selectedTool: 'select' | 'table';
  relationshipType: '1:1' | '1:N' | 'N:M';
  globalRoutingMode: 'auto' | 'manual';
  
  // Canvas state
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  
  // History for undo/redo
  history: Array<{
    tables: Table[];
    relations: Relation[];
    timestamp: number;
  }>;
  historyIndex: number;
  
  // Actions
  setCurrentProject: (project: Project | null) => void;
  setTables: (tables: Table[]) => void;
  setRelations: (relations: Relation[]) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  deleteTable: (id: string) => void;
  addRelation: (relation: Relation) => void;
  updateRelation: (relation: Relation) => void;
  deleteRelation: (id: string) => void;
  setSelectedTable: (id: string | null) => void;
  setSelectedRelation: (id: string | null) => void;
  setSelectedTool: (tool: 'select' | 'table') => void;
  setRelationshipType: (type: '1:1' | '1:N' | 'N:M') => void;
  setGlobalRoutingMode: (mode: 'auto' | 'manual') => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setCanvasScale: (scale: number) => void;
  navigateToTable: (tableId: string) => void;
  navigateToRelation: (relationId: string) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearAll: () => void;
  loadSchema: (tables: Table[], relations: Relation[]) => void;
}

export const useSchemaStore = create<SchemaState>((set, get) => ({
  // Initial state
  currentProject: null,
  tables: [],
  relations: [],
  selectedTableId: null,
  selectedRelationId: null,
  selectedTool: 'select',
  relationshipType: '1:N',
  globalRoutingMode: 'auto',
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  history: [],
  historyIndex: -1,

  // Actions
  setCurrentProject: (project) => set({ currentProject: project }),

  setTables: (tables) => set({ tables }),

  setRelations: (relations) => set({ relations }),

  addTable: (table) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      tables: [...state.tables, table],
      selectedTableId: table.id,
    }));
  },

  updateTable: (updatedTable) => {
    set((state) => ({
      tables: state.tables.map((table) =>
        table.id === updatedTable.id ? updatedTable : table
      ),
    }));
  },

  deleteTable: (id) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      tables: state.tables.filter((table) => table.id !== id),
      relations: state.relations.filter(
        (relation) => relation.fromTableId !== id && relation.toTableId !== id
      ),
      selectedTableId: state.selectedTableId === id ? null : state.selectedTableId,
    }));
  },

  addRelation: (relation) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      relations: [...state.relations, relation],
      selectedRelationId: relation.id,
    }));
  },

  updateRelation: (updatedRelation) => {
    set((state) => ({
      relations: state.relations.map((relation) =>
        relation.id === updatedRelation.id ? updatedRelation : relation
      ),
    }));
  },

  deleteRelation: (id) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      relations: state.relations.filter((relation) => relation.id !== id),
      selectedRelationId: state.selectedRelationId === id ? null : state.selectedRelationId,
    }));
  },

  setSelectedTable: (id) => set({ selectedTableId: id, selectedRelationId: null }),

  setSelectedRelation: (id) => set({ selectedRelationId: id, selectedTableId: null }),

  setSelectedTool: (tool) => set({ selectedTool: tool }),

  setRelationshipType: (type) => set({ relationshipType: type }),

  setGlobalRoutingMode: (mode) => set({ globalRoutingMode: mode }),

  setCanvasOffset: (offset) => set({ canvasOffset: offset }),

  setCanvasScale: (scale) => set({ canvasScale: scale }),

  navigateToTable: (tableId) => {
    const { tables, setSelectedTable, setCanvasOffset, setCanvasScale } = get();
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setSelectedTable(tableId);
      setCanvasScale(1);
      setCanvasOffset({ x: -table.position.x + 200, y: -table.position.y + 200 });
    }
  },

  navigateToRelation: (relationId) => {
    const { tables, relations, setSelectedRelation, setCanvasOffset, setCanvasScale } = get();
    const relation = relations.find(r => r.id === relationId);
    if (relation) {
      const sourceTable = tables.find(t => t.id === relation.fromTableId);
      const targetTable = tables.find(t => t.id === relation.toTableId);
      if (sourceTable && targetTable) {
        setSelectedRelation(relationId);
        setCanvasScale(1);
        const centerX = (sourceTable.position.x + targetTable.position.x) / 2;
        const centerY = (sourceTable.position.y + targetTable.position.y) / 2;
        setCanvasOffset({ x: -centerX + 400, y: -centerY + 300 });
      }
    }
  },

  pushHistory: () => {
    const { tables, relations, history, historyIndex } = get();
    const newHistoryItem = {
      tables: JSON.parse(JSON.stringify(tables)),
      relations: JSON.parse(JSON.stringify(relations)),
      timestamp: Date.now(),
    };

    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryItem);

    // Keep only last 50 history items
    const trimmedHistory = newHistory.slice(-50);

    set({
      history: trimmedHistory,
      historyIndex: trimmedHistory.length - 1,
    });
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      set({
        tables: previousState.tables,
        relations: previousState.relations,
        historyIndex: historyIndex - 1,
        selectedTableId: null,
        selectedRelationId: null,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        tables: nextState.tables,
        relations: nextState.relations,
        historyIndex: historyIndex + 1,
        selectedTableId: null,
        selectedRelationId: null,
      });
    }
  },

  canUndo: () => {
    const { historyIndex } = get();
    return historyIndex > 0;
  },

  canRedo: () => {
    const { history, historyIndex } = get();
    return historyIndex < history.length - 1;
  },

  clearAll: () => {
    const { pushHistory } = get();
    pushHistory();
    set({
      tables: [],
      relations: [],
      selectedTableId: null,
      selectedRelationId: null,
    });
  },

  loadSchema: (tables, relations) => {
    set({
      tables,
      relations,
      selectedTableId: null,
      selectedRelationId: null,
      history: [],
      historyIndex: -1,
    });
  },
}));