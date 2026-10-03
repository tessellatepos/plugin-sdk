import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { EnvironmentOptions, Plugin } from "vite";
import {
    SHARED_GLOBAL,
    isSharedSpecifier,
    type SharedSpecifier,
} from "@/shared/contract.ts";

export interface TessellatePluginOptions {
    /** Client entry, built to dist/client.js. `false` for a server-only plugin. */
    client?: string | false;
    /** Server entry, built to dist/index.js (the manifest's `main`). `false` for a UI-only plugin. */
    server?: string | false;
}

const OUT_DIR = "dist";
const VIRTUAL_PREFIX = "\0tessellate-shared:";
const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/**
 * Builds a Tessellate plugin with one `vite build`:
 *
 * - client entry → dist/client.js, an ES module the frontend import()s. React
 *   and the Tessellate SDKs are not bundled; imports of them read the host's
 *   instances at runtime (see `exposeSharedModules`).
 * - server entry → dist/index.js, loaded by the backend. The Tessellate SDKs
 *   stay as imports and resolve against the backend's copy.
 *
 * An entry whose file doesn't exist is skipped.
 */
export function tessellatePlugin(
    options: TessellatePluginOptions = {},
): Plugin {
    let root = process.cwd();
    const exportNames = new Map<SharedSpecifier, Promise<string[]>>();

    const entry = (value: string | false | undefined, fallback: string) => {
        if (value === false) return null;
        const file = path.resolve(root, value ?? fallback);
        return existsSync(file) ? file : null;
    };

    return {
        name: "tessellate-plugin",
        // Must claim shared imports before Vite's own resolver does.
        enforce: "pre",

        config(config) {
            root = path.resolve(config.root ?? process.cwd());
            const client = entry(options.client, "src/client.tsx");
            const server = entry(options.server, "index.ts");
            if (!client && !server) {
                throw new Error(
                    "tessellatePlugin: found neither a client nor a server entry",
                );
            }

            const environments: Record<string, EnvironmentOptions> = {};
            if (client) {
                environments.client = {
                    // Library code has no `process` in the browser.
                    define: {
                        "process.env.NODE_ENV": JSON.stringify("production"),
                    },
                    build: {
                        outDir: OUT_DIR,
                        emptyOutDir: false,
                        copyPublicDir: false,
                        modulePreload: false,
                        rollupOptions: {
                            input: client,
                            preserveEntrySignatures: "strict",
                            output: {
                                format: "es",
                                entryFileNames: "client.js",
                                // The backend only serves files directly in dist/.
                                chunkFileNames: "[name]-[hash].js",
                                assetFileNames: "[name]-[hash][extname]",
                            },
                        },
                    },
                };
            }
            if (server) {
                environments.ssr = {
                    resolve: {
                        external: [
                            "@tessellatepos/sdk",
                            "@tessellatepos/plugin-sdk",
                        ],
                    },
                    build: {
                        ssr: server,
                        outDir: OUT_DIR,
                        emptyOutDir: false,
                        target: "node22",
                        rollupOptions: {
                            output: { entryFileNames: "index.js" },
                        },
                    },
                };
            }

            return {
                esbuild: { jsx: "automatic" },
                environments,
                builder: {
                    async buildApp(builder) {
                        // Both environments write to dist/, so clear it once.
                        await rm(path.resolve(root, OUT_DIR), {
                            recursive: true,
                            force: true,
                        });
                        for (const environment of Object.values(
                            builder.environments,
                        )) {
                            await builder.build(environment);
                        }
                    },
                },
            };
        },

        resolveId(id) {
            if (this.environment.name !== "client") return null;
            return isSharedSpecifier(id) ? VIRTUAL_PREFIX + id : null;
        },

        async load(id) {
            if (!id.startsWith(VIRTUAL_PREFIX)) return null;
            const specifier = id.slice(
                VIRTUAL_PREFIX.length,
            ) as SharedSpecifier;
            if (!exportNames.has(specifier)) {
                exportNames.set(specifier, readExportNames(root, specifier));
            }
            return sharedModuleCode(
                specifier,
                await exportNames.get(specifier)!,
            );
        },
    };
}

/**
 * Lists a module's named exports from the version installed in the plugin
 * project. CommonJS packages (React) expose most names only on `default`.
 */
async function readExportNames(
    root: string,
    specifier: SharedSpecifier,
): Promise<string[]> {
    const require = createRequire(path.join(root, "package.json"));
    const ns = (await import(
        pathToFileURL(require.resolve(specifier)).href
    )) as Record<string, unknown>;
    const fromDefault =
        typeof ns.default === "object" && ns.default !== null
            ? Object.keys(ns.default)
            : [];
    const names = new Set([...Object.keys(ns), ...fromDefault]);
    names.delete("default");
    return [...names].filter((name) => IDENTIFIER.test(name)).sort();
}

function sharedModuleCode(specifier: SharedSpecifier, names: string[]): string {
    // Locals are prefixed so they can't collide with an exported name.
    const key = JSON.stringify(specifier);
    return `const __host = globalThis[${JSON.stringify(SHARED_GLOBAL)}]?.[${key}];
if (!__host) {
    throw new Error("Tessellate host did not provide " + ${key} + ": plugin bundles must be loaded by the Tessellate frontend.");
}
const __missing = ${JSON.stringify(names)}.filter((name) => !(name in __host));
if (__missing.length > 0) {
    console.warn("[tessellate] host " + ${key} + " is missing exports this plugin was built against (host is older?): " + __missing.join(", "));
}
export default "default" in __host ? __host.default : __host;
export const { ${names.join(", ")} } = __host;
`;
}
