import type { HookResult } from "@/server/host/hooks.ts";

type Row = Record<string, unknown>;
type MaybePromise<T> = T | Promise<T>;

/**
 * Interceptors for writes to one of the plugin's own tables, made through
 * `ctx.db.table(name)`. They are application-level (not database triggers),
 * so they run for every write made through the host, including the plugin's
 * own. Reads are not hooked.
 *
 * Before-hooks run in registration order, each seeing the previous one's
 * output. Returning `{ ok: false, reason }` blocks the write: the table call
 * throws a `PluginTableHookError`. After-hooks are fire and forget; errors are
 * logged and do not affect the write.
 *
 * A hook that writes to its own table triggers its own hooks again, so guard
 * against recursion.
 */
export interface PluginTableHooks {
    /** Receives the row to insert; returns the row to actually insert. */
    beforeInsert?: (row: Row) => MaybePromise<HookResult<Row>>;
    /** Receives the target id and patch; returns the patch to actually apply. */
    beforeUpdate?: (input: {
        id: string | number;
        patch: Row;
    }) => MaybePromise<HookResult<Row>>;
    beforeDelete?: (input: {
        id: string | number;
    }) => MaybePromise<HookResult<void>>;

    /** Receives the inserted row, as stored (defaults and generated ids set). */
    afterInsert?: (row: Row) => MaybePromise<void>;
    /** Receives the updated row, as stored. */
    afterUpdate?: (row: Row) => MaybePromise<void>;
    afterDelete?: (input: { id: string | number }) => MaybePromise<void>;
}
