import type {
    Order,
    Money,
    TenderType,
    Customer,
    CustomerInput,
} from "@tessellatepos/sdk";

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
};

export const events = {
    orderCreated: defineEvent<(order: Order) => void>("orderCreated"),
    paymentCompleted:
        defineEvent<(order: Order, method: TenderType) => void>(
            "paymentCompleted",
        ),
    orderCancelled: defineEvent<(order: Order) => void>("orderCancelled"),
    customerCreated:
        defineEvent<(customer: Customer) => void>("customerCreated"),
    customerUpdated:
        defineEvent<(customer: Customer, previous: Customer) => void>(
            "customerUpdated",
        ),
    customerDeleted:
        defineEvent<(customerId: string) => void>("customerDeleted"),
};

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
