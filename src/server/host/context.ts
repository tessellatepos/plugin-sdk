import type { PluginDatabaseRepository } from "@/types/pluginDatabaseMounts.ts";
import type { Order, Item, Principal } from "@tessellatepos/sdk";

export interface PluginServerContext {
    db: PluginDatabaseRepository;
    /**
     * The authenticated caller. Null only when the host runs without a
     * resolved caller; handlers must treat null as unauthenticated.
     */
    principal: Principal | null;
    session: { deviceId: string; locationId: string };
    getOrder(orderId: string): Promise<Order | null>;
    lookupItem(itemId: string): Promise<Item | null>;
}
