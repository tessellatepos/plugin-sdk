export enum PluginPermission {
    /** Contribute sign-in methods via `plugin.register("auth", ...)`. */
    AUTH = "AUTH",
    CART = "CART",
    CATALOG = "CATALOG",
    CHECKOUT = "CHECKOUT",
    /** Read customers and receive customer hooks/events (contains PII). */
    CUSTOMER = "CUSTOMER",
    DEVICE = "DEVICE",
    ORDER = "ORDER",
}

export interface PluginPermissionProvider {
    auth: boolean;
    cart: boolean;
    catalog: boolean;
    checkout: boolean;
    customer: boolean;
    device: boolean;
    order: boolean;
}
