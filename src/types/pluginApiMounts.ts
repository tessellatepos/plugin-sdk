import type { PluginServerContext } from "@/server/host/context.ts";
import type { PluginGatewayOperation } from "@/types/gateway.ts";

export interface PluginApiMountDefinition {
    route: string;
    method: PluginApiMethod;
    /**
     * Who may call the route. "staff" (the default) serves it at
     * /plugins/<plugin name>/... to signed-in staff and tills. "member" serves
     * it at /member/<plugin name>/... to this plugin's signed-in members only,
     * and may be reached from the public host. A "member" route cannot also
     * be exposed through the gateway.
     */
    access?: PluginApiAccess;
    /**
     * Exposes this route through the API gateway. Omit it and the route stays
     * internal to the host.
     */
    gateway?: PluginGatewayOperation;
    handler: (
        req: PluginApiRequest,
        ctx: PluginServerContext,
    ) => Promise<PluginApiResponse> | PluginApiResponse;
}

export type PluginApiAccess = "staff" | "member";

export enum PluginApiMethod {
    GET = "GET",
    POST = "POST",
    PUT = "PUT",
    DELETE = "DELETE",
}

export interface PluginApiRequest {
    params: Record<string, string>;
    query: Record<string, string>;
    body: unknown;
}

export interface PluginApiResponse {
    status?: number;
    body: unknown;
}
