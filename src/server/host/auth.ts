import type { PluginApiMountDefinition } from "@/types/pluginApiMounts.ts";

/**
 * The profile an external identity provider returned for a user, normalised
 * by the host. Passed to `AuthProvider.resolveAccess`.
 */
export interface ExternalProfile {
    /** Id of the provider that authenticated the user (`AuthProvider.id`). */
    provider: string;
    /** The user's stable id at the provider (OIDC `sub`). */
    subject: string;
    email?: string;
    /** Whether the provider vouches for `email`. Do not trust it when absent. */
    email_verified?: boolean;
    name?: string;
    username?: string;
    /** The unmodified claims or user info the provider returned. */
    raw: Record<string, unknown>;
}

/**
 * The minimal view of an HTTP request an auth hook sees. It has no body and
 * no framework types.
 */
export interface AuthRequest {
    readonly method: string;
    readonly path: string;
    /** Header names are lower-cased. */
    readonly headers: Readonly<Record<string, string | string[] | undefined>>;
    readonly query: Readonly<Record<string, string | string[] | undefined>>;
}

/**
 * The outcome of `AuthProvider.resolveAccess`: the roles to grant, or a
 * reason to refuse the login.
 */
export type AccessDecision = { roles: string[] } | { deny: string };

/**
 * Opaque stand-in for a better-auth plugin, so plugin-sdk does not depend on
 * better-auth. The host passes the value to better-auth unchanged.
 */
export interface BetterAuthPluginLike {
    id: string;
    [key: string]: unknown;
}

/**
 * A sign-in method a plugin contributes. Register it with
 * `plugin.register("auth", provider)`; this needs the `AUTH` permission.
 * Plugins add sign-in methods, never their own sessions.
 */
export interface AuthProvider {
    /** Unique id, e.g. "acme-sso". */
    id: string;
    /** Login button text. */
    label: string;
    /** Declarative OpenID Connect; the host wires it into better-auth. */
    oidc?: {
        discoveryUrl: string;
        clientId: string;
        clientSecret: string;
        scopes?: string[];
    };
    /** Declarative OAuth 2 with explicit endpoints. */
    oauth?: {
        authorizationUrl: string;
        tokenUrl: string;
        userInfoUrl: string;
        clientId: string;
        clientSecret: string;
        scopes?: string[];
    };
    /** A social login better-auth already ships. */
    social?: {
        provider: "google" | "github" | "microsoft" | "apple" | "discord";
        clientId: string;
        clientSecret: string;
    };
    /**
     * Escape hatch for methods better-auth does not ship (PIN, badge). It
     * runs arbitrary code in the host.
     */
    betterAuthPlugin?: BetterAuthPluginLike;
    /**
     * Maps the external profile to host roles. Only roles in the manifest's
     * `tessellate.authRoles` (further capped by the host) are granted, and
     * never `owner`. A `deny` or a throw blocks the login.
     */
    resolveAccess?(
        profile: ExternalProfile,
    ): AccessDecision | Promise<AccessDecision>;
    /** Extra routes under /plugins/<plugin name>/auth/. */
    routes?: PluginApiMountDefinition[];
}

/** Identity helper that gives an `AuthProvider` literal full type checking. */
export function defineAuthProvider<T extends AuthProvider>(provider: T): T {
    return provider;
}
