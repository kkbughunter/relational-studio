import { Table, Relation, DatabaseType, Column } from '@/types/schema';

export interface SQLGeneratorOptions {
  includeDropStatements?: boolean;
  includeIfNotExists?: boolean;
  includeComments?: boolean;
  includeIndexes?: boolean;
  wrapInTransaction?: boolean;
}

export class SQLGenerator {
  private databaseType: DatabaseType;
  private options: SQLGeneratorOptions;

  constructor(databaseType: DatabaseType, options: SQLGeneratorOptions = {}) {
    this.databaseType = databaseType;
    this.options = {
      includeDropStatements: false,
      includeIfNotExists: true,
      includeComments: true,
      includeIndexes: true,
      wrapInTransaction: false,
      ...options,
    };
  }

  generateSchema(tables: Table[], relations: Relation[]): string {
    const statements: string[] = [];

    if (this.options.wrapInTransaction) {
      statements.push(this.getBeginTransaction());
    }

    if (this.options.includeDropStatements) {
      statements.push(...this.generateDropStatements(tables, relations));
    }

    statements.push(...this.generateCreateStatements(tables));
    statements.push(...this.generateRelationStatements(relations, tables));

    if (this.options.includeIndexes) {
      statements.push(...this.generateIndexStatements(tables));
    }

    if (this.options.wrapInTransaction) {
      statements.push(this.getCommitTransaction());
    }

    return statements.filter(s => s.trim()).join('\n\n');
  }

  private generateCreateStatements(tables: Table[]): string[] {
    return tables.map(table => this.generateCreateTable(table));
  }

  private generateCreateTable(table: Table): string {
    const ifNotExists = this.options.includeIfNotExists ? this.getIfNotExistsClause() : '';
    const tableName = this.escapeIdentifier(table.name);
    
    let sql = `CREATE TABLE ${ifNotExists}${tableName} (\n`;
    
    const columnDefinitions = table.columns.map(col => this.generateColumnDefinition(col));
    const constraints = this.generateTableConstraints(table);
    
    const allDefinitions = [...columnDefinitions, ...constraints];
    sql += allDefinitions.map(def => `  ${def}`).join(',\n');
    sql += '\n)';

    if (this.options.includeComments && table.description) {
      sql += `;\n${this.generateTableComment(table.name, table.description)}`;
    }

    return sql + ';';
  }

  private generateColumnDefinition(column: Column): string {
    const name = this.escapeIdentifier(column.name);
    let type = this.mapDataType(column.type, column);
    
    const parts = [name, type];

    if (!column.isNullable) {
      parts.push('NOT NULL');
    }

    if (column.defaultValue) {
      parts.push(`DEFAULT ${this.formatDefaultValue(column.defaultValue, column.type)}`);
    }

    if (column.isAutoIncrement) {
      parts.push(this.getAutoIncrementClause());
    }

    return parts.join(' ');
  }

  private generateTableConstraints(table: Table): string[] {
    const constraints: string[] = [];

    // Primary key constraint
    const primaryColumns = table.columns.filter(col => col.isPrimary);
    if (primaryColumns.length > 0) {
      const columnNames = primaryColumns.map(col => this.escapeIdentifier(col.name)).join(', ');
      constraints.push(`PRIMARY KEY (${columnNames})`);
    }

    // Unique constraints
    const uniqueColumns = table.columns.filter(col => col.isUnique && !col.isPrimary);
    uniqueColumns.forEach(col => {
      constraints.push(`UNIQUE (${this.escapeIdentifier(col.name)})`);
    });

    // Custom constraints
    table.constraints.forEach(constraint => {
      if (constraint.type === 'CHECK') {
        constraints.push(`CHECK (${constraint.expression})`);
      } else if (constraint.type === 'UNIQUE') {
        const columnNames = constraint.columns.map(name => this.escapeIdentifier(name)).join(', ');
        constraints.push(`UNIQUE (${columnNames})`);
      }
    });

    return constraints;
  }

  private generateRelationStatements(relations: Relation[], tables: Table[]): string[] {
    return relations.map(relation => this.generateForeignKey(relation, tables));
  }

  private generateForeignKey(relation: Relation, tables: Table[]): string {
    const sourceTable = tables.find(t => t.id === relation.fromTableId);
    const targetTable = tables.find(t => t.id === relation.toTableId);
    const sourceColumn = sourceTable?.columns.find(c => c.id === relation.fromColumnId);
    const targetColumn = targetTable?.columns.find(c => c.id === relation.toColumnId);

    if (!sourceTable || !targetTable || !sourceColumn || !targetColumn) {
      return '-- Invalid relation: missing table or column';
    }

    const constraintName = `fk_${sourceTable.name}_${sourceColumn.name}`;
    const sourceTableName = this.escapeIdentifier(sourceTable.name);
    const targetTableName = this.escapeIdentifier(targetTable.name);
    const sourceColumnName = this.escapeIdentifier(sourceColumn.name);
    const targetColumnName = this.escapeIdentifier(targetColumn.name);

    let sql = `ALTER TABLE ${sourceTableName} ADD CONSTRAINT ${this.escapeIdentifier(constraintName)} `;
    sql += `FOREIGN KEY (${sourceColumnName}) REFERENCES ${targetTableName}(${targetColumnName})`;

    if (relation.onDelete !== 'NO ACTION') {
      sql += ` ON DELETE ${relation.onDelete}`;
    }

    if (relation.onUpdate !== 'NO ACTION') {
      sql += ` ON UPDATE ${relation.onUpdate}`;
    }

    return sql + ';';
  }

  private generateIndexStatements(tables: Table[]): string[] {
    const statements: string[] = [];

    tables.forEach(table => {
      table.indexes.forEach(index => {
        const indexName = this.escapeIdentifier(index.name);
        const tableName = this.escapeIdentifier(table.name);
        const columnNames = index.columns.map(name => this.escapeIdentifier(name)).join(', ');
        
        const unique = index.isUnique ? 'UNIQUE ' : '';
        let sql = `CREATE ${unique}INDEX ${indexName} ON ${tableName} (${columnNames})`;
        
        if (index.type && this.databaseType === 'postgresql') {
          sql = `CREATE ${unique}INDEX ${indexName} ON ${tableName} USING ${index.type} (${columnNames})`;
        }

        statements.push(sql + ';');
      });
    });

    return statements;
  }

  private generateDropStatements(tables: Table[], relations: Relation[]): string[] {
    const statements: string[] = [];

    // Drop foreign key constraints first
    relations.forEach(relation => {
      const sourceTable = tables.find(t => t.id === relation.fromTableId);
      if (sourceTable) {
        const constraintName = `fk_${sourceTable.name}_${relation.fromColumnId}`;
        statements.push(`ALTER TABLE ${this.escapeIdentifier(sourceTable.name)} DROP CONSTRAINT IF EXISTS ${this.escapeIdentifier(constraintName)};`);
      }
    });

    // Drop tables
    tables.forEach(table => {
      statements.push(`DROP TABLE IF EXISTS ${this.escapeIdentifier(table.name)};`);
    });

    return statements;
  }

  private generateTableComment(tableName: string, comment: string): string {
    const escapedName = this.escapeIdentifier(tableName);
    const escapedComment = this.escapeString(comment);

    switch (this.databaseType) {
      case 'postgresql':
        return `COMMENT ON TABLE ${escapedName} IS ${escapedComment}`;
      case 'mysql':
        return `ALTER TABLE ${escapedName} COMMENT = ${escapedComment}`;
      case 'sqlserver':
        return `EXEC sp_addextendedproperty 'MS_Description', ${escapedComment}, 'SCHEMA', 'dbo', 'TABLE', '${tableName}'`;
      default:
        return `-- Table comment: ${comment}`;
    }
  }

  private mapDataType(type: string, column: Column): string {
    // Handle length/precision/scale
    let mappedType = type;

    if (column.length && ['VARCHAR', 'CHAR', 'NVARCHAR', 'NCHAR'].some(t => type.toUpperCase().includes(t))) {
      mappedType = `${type}(${column.length})`;
    } else if (column.precision && ['DECIMAL', 'NUMERIC'].some(t => type.toUpperCase().includes(t))) {
      if (column.scale) {
        mappedType = `${type}(${column.precision},${column.scale})`;
      } else {
        mappedType = `${type}(${column.precision})`;
      }
    }

    return mappedType;
  }

  private escapeIdentifier(identifier: string): string {
    switch (this.databaseType) {
      case 'postgresql':
        return `"${identifier}"`;
      case 'mysql':
        return `\`${identifier}\``;
      case 'sqlserver':
        return `[${identifier}]`;
      case 'sqlite':
        return `"${identifier}"`;
      case 'oracle':
        return `"${identifier.toUpperCase()}"`;
      default:
        return identifier;
    }
  }

  private escapeString(value: string): string {
    return `'${value.replace(/'/g, "''")}'`;
  }

  private formatDefaultValue(value: string, type: string): string {
    if (type.toUpperCase().includes('VARCHAR') || type.toUpperCase().includes('TEXT') || type.toUpperCase().includes('CHAR')) {
      return this.escapeString(value);
    }
    return value;
  }

  private getIfNotExistsClause(): string {
    switch (this.databaseType) {
      case 'postgresql':
      case 'sqlite':
        return 'IF NOT EXISTS ';
      case 'mysql':
        return 'IF NOT EXISTS ';
      case 'sqlserver':
        return ''; // SQL Server uses different syntax
      case 'oracle':
        return ''; // Oracle uses different syntax
      default:
        return '';
    }
  }

  private getAutoIncrementClause(): string {
    switch (this.databaseType) {
      case 'postgresql':
        return ''; // Handled by SERIAL type
      case 'mysql':
        return 'AUTO_INCREMENT';
      case 'sqlserver':
        return 'IDENTITY(1,1)';
      case 'sqlite':
        return 'AUTOINCREMENT';
      case 'oracle':
        return ''; // Handled by sequences
      default:
        return '';
    }
  }

  private getBeginTransaction(): string {
    switch (this.databaseType) {
      case 'postgresql':
      case 'sqlite':
        return 'BEGIN;';
      case 'mysql':
        return 'START TRANSACTION;';
      case 'sqlserver':
        return 'BEGIN TRANSACTION;';
      case 'oracle':
        return 'BEGIN;';
      default:
        return 'BEGIN;';
    }
  }

  private getCommitTransaction(): string {
    return 'COMMIT;';
  }
}