export type DatabaseType = 'postgresql' | 'mysql' | 'sqlite' | 'sqlserver' | 'oracle';

export interface Column {
  id: string;
  name: string;
  type: string;
  length?: number;
  precision?: number;
  scale?: number;
  isPrimary: boolean;
  isForeign: boolean;
  isUnique: boolean;
  isNullable: boolean;
  isAutoIncrement: boolean;
  defaultValue?: string;
  description?: string;
  comment?: string;
  enumOptions?: string[];
}

export interface Index {
  id: string;
  name: string;
  columns: string[];
  isUnique: boolean;
  type?: 'BTREE' | 'HASH' | 'GIN' | 'GIST';
}

export interface Constraint {
  id: string;
  type: 'CHECK' | 'UNIQUE' | 'DEFAULT';
  expression: string;
  columns: string[];
}

export interface Table {
  id: string;
  name: string;
  position: { x: number; y: number };
  columns: Column[];
  color?: string;
  description?: string;
  indexes: Index[];
  constraints: Constraint[];
  groupId?: string;
}

export interface Group {
  id: string;
  name: string;
  color: string;
  tableIds: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface Relation {
  id: string;
  fromTableId: string;
  toTableId: string;
  fromColumnId: string;
  toColumnId: string;
  type: '1:1' | '1:N' | 'N:1' | 'N:M';
  onDelete: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  onUpdate: 'CASCADE' | 'SET NULL' | 'RESTRICT' | 'NO ACTION';
  name?: string;
  routingMode?: 'auto' | 'manual';
  sourceAnchor?: { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number };
  targetAnchor?: { side: 'top' | 'right' | 'bottom' | 'left'; offset?: number };
  waypoints?: Array<{ x: number; y: number }>;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  databaseType: DatabaseType;
  ownerId: string;
  workspaceId?: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Schema {
  id: string;
  projectId: string;
  version: number;
  commitMessage?: string;
  tables: Table[];
  relations: Relation[];
  createdBy: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'team' | 'enterprise';
  createdAt: Date;
}

// Data type definitions for different databases
export const DATA_TYPES = {
  postgresql: [
    'SERIAL', 'BIGSERIAL', 'SMALLSERIAL',
    'INTEGER', 'BIGINT', 'SMALLINT',
    'DECIMAL', 'NUMERIC', 'REAL', 'DOUBLE PRECISION',
    'VARCHAR', 'CHAR', 'TEXT',
    'DATE', 'TIME', 'TIMESTAMP', 'TIMESTAMPTZ',
    'BOOLEAN',
    'UUID',
    'JSON', 'JSONB',
    'BYTEA',
    'ARRAY',
    'ENUM'
  ],
  mysql: [
    'AUTO_INCREMENT',
    'INT', 'BIGINT', 'SMALLINT', 'TINYINT', 'MEDIUMINT',
    'DECIMAL', 'NUMERIC', 'FLOAT', 'DOUBLE',
    'VARCHAR', 'CHAR', 'TEXT', 'LONGTEXT', 'MEDIUMTEXT', 'TINYTEXT',
    'DATE', 'TIME', 'DATETIME', 'TIMESTAMP', 'YEAR',
    'BOOLEAN', 'BOOL',
    'BINARY', 'VARBINARY', 'BLOB', 'LONGBLOB',
    'JSON',
    'ENUM', 'SET'
  ],
  sqlite: [
    'INTEGER', 'REAL', 'TEXT', 'BLOB', 'NUMERIC'
  ],
  sqlserver: [
    'INT', 'BIGINT', 'SMALLINT', 'TINYINT',
    'DECIMAL', 'NUMERIC', 'FLOAT', 'REAL', 'MONEY', 'SMALLMONEY',
    'VARCHAR', 'NVARCHAR', 'CHAR', 'NCHAR', 'TEXT', 'NTEXT',
    'DATE', 'TIME', 'DATETIME', 'DATETIME2', 'SMALLDATETIME', 'DATETIMEOFFSET',
    'BIT',
    'UNIQUEIDENTIFIER',
    'BINARY', 'VARBINARY', 'IMAGE',
    'XML'
  ],
  oracle: [
    'NUMBER', 'INTEGER', 'FLOAT',
    'VARCHAR2', 'NVARCHAR2', 'CHAR', 'NCHAR', 'CLOB', 'NCLOB',
    'DATE', 'TIMESTAMP', 'TIMESTAMP WITH TIME ZONE', 'TIMESTAMP WITH LOCAL TIME ZONE',
    'BOOLEAN',
    'RAW', 'LONG RAW', 'BLOB',
    'XMLType'
  ]
} as const;

export const RELATIONSHIP_ACTIONS = [
  'CASCADE',
  'SET NULL', 
  'RESTRICT',
  'NO ACTION'
] as const;

export const TABLE_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280', // Gray
] as const;