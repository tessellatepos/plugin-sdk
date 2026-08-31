import type { Order, Item } from "@tessellatepos/sdk";

export interface PluginServerHooks {
    order?: {
        get(orderId: string): Promise<Order>;
        onCreated(cb: (order: Order) => void): void;
    };
    catalog?: {
        lookup(itemId: string): Promise<Item>;
    };
}
