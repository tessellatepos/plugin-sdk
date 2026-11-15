export type { PluginServerContext } from "@/server/host/context.ts";
export type { PluginTableHooks } from "@/server/host/tableHooks.ts";
export type { ServerPlugin } from "@/server/host/plugin.ts";

export { defineMemberAuth } from "@/server/host/member.ts";
export type {
    MemberAuthProvider,
    MemberDecision,
    MemberProfile,
} from "@/server/host/member.ts";

export { defineAuthProvider } from "@/server/host/auth.ts";
export type {
    AccessDecision,
    AuthProvider,
    AuthRequest,
    BetterAuthPluginLike,
    ExternalProfile,
} from "@/server/host/auth.ts";

export { defineHook, defineEvent, hooks, events } from "@/server/host/hooks.ts";

export type {
    HookContext,
    EventContext,
    InvoiceCreateRequest,
    HookDefinition,
    HookResult,
    EventDefinition,
} from "@/server/host/hooks.ts";

export type {
    PaymentProcessor,
    RawWebhookRequest,
} from "@/server/host/processor.ts";
