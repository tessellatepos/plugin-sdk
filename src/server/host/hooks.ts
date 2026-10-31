import type {
    Order,
    Money,
    TenderType,
    Customer,
    CustomerInput,
    OnlinePayment,
    Principal,
} from "@tessellatepos/sdk";

/**
 * Who caused an action and where it came from, passed to every hook handler
 * and event listener as the last argument. Staff, tills, gateway credentials
 * and inbound processor webhooks all reach the same hooks, so a plugin that
 * should act only on online orders checks `source`.
 */
export interface HookContext {
    /**
     * The caller. Null when nothing authenticated caused it, for example a
     * payment learned from a processor's signed webhook.
     */
    principal: Principal | null;
    /**
     * The order's source name: the gateway credential's name for an online
     * order, null for orders taken at a till.
     */
    source: string | null;
}

/** Events receive the same context as hooks. */
export type EventContext = HookContext;

/** What `beforeInvoiceCreate` sees and may modify (not `order` or `customer`). */
export interface InvoiceCreateRequest {
    order: Order;
    customer: Customer;
    /** ISO 8601 date. */
    dueDate: string;
    delivery: "EMAIL" | "SMS" | "SHARE_MANUALLY";
    message?: string;
}

export const hooks = {
    beforeOrderCreate: defineHook<Order>("beforeOrderCreate"),
    beforeCheckout: defineHook<{ orderId: string; amount: Money }, void>(
        "beforeCheckout",
    ),
    beforePayment: defineHook<{ orderId: string; method: TenderType }, void>(
        "beforePayment",
    ),
    /**
     * Runs before a customer is created or updated. A plugin may return a
     * modified `CustomerInput` or block the save. `existingId` is set for
     * updates. Requires the CUSTOMER permission.
     */
    beforeCustomerSave: defineHook<
        { customer: CustomerInput; existingId?: string },
        CustomerInput
    >("beforeCustomerSave"),
    /**
     * Runs before an invoice is created for an order. A plugin may change
     * `dueDate`, `delivery` and `message`, or block it. The request holds the
     * customer's contact details, so only plugins with the CUSTOMER
     * permission are called.
     */
    beforeInvoiceCreate: defineHook<InvoiceCreateRequest>(
        "beforeInvoiceCreate",
    ),
};

export const events = {
    orderCreated:
        defineEvent<(order: Order, ctx: EventContext) => void>("orderCreated"),
    paymentCompleted:
        defineEvent<
            (order: Order, method: TenderType, ctx: EventContext) => void
        >("paymentCompleted"),
    orderCancelled:
        defineEvent<(order: Order, ctx: EventContext) => void>(
            "orderCancelled",
        ),
    /** An invoice was created (status `draft` or `sent`). */
    invoiceCreated: defineInvoiceEvent("invoiceCreated"),
    invoiceSent: defineInvoiceEvent("invoiceSent"),
    invoiceViewed: defineInvoiceEvent("invoiceViewed"),
    invoicePaid: defineInvoiceEvent("invoicePaid"),
    invoiceOverdue: defineInvoiceEvent("invoiceOverdue"),
    invoiceCanceled: defineInvoiceEvent("invoiceCanceled"),
    invoiceRefunded: defineInvoiceEvent("invoiceRefunded"),
    customerCreated:
        defineEvent<(customer: Customer) => void>("customerCreated"),
    customerUpdated:
        defineEvent<(customer: Customer, previous: Customer) => void>(
            "customerUpdated",
        ),
    customerDeleted:
        defineEvent<(customerId: string) => void>("customerDeleted"),
};

function defineInvoiceEvent(name: string) {
    return defineEvent<
        (invoice: OnlinePayment, order: Order, ctx: EventContext) => void
    >(name);
}

export type HookResult<T> =
    { ok: true; value: T } | { ok: false; reason: string; code?: string };

export interface HookDefinition<TInput, TOutput = TInput> {
    readonly name: string;
    readonly kind: "hook";
    readonly _input: TInput;
    readonly _output: TOutput;
}

export interface EventDefinition<THandler extends (...args: never[]) => void> {
    readonly name: string;
    readonly kind: "event";
    readonly _handler: THandler;
}

export function defineHook<TInput, TOutput = TInput>(
    name: string,
): HookDefinition<TInput, TOutput> {
    return { name, kind: "hook" } as HookDefinition<TInput, TOutput>;
}

export function defineEvent<THandler extends (...args: never[]) => void>(
    name: string,
): EventDefinition<THandler> {
    return { name, kind: "event" } as EventDefinition<THandler>;
}
