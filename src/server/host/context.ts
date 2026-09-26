import type { PluginDatabaseRepository } from "@/types/pluginDatabaseMounts.ts";
import type { Order, Item } from "@tessellatepos/sdk";

export interface PluginServerContext {
    db: PluginDatabaseRepository;
    session: { deviceId: string; locationId: string };
    getOrder(orderId: string): Promise<Order | null>;
    lookupItem(itemId: string): Promise<Item | null>;
}
