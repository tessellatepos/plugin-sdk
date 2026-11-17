import type { PluginDatabaseRepository } from "@/types/pluginDatabaseMounts.ts";
import type {
    Order,
    Item,
    Customer,
    CustomerQuery,
    CustomerPage,
    Principal,
    Member,
    MemberPage,
    MemberQuery,
} from "@tessellatepos/sdk";

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
    /**
     * Fetch a customer by id, or `null` if not found. Requires the CUSTOMER
     * permission; the host rejects the promise with a clear error otherwise.
     */
    getCustomer(customerId: string): Promise<Customer | null>;
    /**
     * Search customers. Requires the CUSTOMER permission; the host rejects the
     * promise with a clear error otherwise.
     */
    findCustomers(query: CustomerQuery): Promise<CustomerPage>;
    /**
     * This plugin's members. Requires the MEMBER_AUTH permission; the host
     * rejects the promise with a clear error otherwise. A plugin sees only
     * members its own login created.
     */
    members: {
        get(memberId: string): Promise<Member | null>;
        find(query: Omit<MemberQuery, "plugin">): Promise<MemberPage>;
    };
}
