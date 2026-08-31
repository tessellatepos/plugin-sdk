import type { CartItem, Discount, Order } from "@tessellatepos/sdk";
import type { PluginApiMethod } from "@/types/pluginApiMounts.ts";

export interface CartApi {
    getItems(): CartItem[];
    getTotal(): bigint;
    addQuantity(item: CartItem): void;
    removeQuantity(item: CartItem): void;
    removeItem(item: CartItem): void;
    clearCart(): void;
}

export interface OrderApi {
    discounts: Discount[];
    completedOrder: Order | null;
}

export interface SettingsApi {
    locationId: string;
    deviceId: string;
}

export interface PluginApiClient {
    call<T>(
        route: string,
        method: PluginApiMethod,
        params?: Record<string, string>,
        body?: unknown,
    ): Promise<T>;
}

export interface PluginContext {
    cart: CartApi;
    order: OrderApi;
    settings: SettingsApi;
    navigate: (path: string) => void;
    api: PluginApiClient;
}
