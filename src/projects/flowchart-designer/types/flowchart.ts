export type NodeType = 'start' | 'process' | 'decision' | 'input' | 'output' | 'end' | 'connector' | 'document' | 'database' | 'cloud' | 'subroutine' | 'delay' | 'manual';

export interface FlowchartNode {
  id: string;
  type: NodeType;
  label: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  color: string;
  description?: string;
}

export interface Connection {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  fromPort: 'top' | 'right' | 'bottom' | 'left';
  toPort: 'top' | 'right' | 'bottom' | 'left';
  label?: string;
  waypoints?: Array<{ x: number; y: number }>;
  routingMode: 'auto' | 'manual';
}

export interface FlowchartGroup {
  id: string;
  name: string;
  color: string;
  nodeIds: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface FlowchartProject {
  id: string;
  name: string;
  description?: string;
  nodes: FlowchartNode[];
  connections: Connection[];
  groups: FlowchartGroup[];
  createdAt: string;
  updatedAt: string;
}