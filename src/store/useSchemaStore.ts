import { create } from 'zustand';
import { Table, Relation, DatabaseType, Project, Group } from '@/types/schema';

interface SchemaState {
  // Project data
  currentProject: Project | null;
  
  // Schema data
  tables: Table[];
  relations: Relation[];
  groups: Group[];
  databaseType: DatabaseType;
  selectedTableIds: string[];
  
  // UI state
  selectedTableId: string | null;
  selectedRelationId: string | null;
  selectedTool: 'select' | 'table' | 'group';
  relationshipType: '1:1' | '1:N' | 'N:M';
  globalRoutingMode: 'auto' | 'manual';
  showClearConfirmDialog: boolean;
  
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
  setGroups: (groups: Group[]) => void;
  setDatabaseType: (type: DatabaseType) => void;
  addGroup: (group: Group) => void;
  updateGroup: (group: Group) => void;
  deleteGroup: (id: string) => void;
  setSelectedTableIds: (ids: string[]) => void;
  createGroupFromSelected: (name: string, color: string) => void;
  createGroupFromBounds: (name: string, color: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  addTable: (table: Table) => void;
  updateTable: (table: Table) => void;
  deleteTable: (id: string) => void;
  addRelation: (relation: Relation) => void;
  updateRelation: (relation: Relation) => void;
  deleteRelation: (id: string) => void;
  setSelectedTable: (id: string | null) => void;
  setSelectedRelation: (id: string | null) => void;
  setSelectedTool: (tool: 'select' | 'table' | 'group') => void;
  setRelationshipType: (type: '1:1' | '1:N' | 'N:M') => void;
  setGlobalRoutingMode: (mode: 'auto' | 'manual') => void;
  setShowClearConfirmDialog: (show: boolean) => void;
  confirmClearAll: () => void;
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
  groups: [],
  databaseType: 'postgresql',
  selectedTableIds: [],
  selectedTableId: null,
  selectedRelationId: null,
  selectedTool: 'select',
  relationshipType: '1:N',
  globalRoutingMode: 'auto',
  showClearConfirmDialog: false,
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  history: [],
  historyIndex: -1,

  // Actions
  setCurrentProject: (project) => set({ currentProject: project }),

  setTables: (tables) => set({ tables }),

  setRelations: (relations) => set({ relations }),

  setGroups: (groups) => set({ groups }),

  setDatabaseType: (type) => set({ databaseType: type }),

  addGroup: (group) => {
    set((state) => ({
      groups: [...state.groups, group],
    }));
  },

  updateGroup: (updatedGroup) => {
    set((state) => ({
      groups: state.groups.map((group) =>
        group.id === updatedGroup.id ? updatedGroup : group
      ),
    }));
  },

  deleteGroup: (id) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      groups: state.groups.filter((group) => group.id !== id),
      tables: state.tables.map((table) =>
        table.groupId === id ? { ...table, groupId: undefined } : table
      ),
    }));
  },

  setSelectedTableIds: (ids) => set({ selectedTableIds: ids }),

  createGroupFromSelected: (name, color) => {
    const { selectedTableIds, addGroup, updateTable, tables } = get();
    if (selectedTableIds.length === 0) return;

    // Calculate bounds from selected tables
    const selectedTables = tables.filter(t => selectedTableIds.includes(t.id));
    const minX = Math.min(...selectedTables.map(t => t.position.x)) - 20;
    const minY = Math.min(...selectedTables.map(t => t.position.y)) - 40;
    const maxX = Math.max(...selectedTables.map(t => t.position.x + 420)) + 20;
    const maxY = Math.max(...selectedTables.map(t => t.position.y + 120)) + 20;

    const groupId = `group-${Date.now()}`;
    const newGroup: Group = {
      id: groupId,
      name,
      color,
      tableIds: selectedTableIds,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
    };

    addGroup(newGroup);
    
    // Update tables to belong to this group
    selectedTableIds.forEach((tableId) => {
      const table = get().tables.find(t => t.id === tableId);
      if (table) {
        updateTable({ ...table, groupId });
      }
    });

    set({ selectedTableIds: [] });
  },

  createGroupFromBounds: (name: string, color: string, bounds: { x: number; y: number; width: number; height: number }) => {
    const { tables, pushHistory } = get();
    
    pushHistory();
    
    // Find tables within bounds
    const tablesInBounds = tables.filter(table => {
      const tableRight = table.position.x + 420;
      const tableBottom = table.position.y + 120;
      
      return table.position.x >= bounds.x &&
             table.position.y >= bounds.y &&
             tableRight <= bounds.x + bounds.width &&
             tableBottom <= bounds.y + bounds.height;
    });

    const groupId = `group-${Date.now()}`;
    const newGroup: Group = {
      id: groupId,
      name,
      color,
      tableIds: tablesInBounds.map(t => t.id),
      bounds,
    };

    set((state) => ({
      groups: [...state.groups, newGroup],
      tables: state.tables.map((table) =>
        tablesInBounds.find(t => t.id === table.id)
          ? { ...table, groupId }
          : table
      ),
    }));
  },

  addTable: (table) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      tables: [...state.tables, table],
      selectedTableId: table.id,
      selectedTool: 'select',
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

  setShowClearConfirmDialog: (show) => set({ showClearConfirmDialog: show }),

  confirmClearAll: () => {
    const { pushHistory } = get();
    pushHistory();
    set({
      tables: [],
      relations: [],
      selectedTableId: null,
      selectedRelationId: null,
      showClearConfirmDialog: false,
    });
  },

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
    const { tables, relations } = get();
    const hasContent = tables.length > 0 || relations.length > 0;
    
    if (hasContent) {
      set({ showClearConfirmDialog: true });
    } else {
      const { confirmClearAll } = get();
      confirmClearAll();
    }
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