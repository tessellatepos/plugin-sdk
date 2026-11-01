import type { PluginServerContext } from "@/server/host/context.ts";
import type { PluginGatewayOperation } from "@/types/gateway.ts";

export interface PluginApiMountDefinition {
    route: string;
    method: PluginApiMethod;
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
