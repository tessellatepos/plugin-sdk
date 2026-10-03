import { SHARED_GLOBAL, type SharedSpecifier } from "@/shared/contract.ts";

export type { SharedSpecifier } from "@/shared/contract.ts";

/**
 * Hands the host's own module instances to plugin client bundles. Call it
 * once, before importing any plugin bundle:
 *
 *     import * as React from "react";
 *     import * as jsxRuntime from "react/jsx-runtime";
 *     import * as sdk from "@tessellatepos/sdk";
 *     import * as pluginSdk from "@tessellatepos/plugin-sdk";
 *
 *     exposeSharedModules({
 *         react: React,
 *         "react/jsx-runtime": jsxRuntime,
 *         "@tessellatepos/sdk": sdk,
 *         "@tessellatepos/plugin-sdk": pluginSdk,
 *     });
 *
 * The host passes the modules in, rather than this package importing them,
 * so plugins always get exactly the instances the host renders with.
 */
export function exposeSharedModules(
    modules: Record<SharedSpecifier, object>,
): void {
    (globalThis as Record<string, unknown>)[SHARED_GLOBAL] = { ...modules };
}
