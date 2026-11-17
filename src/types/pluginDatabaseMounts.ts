export enum PluginColumnType {
    TEXT = "text",
    VARCHAR = "varchar",
    INTEGER = "integer",
    BOOLEAN = "boolean",
    TIMESTAMP = "timestamp",
    JSONB = "jsonb",
}

export interface PluginDatabaseColumn {
    name: string;
    type: PluginColumnType;
    length?: number;
    nullable?: boolean;
    unique?: boolean;
    autoIncrement?: boolean;
    default?: string | number | boolean | null;
    primaryKey?: boolean;
}

/** One schema change, applied to an existing table by a migration. */
export type PluginMigrationOp =
    | {
          op: "addColumn";
          /**
           * Cannot be a primary key. A non-nullable column needs a `default`,
           * since existing rows must be filled.
           */
          column: PluginDatabaseColumn;
      }
    | { op: "dropColumn"; name: string }
    | { op: "renameColumn"; from: string; to: string };

/** Steps that take a table from `version - 1` to `version`. */
export interface PluginTableMigration {
    /** Integer >= 2. Version 1 is the table as first created. */
    version: number;
    up: PluginMigrationOp[];
}

export interface PluginDatabaseTable {
    name: string;
    /**
     * The table's CURRENT shape. A fresh install creates exactly this; an
     * existing table is brought here by `migrations`.
     */
    columns: PluginDatabaseColumn[];
    /**
     * Schema version of `columns`. Defaults to the highest migration version,
     * or 1 with no migrations. Raise it (and add a migration) whenever
     * `columns` changes: the host never alters a table otherwise.
     */
    version?: number;
    /**
     * Applied in version order, once each, inside one transaction, to tables
     * created at an older version. Tables that predate versioning count as
     * version 1.
     */
    migrations?: PluginTableMigration[];
}

/** Thrown by a table write that a before-hook blocked. */
export class PluginTableHookError extends Error {
    readonly code?: string;
    constructor(reason: string, code?: string) {
        super(reason);
        this.name = "PluginTableHookError";
        this.code = code;
    }
}

export interface PluginDatabaseMount {
    tables: PluginDatabaseTable[];
}

export interface PluginTableClient {
    find(query?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
    findOne(id: string | number): Promise<Record<string, unknown> | null>;
    insert(row: Record<string, unknown>): Promise<Record<string, unknown>>;
    update(
        id: string | number,
        patch: Record<string, unknown>,
    ): Promise<Record<string, unknown>>;
    delete(id: string | number): Promise<void>;
}

export interface PluginDatabaseRepository {
    table<Name extends string>(name: Name): PluginTableClient;
}
