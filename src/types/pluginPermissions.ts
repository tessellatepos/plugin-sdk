export enum PluginPermission {
    /** Contribute sign-in methods via `plugin.register("auth", ...)`. */
    AUTH = "AUTH",
    CART = "CART",
    CATALOG = "CATALOG",
    CHECKOUT = "CHECKOUT",
    /** Read customers and receive customer hooks/events (contains PII). */
    CUSTOMER = "CUSTOMER",
    DEVICE = "DEVICE",
    /** Contribute a member login via `plugin.register("memberAuth", ...)` and read the plugin's members. */
    MEMBER_AUTH = "MEMBER_AUTH",
    ORDER = "ORDER",
    /** Contribute a payment processor via `plugin.register("paymentProcessor", ...)`. */
    PAYMENT = "PAYMENT",
}

export interface PluginPermissionProvider {
    auth: boolean;
    cart: boolean;
    catalog: boolean;
    checkout: boolean;
    customer: boolean;
    device: boolean;
    memberAuth: boolean;
    order: boolean;
    payment: boolean;
}
