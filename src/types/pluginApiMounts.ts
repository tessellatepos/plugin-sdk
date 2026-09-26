import type { PluginServerContext } from "@/server/host/context.ts";

export interface PluginApiMountDefinition {
    route: string;
    method: PluginApiMethod;
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
