export type { PluginServerContext } from "@/server/host/context.ts";
export type { ServerPlugin } from "@/server/host/plugin.ts";

export { defineHook, defineEvent, hooks, events } from "@/server/host/hooks.ts";

export type {
    HookDefinition,
    HookResult,
    EventDefinition,
} from "@/server/host/hooks.ts";
