/** Where the gateway lives under the store's host. */
const GATEWAY_PATH = "/gateway/v1";

export interface GatewayClientOptions {
    /** The store's public address, e.g. "https://pos.example.com". */
    baseUrl: string;
    clientId: string;
    /** Omit it for a read-only browser client (needs allowed origins). */
    clientSecret?: string;
    /** Defaults to the global fetch. */
    fetch?: typeof fetch;
}

export interface GatewayRequestOptions {
    /** Values for `{name}` placeholders in the path. */
    params?: Record<string, string>;
    query?: Record<string, string | number | undefined>;
    body?: unknown;
    /** Sent as `Idempotency-Key` so a retried write is not repeated. */
    idempotencyKey?: string;
}

/** The gateway's error body, `{ message, code }`, with the HTTP status. */
export class GatewayError extends Error {
    constructor(
        readonly status: number,
        readonly code: string,
        message: string,
    ) {
        super(message);
        this.name = "GatewayError";
    }
}

export interface GatewayClient {
    /**
     * Calls an operation. `path` is the OpenAPI path, e.g. `/items/{locationId}`;
     * the generated client (`tessellate-gateway generate`) types the result.
     */
    request<T = unknown>(
        method: string,
        path: string,
        options?: GatewayRequestOptions,
    ): Promise<T>;
}

/** The JSON body of an operation's 200/201 response, from generated types. */
export type OperationResponse<Op> = Op extends {
    responses: infer R;
}
    ? R extends { 200: { content: { "application/json": infer B } } }
        ? B
        : R extends { 201: { content: { "application/json": infer B } } }
          ? B
          : unknown
    : unknown;

/** The JSON request body of an operation, from generated types. */
export type OperationBody<Op> = Op extends {
    requestBody?: { content: { "application/json": infer B } };
}
    ? B
    : never;

/** The query parameters of an operation, from generated types. */
export type OperationQuery<Op> = Op extends {
    parameters: { query?: infer Q };
}
    ? Q
    : never;

/**
 * Creates a client for the gateway. It sends the credential as HTTP Basic.
 * @param options the store address and credential
 * @returns the client
 */
export function createGatewayClient(
    options: GatewayClientOptions,
): GatewayClient {
    const base = options.baseUrl.replace(/\/+$/, "");
    const root = base.endsWith(GATEWAY_PATH) ? base : base + GATEWAY_PATH;
    const doFetch = options.fetch ?? fetch;
    const auth = `Basic ${btoa(`${options.clientId}:${options.clientSecret ?? ""}`)}`;

    return {
        async request<T>(
            method: string,
            path: string,
            request: GatewayRequestOptions = {},
        ): Promise<T> {
            const filled = path.replace(/\{(\w+)\}/g, (_m, name: string) => {
                const value = request.params?.[name];
                if (value === undefined) {
                    throw new Error(`Missing path parameter "${name}"`);
                }
                return encodeURIComponent(value);
            });
            const url = new URL(root + filled);
            for (const [key, value] of Object.entries(request.query ?? {})) {
                if (value !== undefined)
                    url.searchParams.set(key, String(value));
            }
            const headers: Record<string, string> = {
                Authorization: auth,
                Accept: "application/json",
            };
            if (request.body !== undefined) {
                headers["Content-Type"] = "application/json";
            }
            if (request.idempotencyKey) {
                headers["Idempotency-Key"] = request.idempotencyKey;
            }
            const res = await doFetch(url, {
                method: method.toUpperCase(),
                headers,
                body:
                    request.body === undefined
                        ? undefined
                        : JSON.stringify(request.body),
            });
            const text = await res.text();
            const json: unknown = text ? JSON.parse(text) : undefined;
            if (!res.ok) {
                const err = (json ?? {}) as { code?: string; message?: string };
                throw new GatewayError(
                    res.status,
                    err.code ?? "error",
                    err.message ?? `HTTP ${res.status}`,
                );
            }
            return json as T;
        },
    };
}
