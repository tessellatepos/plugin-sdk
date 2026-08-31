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
    default?: string | number | boolean | null;
    primaryKey?: boolean;
}

export interface PluginDatabaseTable {
    name: string;
    columns: PluginDatabaseColumn[];
}

export interface PluginDatabaseMount {
    database_name: string;
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
