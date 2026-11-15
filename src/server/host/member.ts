import type { MemberSignupPolicy } from "@tessellatepos/sdk";

/**
 * The profile a member login's identity provider returned, normalised by the
 * host from the provider's user-info response. Passed to
 * `MemberAuthProvider.resolveMember`.
 */
export interface MemberProfile {
    /** Id of the member login that authenticated them (`MemberAuthProvider.id`). */
    provider: string;
    /** The member's stable id at the provider (`sub`, else `id`). */
    subject: string;
    email?: string;
    /** Whether the provider vouches for `email`. Do not trust it when absent. */
    email_verified?: boolean;
    /** `name`, else `global_name`, else `username` from the user info. */
    name?: string;
    username?: string;
    /** The unmodified user-info response. */
    raw: Record<string, unknown>;
}

/**
 * The outcome of `MemberAuthProvider.resolveMember`: how to describe the
 * member, or a reason to refuse the login.
 */
export type MemberDecision =
    { display_name?: string; email?: string } | { deny: string };

/**
 * A login for the plugin's own members (people who are not staff). Register
 * it with `plugin.register("memberAuth", provider)`; this needs the
 * `MEMBER_AUTH` permission.
 *
 * The host runs the OAuth 2 redirect and callback, creates or finds the
 * member, and issues the session. Plugins never mint sessions, and a member
 * never receives roles or core scopes: it holds only this plugin's
 * `plugin:<name>:member` scope, on routes declared with `access: "member"`.
 */
export interface MemberAuthProvider {
    /** Unique within the plugin, e.g. "discord". */
    id: string;
    /** Login button text. */
    label: string;
    /**
     * OAuth 2 authorization-code flow with explicit endpoints. Credentials
     * may be empty strings: the owner can supply them in Settings, and the
     * login stays inactive until they are present. The redirect URL to
     * register at the provider is
     * `<public url>/member/<plugin name>/auth/<id>/callback`.
     */
    oauth: {
        authorizationUrl: string;
        tokenUrl: string;
        userInfoUrl: string;
        clientId: string;
        clientSecret: string;
        scopes?: string[];
    };
    /**
     * How new members join. Defaults to "approval", the safer choice; the
     * owner can change it per plugin in Settings.
     */
    signup?: MemberSignupPolicy;
    /**
     * Describes the member from the provider's profile, or denies the login
     * (for example "not in the guild"). A deny or a throw blocks the login,
     * and when omitted every authenticated profile is accepted.
     */
    resolveMember?(
        profile: MemberProfile,
    ): MemberDecision | Promise<MemberDecision>;
}

/** Identity helper that gives a `MemberAuthProvider` literal full type checking. */
export function defineMemberAuth<T extends MemberAuthProvider>(provider: T): T {
    return provider;
}
