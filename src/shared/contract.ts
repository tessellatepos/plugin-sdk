// The runtime contract between the Tessellate frontend and plugin client
// bundles. The host publishes its own instances of these modules on a
// global; plugins built with the Vite plugin (`@tessellatepos/plugin-sdk/vite`)
// read them from there instead of bundling their own copies. A second React
// copy in one tree makes every hook throw, and sharing the SDKs keeps
// plugins to their own code.

export const SHARED_GLOBAL = "__TESSELLATE_SHARED__";

export const SHARED_SPECIFIERS = [
    "react",
    "react/jsx-runtime",
    "@tessellatepos/sdk",
    "@tessellatepos/plugin-sdk",
] as const;

export type SharedSpecifier = (typeof SHARED_SPECIFIERS)[number];

export function isSharedSpecifier(id: string): id is SharedSpecifier {
    return (SHARED_SPECIFIERS as readonly string[]).includes(id);
}
