import { createHmac, timingSafeEqual } from "node:crypto";

/** The body every webhook carries. */
export interface WebhookEvent<T = unknown> {
    id: string;
    type: string;
    created_at: string;
    data: T;
}

/** Thrown by {@link verifyWebhook} when a delivery cannot be trusted. */
export class WebhookVerificationError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "WebhookVerificationError";
    }
}

/** How far a signature's timestamp may be from now, in seconds. */
export const DEFAULT_TOLERANCE_SECONDS = 300;

/**
 * Checks a `Tessellate-Signature` header against the raw request body and
 * returns the parsed event. Pass the exact bytes received, not a re-encoded
 * JSON object: re-serialising changes the signature.
 * @param rawBody the request body as received
 * @param header the `Tessellate-Signature` header value
 * @param secret the credential's webhook secret
 * @param options the allowed clock skew and a clock for tests
 * @param options.toleranceSeconds how old or new a signature may be
 * @param options.now the current time in milliseconds
 * @returns the parsed event
 * @throws WebhookVerificationError when the header is missing or malformed,
 * the signature is wrong, or the timestamp is outside the tolerance
 */
export function verifyWebhook<T = unknown>(
    rawBody: string | Uint8Array,
    header: string | null | undefined,
    secret: string,
    options: { toleranceSeconds?: number; now?: number } = {},
): WebhookEvent<T> {
    const match = /^t=(\d+),v1=([0-9a-f]{64})$/.exec(header ?? "");
    if (!match) throw new WebhookVerificationError("Malformed signature");
    const timestamp = Number(match[1]);
    const body =
        typeof rawBody === "string"
            ? rawBody
            : Buffer.from(rawBody).toString("utf8");
    const expected = createHmac("sha256", secret)
        .update(`${timestamp}.${body}`)
        .digest();
    const given = Buffer.from(match[2], "hex");
    if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
        throw new WebhookVerificationError("Signature does not match");
    }
    const nowSeconds = Math.floor((options.now ?? Date.now()) / 1000);
    const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
    if (Math.abs(nowSeconds - timestamp) > tolerance) {
        throw new WebhookVerificationError("Timestamp outside tolerance");
    }
    return JSON.parse(body) as WebhookEvent<T>;
}
