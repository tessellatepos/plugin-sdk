import type {
    Customer,
    InvoiceStatus,
    Order,
    PaymentProcessorCapabilities,
    ProcessorEvent,
} from "@tessellatepos/sdk";

/** An inbound webhook exactly as received: the signature covers the raw body. */
export interface RawWebhookRequest {
    /** Header names are lower-cased. */
    headers: Record<string, string | string[] | undefined>;
    rawBody: Buffer;
    /** The public URL the request was sent to; some signatures cover it. */
    url: string;
}

/**
 * A way to take payment online, contributed with
 * `plugin.register("paymentProcessor", processor)` (PAYMENT permission).
 *
 * Every processor hands the shopper to a hosted page or invoice and learns the
 * result by signed webhook. Card data never passes through the host, so a
 * processor must not ask for it. The host serves `POST /webhooks/<id>` and
 * passes the request to `handleWebhook`.
 */
export interface PaymentProcessor {
    /** The plugin's name, or "<plugin name>-<suffix>". Lowercase, `a-z0-9_-`. */
    id: string;
    label: string;
    /** Only the operations listed as supported are ever called. */
    capabilities: PaymentProcessorCapabilities;
    createCheckout?(req: {
        order: Order;
        successUrl: string;
        cancelUrl: string;
        customer?: Customer;
    }): Promise<{ externalId: string; url: string; expiresAt?: string }>;
    createInvoice?(req: {
        order: Order;
        customer: Customer;
        dueDate: string;
        delivery: "EMAIL" | "SMS" | "SHARE_MANUALLY";
        message?: string;
    }): Promise<{ externalId: string; url?: string; status: InvoiceStatus }>;
    cancelInvoice?(externalId: string): Promise<void>;
    /**
     * Verify the webhook's signature and turn it into events. Throw for
     * anything unsigned or invalid: the host answers a bare 401 and never
     * shows the error. Event ids must be stable across redeliveries.
     */
    handleWebhook(req: RawWebhookRequest): Promise<ProcessorEvent[]>;
}
