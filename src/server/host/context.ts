import type { PluginDatabaseRepository } from "@/types/pluginDatabaseMounts.ts";
import type { PluginServerHooks } from "@/server/host/hooks.ts";

export interface PluginServerContext {
    db: PluginDatabaseRepository;
    hooks: PluginServerHooks;
    session: { deviceId: string; locationId: string };
}
