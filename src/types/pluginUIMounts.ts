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
}
