import type React from "react";
import type { PluginContext } from "@/client/context.ts";

export interface PluginUIMountDefinition {
    mount: PluginUIMountPoint;
    component: React.ComponentType<{ context: PluginContext }>;
}

export enum PluginUIMountPoint {
    PAGE = "page",
    CART_SIDEBAR = "cart-sidebar",
    CHECKOUT_FOOTER = "checkout-footer",
    SETTINGS_TAB = "settings-tab",
    RECEIPT_EXTRA = "receipt-extra",
    /** Login screen UI for sign-in methods needing their own UI (PIN pad). */
    AUTH_METHOD = "auth-method",
    /** Panel beside the customer attached to the cart (loyalty, notes). */
    CUSTOMER_PANEL = "customer-panel",
    /** A card on the dashboard, shown to users who can read it. */
    DASHBOARD_WIDGET = "dashboard-widget",
}
