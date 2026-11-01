import type { ZodType } from "zod";
import type { Scope } from "@tessellatepos/sdk";

/**
 * Where the location a gateway operation acts on travels in the request:
 * `path` is the `:locationId` route parameter, `query` and `body` are the
 * `location_id` query parameter or body field, `none` means the operation
 * is not tied to one location (the handler still applies the credential's
 * locations).
 */
export type GatewayLocation = "path" | "query" | "body" | "none";

export type GatewayMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * One operation the gateway may expose. Declared next to the route it wraps;
 * a route without a descriptor is never exposed (deny by default).
 * `request` and `response` are zod schemas in the wire form (amounts are
 * digit strings). zod is an optional peer: it is needed only to declare
 * operations.
 */
export interface GatewayOperation {
    method: GatewayMethod;
    /** Relative to the mount: the router path, or the plugin route. */
    path: string;
    /** Unique across the host and every plugin, e.g. "customers.get". */
    operationId: string;
    /** The scope a credential must hold to call it. */
    scope: Scope;
    summary: string;
    location: GatewayLocation;
    request?: ZodType;
    response: ZodType;
}

/**
 * A gateway descriptor on a plugin API mount. The mount already fixes the
 * method and path, so only the rest is declared.
 */
export type PluginGatewayOperation = Omit<GatewayOperation, "method" | "path">;
