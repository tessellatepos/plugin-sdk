export enum PluginPermission {
    CART = "CART",
    CATALOG = "CATALOG",
    CHECKOUT = "CHECKOUT",
    DEVICE = "DEVICE",
    ORDER = "ORDER",
}

export interface PluginPermissionProvider {
    cart: boolean;
    catalog: boolean;
    checkout: boolean;
    device: boolean;
    order: boolean;
}
