import type { PluginApiMountDefinition } from "@/types/pluginApiMounts.ts";
import type { AuthProvider } from "@/server/host/auth.ts";
import type { PluginDatabaseMount } from "@/types/pluginDatabaseMounts.ts";
import type { MemberAuthProvider } from "@/server/host/member.ts";
import type { PaymentProcessor } from "@/server/host/processor.ts";
import type { PluginManifest } from "@/types/pluginManifest.ts";
import type { PluginTableHooks } from "@/server/host/tableHooks.ts";
import type {
    EventDefinition,
    HookContext,
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
    /** Adds a sign-in method. Needs the AUTH permission. */
    register(kind: "auth", provider: AuthProvider): void;
    /** Adds a login for the plugin's own members. Needs the MEMBER_AUTH permission. */
    register(kind: "memberAuth", provider: MemberAuthProvider): void;
    /**
     * Adds a payment processor. Needs the PAYMENT permission. Its id must be
     * the plugin's name or start with "<plugin name>-", and may not be one
     * the host ships (such as "square").
     */
    register(kind: "paymentProcessor", processor: PaymentProcessor): void;

    /**
     * Intercepts writes (insert, update, delete) to one of this plugin's
     * tables, before and/or after. Can be called more than once per table.
     */
    onTable(table: string, hooks: PluginTableHooks): void;

    /** Runs before an action; can modify the input or block the action. */
    hook<TInput, TOutput>(
        def: HookDefinition<TInput, TOutput>,
        handler: (
            input: TInput,
            ctx: HookContext,
        ) => HookResult<TOutput> | Promise<HookResult<TOutput>>,
    ): void;

    /** Runs after an action; fire and forget. */
    on<THandler extends (...args: never[]) => void>(
        def: EventDefinition<THandler>,
        handler: THandler,
    ): void;

    getManifest(): PluginManifest;
}
