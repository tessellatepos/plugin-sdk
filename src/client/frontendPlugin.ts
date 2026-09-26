import type { PluginManifest } from "@/types/pluginManifest.ts";
import type { PluginUIMountDefinition } from "@/types/pluginUIMounts.ts";

/**
 * Client-side plugin instance, mirroring the server-side Plugin class but
 * scoped to UI mount registration only. The plugin's client entry's default
 * export receives one of these and calls `register("ui", ...)` to declare
 * which mount points its React components should render at.
 */
export class FrontendPlugin {
    private manifest: PluginManifest;
    private uiMounts: PluginUIMountDefinition[] = [];

    constructor(manifest: PluginManifest) {
        this.manifest = manifest;
    }

    public register(kind: "ui", mount: PluginUIMountDefinition): void {
        if (kind !== "ui") return;
        this.uiMounts.push(mount);
    }

    public get(kind: "ui"): PluginUIMountDefinition[] {
        if (kind !== "ui") return [];
        return this.uiMounts;
    }

    public getManifest(): PluginManifest {
        return this.manifest;
    }
}
