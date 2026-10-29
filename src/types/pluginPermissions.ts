export enum PluginPermission {
    /** Contribute sign-in methods via `plugin.register("auth", ...)`. */
    AUTH = "AUTH",
    CART = "CART",
    CATALOG = "CATALOG",
    CHECKOUT = "CHECKOUT",
    DEVICE = "DEVICE",
    ORDER = "ORDER",
}

export interface PluginPermissionProvider {
    auth: boolean;
    cart: boolean;
    catalog: boolean;
    checkout: boolean;
    device: boolean;
    order: boolean;
}
