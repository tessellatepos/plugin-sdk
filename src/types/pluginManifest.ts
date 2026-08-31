import { PluginUIMountDefinition } from "@/types/pluginUIMounts.ts";
import { PluginApiMountDefinition } from "@/types/pluginApiMounts.ts";
import { PluginDatabaseMount } from "@/types/pluginDatabaseMounts.ts";
import type { PluginPermission } from "@/types/pluginPermissions.ts";

export interface PluginManifest {
    name: string;
    version: string;
    author: string | string[];
    mountPoints: PluginUIMountDefinition[];
    apiMounts: PluginApiMountDefinition[];
    databaseMounts: PluginDatabaseMount[];
    permissions: PluginPermission[];
}
