import type { PluginPermission } from "@/types/pluginPermissions.ts";

export interface PluginManifestAuthor {
    name: string;
    email?: string;
    url?: string;
}

export interface PluginManifestBugs {
    url?: string;
    email?: string;
}

export interface PluginManifestFunding {
    type?: string;
    url: string;
}

// This describes the fields the plugin host reads out of a plugin's own
// package.json It must stay JSON-serializable
export interface PluginManifest {
    name: string;
    version: string;
    description?: string;
    keywords?: string[];
    homepage?: string;
    bugs?: string | PluginManifestBugs;
    license?: string;
    author?: string | PluginManifestAuthor;
    contributors?: (string | PluginManifestAuthor)[];
    maintainers?: (string | PluginManifestAuthor)[];
    funding?:
        string | PluginManifestFunding | (string | PluginManifestFunding)[];
    main: string;
    // npm's `engines` field, used to declare which Tessellate SDK
    // version a plugin targets alongside any real engine constraints (node, etc.)
    engines?: {
        tessellate?: string;
        [engine: string]: string | undefined;
    };
    tessellate: {
        permissions: PluginPermission[];
        /**
         * Roles this plugin's auth provider may grant. The host caps this
         * further by what the owner allows, and `owner` is never grantable.
         */
        authRoles?: string[];
        /**
         * Scopes this plugin's gateway operations use, each written
         * `plugin:<plugin name>:<verb>` (verb: lowercase letters, digits and
         * dashes). An operation may use only scopes listed here, and the
         * owner can grant only these to credentials.
         */
        gatewayScopes?: string[];
    };
}
