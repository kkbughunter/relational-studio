import { create } from 'zustand';
import { FlowchartNode, Connection, NodeType, FlowchartGroup, FlowchartProject } from '@/projects/flowchart-designer/types/flowchart';

interface FlowchartState {
  // Project data
  currentProject: FlowchartProject | null;
  
  // Flowchart data
  nodes: FlowchartNode[];
  connections: Connection[];
  groups: FlowchartGroup[];
  selectedNodeIds: string[];
  
  // UI state
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  selectedTool: 'select' | 'node' | 'connection' | 'group';
  selectedNodeType: NodeType;
  globalRoutingMode: 'auto' | 'manual';
  showClearConfirmDialog: boolean;
  
  // Canvas state
  canvasOffset: { x: number; y: number };
  canvasScale: number;
  
  // History for undo/redo
  history: Array<{
    nodes: FlowchartNode[];
    connections: Connection[];
    timestamp: number;
  }>;
  historyIndex: number;
  
  // Actions
  setCurrentProject: (project: FlowchartProject | null) => void;
  setNodes: (nodes: FlowchartNode[]) => void;
  setConnections: (connections: Connection[]) => void;
  setGroups: (groups: FlowchartGroup[]) => void;
  addGroup: (group: FlowchartGroup) => void;
  updateGroup: (group: FlowchartGroup) => void;
  deleteGroup: (id: string) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  createGroupFromSelected: (name: string, color: string) => void;
  createGroupFromBounds: (name: string, color: string, bounds: { x: number; y: number; width: number; height: number }) => void;
  addNode: (node: FlowchartNode) => void;
  updateNode: (node: FlowchartNode) => void;
  deleteNode: (id: string) => void;
  addConnection: (connection: Connection) => void;
  updateConnection: (connection: Connection) => void;
  deleteConnection: (id: string) => void;
  setSelectedNode: (id: string | null) => void;
  setSelectedConnection: (id: string | null) => void;
  setSelectedTool: (tool: 'select' | 'node' | 'connection' | 'group') => void;
  setSelectedNodeType: (type: NodeType) => void;
  setGlobalRoutingMode: (mode: 'auto' | 'manual') => void;
  setShowClearConfirmDialog: (show: boolean) => void;
  confirmClearAll: () => void;
  setCanvasOffset: (offset: { x: number; y: number }) => void;
  setCanvasScale: (scale: number) => void;
  navigateToNode: (nodeId: string) => void;
  navigateToConnection: (connectionId: string) => void;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  clearAll: () => void;
  loadFlowchart: (nodes: FlowchartNode[], connections: Connection[]) => void;
}

export const useFlowchartStore = create<FlowchartState>((set, get) => ({
  // Initial state
  currentProject: null,
  nodes: [],
  connections: [],
  groups: [],
  selectedNodeIds: [],
  selectedNodeId: null,
  selectedConnectionId: null,
  selectedTool: 'select',
  selectedNodeType: 'process',
  globalRoutingMode: 'auto',
  showClearConfirmDialog: false,
  canvasOffset: { x: 0, y: 0 },
  canvasScale: 1,
  history: [],
  historyIndex: -1,

  // Actions
  setCurrentProject: (project) => set({ currentProject: project }),
  setNodes: (nodes) => set({ nodes }),
  setConnections: (connections) => set({ connections }),
  setGroups: (groups) => set({ groups }),

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
      nodes: state.nodes.map((node) =>
        node.groupId === id ? { ...node, groupId: undefined } : node
      ),
    }));
  },

  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

  createGroupFromSelected: (name, color) => {
    const { selectedNodeIds, addGroup, updateNode, nodes } = get();
    if (selectedNodeIds.length === 0) return;

    const selectedNodes = nodes.filter(n => selectedNodeIds.includes(n.id));
    const minX = Math.min(...selectedNodes.map(n => n.position.x)) - 20;
    const minY = Math.min(...selectedNodes.map(n => n.position.y)) - 40;
    const maxX = Math.max(...selectedNodes.map(n => n.position.x + n.size.width)) + 20;
    const maxY = Math.max(...selectedNodes.map(n => n.position.y + n.size.height)) + 20;

    const groupId = `group-${Date.now()}`;
    const newGroup: FlowchartGroup = {
      id: groupId,
      name,
      color,
      nodeIds: selectedNodeIds,
      bounds: {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
      },
    };

    addGroup(newGroup);
    
    selectedNodeIds.forEach((nodeId) => {
      const node = get().nodes.find(n => n.id === nodeId);
      if (node) {
        updateNode({ ...node, groupId });
      }
    });

    set({ selectedNodeIds: [] });
  },

  createGroupFromBounds: (name: string, color: string, bounds: { x: number; y: number; width: number; height: number }) => {
    const { nodes, pushHistory } = get();
    
    pushHistory();
    
    const nodesInBounds = nodes.filter(node => {
      const nodeRight = node.position.x + node.size.width;
      const nodeBottom = node.position.y + node.size.height;
      
      return node.position.x >= bounds.x &&
             node.position.y >= bounds.y &&
             nodeRight <= bounds.x + bounds.width &&
             nodeBottom <= bounds.y + bounds.height;
    });

    const groupId = `group-${Date.now()}`;
    const newGroup: FlowchartGroup = {
      id: groupId,
      name,
      color,
      nodeIds: nodesInBounds.map(n => n.id),
      bounds,
    };

    set((state) => ({
      groups: [...state.groups, newGroup],
      nodes: state.nodes.map((node) =>
        nodesInBounds.find(n => n.id === node.id)
          ? { ...node, groupId }
          : node
      ),
    }));
  },

  addNode: (node) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      nodes: [...state.nodes, node],
      selectedNodeId: node.id,
      selectedTool: 'select',
    }));
  },

  updateNode: (updatedNode) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === updatedNode.id ? updatedNode : node
      ),
    }));
  },

  deleteNode: (id) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      nodes: state.nodes.filter((node) => node.id !== id),
      connections: state.connections.filter(
        (connection) => connection.fromNodeId !== id && connection.toNodeId !== id
      ),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));
  },

  addConnection: (connection) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      connections: [...state.connections, connection],
      selectedConnectionId: connection.id,
    }));
  },

  updateConnection: (updatedConnection) => {
    set((state) => ({
      connections: state.connections.map((connection) =>
        connection.id === updatedConnection.id ? updatedConnection : connection
      ),
    }));
  },

  deleteConnection: (id) => {
    const { pushHistory } = get();
    pushHistory();
    set((state) => ({
      connections: state.connections.filter((connection) => connection.id !== id),
      selectedConnectionId: state.selectedConnectionId === id ? null : state.selectedConnectionId,
    }));
  },

  setSelectedNode: (id) => set({ selectedNodeId: id, selectedConnectionId: null }),
  setSelectedConnection: (id) => set({ selectedConnectionId: id, selectedNodeId: null }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setSelectedNodeType: (type) => set({ selectedNodeType: type }),
  setGlobalRoutingMode: (mode) => set({ globalRoutingMode: mode }),
  setShowClearConfirmDialog: (show) => set({ showClearConfirmDialog: show }),

  confirmClearAll: () => {
    const { pushHistory } = get();
    pushHistory();
    set({
      nodes: [],
      connections: [],
      groups: [],
      selectedNodeId: null,
      selectedConnectionId: null,
      showClearConfirmDialog: false,
    });
  },

  setCanvasOffset: (offset) => set({ canvasOffset: offset }),
  setCanvasScale: (scale) => set({ canvasScale: scale }),

  navigateToNode: (nodeId) => {
    const { nodes, setSelectedNode, setCanvasOffset, setCanvasScale } = get();
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setSelectedNode(nodeId);
      setCanvasScale(1);
      setCanvasOffset({ x: -node.position.x + 200, y: -node.position.y + 200 });
    }
  },

  navigateToConnection: (connectionId) => {
    const { nodes, connections, setSelectedConnection, setCanvasOffset, setCanvasScale } = get();
    const connection = connections.find(c => c.id === connectionId);
    if (connection) {
      const sourceNode = nodes.find(n => n.id === connection.fromNodeId);
      const targetNode = nodes.find(n => n.id === connection.toNodeId);
      if (sourceNode && targetNode) {
        setSelectedConnection(connectionId);
        setCanvasScale(1);
        const centerX = (sourceNode.position.x + targetNode.position.x) / 2;
        const centerY = (sourceNode.position.y + targetNode.position.y) / 2;
        setCanvasOffset({ x: -centerX + 400, y: -centerY + 300 });
      }
    }
  },

  pushHistory: () => {
    const { nodes, connections, history, historyIndex } = get();
    const newHistoryItem = {
      nodes: JSON.parse(JSON.stringify(nodes)),
      connections: JSON.parse(JSON.stringify(connections)),
      timestamp: Date.now(),
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newHistoryItem);
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
        nodes: previousState.nodes,
        connections: previousState.connections,
        historyIndex: historyIndex - 1,
        selectedNodeId: null,
        selectedConnectionId: null,
      });
    }
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      set({
        nodes: nextState.nodes,
        connections: nextState.connections,
        historyIndex: historyIndex + 1,
        selectedNodeId: null,
        selectedConnectionId: null,
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
    const { nodes, connections, groups } = get();
    const hasContent = nodes.length > 0 || connections.length > 0 || groups.length > 0;
    
    if (hasContent) {
      set({ showClearConfirmDialog: true });
    }
  },

  loadFlowchart: (nodes, connections) => {
    set({
      nodes,
      connections,
      selectedNodeId: null,
      selectedConnectionId: null,
      history: [],
      historyIndex: -1,
    });
  },
}));