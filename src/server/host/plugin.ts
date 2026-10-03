import type { PluginApiMountDefinition } from "@/types/pluginApiMounts.ts";
import type { PluginDatabaseMount } from "@/types/pluginDatabaseMounts.ts";
import type { PluginManifest } from "@/types/pluginManifest.ts";
import type {
    EventDefinition,
    HookDefinition,
    HookResult,
} from "@/server/host/hooks.ts";

/**
 * What a plugin's server entry receives. The host imports the file named by
 * the manifest's `main` and calls its default export once at startup:
 *
 *     export default function register(plugin: ServerPlugin) { ... }
 */
export interface ServerPlugin {
    /** Adds a route under /plugins/<plugin name>/. */
    register(kind: "api", mount: PluginApiMountDefinition): void;
    /** Declares tables, provisioned at startup as "<plugin name>-<table>". */
    register(kind: "database", mount: PluginDatabaseMount): void;

    /** Runs before an action; can modify the input or block the action. */
    hook<TInput, TOutput>(
        def: HookDefinition<TInput, TOutput>,
        handler: (
            input: TInput,
        ) => HookResult<TOutput> | Promise<HookResult<TOutput>>,
    ): void;

    /** Runs after an action; fire and forget. */
    on<THandler extends (...args: never[]) => void>(
        def: EventDefinition<THandler>,
        handler: THandler,
    ): void;

    getManifest(): PluginManifest;
}
