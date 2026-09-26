import { bigintReplacer } from "@tessellatepos/sdk";
import type { PluginApiMethod } from "@/types/pluginApiMounts.ts";
import type { PluginApiClient } from "@/client/context.ts";

/**
 * Creates a PluginApiClient scoped to a single plugin. All calls are
 * routed to `/plugins/:pluginName/:route` on the backend, where the
 * dispatcher only matches that plugin's own API mounts — a plugin
 * cannot reach another plugin's routes.
 *
 * The route is sanitized to prevent path traversal (`..`) from escaping
 * the plugin's namespace.
 */
export function createPluginApiClient(
    backendUrl: string,
    pluginName: string,
): PluginApiClient {
    return {
        async call<T>(
            route: string,
            method: PluginApiMethod,
            params?: Record<string, string>,
            body?: unknown,
        ): Promise<T> {
            // Normalize route: ensure leading slash, reject path traversal
            const normalizedRoute = route.startsWith("/") ? route : `/${route}`;
            if (normalizedRoute.includes("..")) {
                throw new Error(
                    `Plugin API route contains illegal path segment: ${route}`,
                );
            }

            const url = new URL(
                `/plugins/${pluginName}${normalizedRoute}`,
                backendUrl,
            );

            // Verify the resolved pathname is still within the plugin namespace
            const expectedPrefix = `/plugins/${pluginName}/`;
            if (!url.pathname.startsWith(expectedPrefix)) {
                throw new Error(
                    `Plugin API route escaped plugin namespace: ${route}`,
                );
            }
            if (params) {
                for (const [key, value] of Object.entries(params)) {
                    url.searchParams.set(key, value);
                }
            }

            const res = await fetch(url, {
                method,
                headers:
                    body !== undefined
                        ? { "Content-Type": "application/json" }
                        : {},
                body:
                    body !== undefined
                        ? JSON.stringify(body, bigintReplacer)
                        : undefined,
            });

            if (!res.ok) {
                throw new Error(
                    `Plugin API call failed: ${method} ${route} → ${res.status}`,
                );
            }

            // TODO: bigint fields in the response arrive as strings because
            // the backend serializes with bigintReplacer. Auto-revival without
            // type markers is unreliable, so callers must use parseMoney() or
            // BigInt() on amount fields as needed.
            return res.json() as Promise<T>;
        },
    };
}
