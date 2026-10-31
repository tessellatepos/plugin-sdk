# @tessellatepos/plugin-sdk

Contract surface for Tessellate POS plugins: types, mount points, hooks and
events, plus the build tooling plugins use and the helper the host uses to
load them.

| Entry                               | Used by                                     | Contents                                                                                           |
| ----------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `@tessellatepos/plugin-sdk`         | Plugin client code                          | `PluginContext`, `PluginUIMountPoint`, `PluginApiMethod`, `FrontendPlugin`, database column types  |
| `@tessellatepos/plugin-sdk/server`  | Plugin server entry                         | `ServerPlugin`, `PluginServerContext`, `hooks`, `events`, `defineAuthProvider`, `PaymentProcessor` |
| `@tessellatepos/plugin-sdk/vite`    | Plugin `vite.config.ts`                     | `tessellatePlugin()`                                                                               |
| `@tessellatepos/plugin-sdk/host`    | Tessellate frontend                         | `exposeSharedModules()`                                                                            |
| `@tessellatepos/plugin-sdk/gateway` | Stores and integrations calling the gateway | `createGatewayClient`, `verifyWebhook`, `GatewayError`, the `tessellate-gateway` codegen CLI       |

## Permissions, mounts and extension points

Permissions are declared in the manifest (`tessellate.permissions`). A plugin
that uses a surface without its permission fails to load or is refused the
call.

| Permission                                       | Unlocks                                                                                                        |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `AUTH`                                           | `plugin.register("auth", provider)`: sign-in methods. Roles it may grant are listed in `tessellate.authRoles`  |
| `CUSTOMER`                                       | `ctx.getCustomer`, `ctx.findCustomers`, the customer hook and events, and `beforeInvoiceCreate` (all hold PII) |
| `PAYMENT`                                        | `plugin.register("paymentProcessor", processor)`                                                               |
| `CART`, `CATALOG`, `CHECKOUT`, `DEVICE`, `ORDER` | The existing cart, catalog, checkout, device and order surfaces                                                |

UI mount points (`PluginUIMountPoint`):

| Mount                                                                      | Where it renders                                                     |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `PAGE`, `CART_SIDEBAR`, `CHECKOUT_FOOTER`, `SETTINGS_TAB`, `RECEIPT_EXTRA` | The existing places                                                  |
| `AUTH_METHOD`                                                              | Login screen, for a sign-in method that needs its own UI (a PIN pad) |
| `CUSTOMER_PANEL`                                                           | Panel beside the customer attached to the cart                       |
| `DASHBOARD_WIDGET`                                                         | A card on the dashboard, for users who can read it                   |

Hooks run before an action and may change its input or block it; events run
after and are fire-and-forget. Both receive a context as their last argument
(see [Gateway](#gateway-principal-source-scopes-and-operations)).

| Kind   | Names                                                                                                                                                                                                                                  |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hooks  | `beforeOrderCreate`, `beforeCheckout`, `beforePayment`, `beforeCustomerSave`, `beforeInvoiceCreate`                                                                                                                                    |
| Events | `orderCreated`, `paymentCompleted`, `orderCancelled`, `invoiceCreated`, `invoiceSent`, `invoiceViewed`, `invoicePaid`, `invoiceOverdue`, `invoiceCanceled`, `invoiceRefunded`, `customerCreated`, `customerUpdated`, `customerDeleted` |

Server context (`ctx` in API handlers): `ctx.principal` (the caller, `null`
only when unresolved: treat as unauthenticated), `ctx.db`, `ctx.session`,
`ctx.getOrder`, `ctx.lookupItem`, and the `CUSTOMER`-gated customer lookups.

## Customers

Customers are PII, so access is gated by the `CUSTOMER` permission
(`PluginPermission.CUSTOMER`).

| Surface        | Name                                  | Notes                                                                                                                       |
| -------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Hook           | `hooks.beforeCustomerSave`            | Input `{ customer, existingId? }`; return the (possibly modified) `CustomerInput` or block. `existingId` is set for updates |
| Event          | `events.customerCreated`              | `(customer)`                                                                                                                |
| Event          | `events.customerUpdated`              | `(customer, previous)`                                                                                                      |
| Event          | `events.customerDeleted`              | `(customerId)` only                                                                                                         |
| Server context | `ctx.getCustomer(id)`                 | `Customer \| null`                                                                                                          |
| Server context | `ctx.findCustomers(query)`            | `CustomerPage`                                                                                                              |
| UI mount       | `PluginUIMountPoint.CUSTOMER_PANEL`   | Panel beside the customer on the cart                                                                                       |
| UI mount       | `PluginUIMountPoint.DASHBOARD_WIDGET` | Card on the dashboard for users who can read it                                                                             |
| Client context | `context.customer`                    | The customer attached to the current cart, if any                                                                           |

The host rejects `getCustomer` and `findCustomers` calls from plugins without
the `CUSTOMER` permission.

```ts
hooks.beforeCustomerSave; // handler returns { ok: true, value } or { ok: false, reason }
```

Don't log or persist customer fields beyond what the plugin needs; store the
customer id and look the rest up when required.

## Building a plugin

```ts
// vite.config.ts
import { defineConfig } from "vite";
import { tessellatePlugin } from "@tessellatepos/plugin-sdk/vite";

export default defineConfig({ plugins: [tessellatePlugin()] });
```

`vite build` then produces:

- `dist/client.js` from `src/client.tsx`, which the frontend imports. It
  doesn't bundle `react`, `react/jsx-runtime`, `@tessellatepos/sdk` or
  `@tessellatepos/plugin-sdk`; imports of those use the frontend's copies at
  runtime.
- `dist/index.js` from `index.ts`, which the backend loads. Point `main` in
  `package.json` at it.

An entry whose file doesn't exist is skipped. Change the paths, or turn one
off, with `tessellatePlugin({ client: "src/ui.tsx", server: false })`.
`vite build --watch` rebuilds both. `vite` is an optional peer dependency;
install it in the plugin.

## Auth providers

A plugin can add a sign-in method, not its own session system. Declare the
`AUTH` permission, list the roles it may grant in `tessellate.authRoles`, and
register an `AuthProvider` from the server entry:

```ts
import { defineAuthProvider } from "@tessellatepos/plugin-sdk/server";

plugin.register(
    "auth",
    defineAuthProvider({
        id: "acme-sso",
        label: "Sign in with Acme",
        oidc: { discoveryUrl, clientId, clientSecret },
        resolveAccess: (profile) =>
            profile.email_verified
                ? { roles: ["cashier"] }
                : { deny: "Email not verified" },
    }),
);
```

A provider can use one of `oidc`, `oauth` or `social` (the host wires them
into its auth system), or `betterAuthPlugin` for methods the host does not
ship, such as a PIN. The latter runs arbitrary code in the host. Methods that
need their own login UI mount a component at `PluginUIMountPoint.AUTH_METHOD`.

The host guarantees that:

- Without the `AUTH` permission the plugin fails to load.
- Only roles in `authRoles`, further capped by the owner's settings, are
  granted. A plugin can never grant `owner`.
- `resolveAccess` returning `deny`, or throwing, blocks the login.
- Handlers receive the caller as `ctx.principal`. It is `null` only when the
  host has no resolved caller; treat that as unauthenticated.

## Payment processors

A plugin can take payment online (PayPal, Adyen, a regional processor).
Declare the `PAYMENT` permission and register a `PaymentProcessor` from the
server entry:

```ts
plugin.register("paymentProcessor", {
    id: "acme-pay", // the plugin's name, or "<plugin name>-<suffix>"
    label: "Acme Pay",
    capabilities: { checkout: true, invoice: false },
    async createCheckout({ order, successUrl, cancelUrl }) {
        const session = await acme.createSession(/* ... */);
        return { externalId: session.id, url: session.hostedUrl };
    },
    async handleWebhook({ headers, rawBody, url }) {
        if (!acme.verify(rawBody, headers["acme-signature"])) {
            throw new Error("bad signature");
        }
        const event = JSON.parse(rawBody.toString("utf8"));
        return [
            {
                id: event.id,
                type: "payment.updated",
                kind: "checkout",
                external_id: event.session,
                status: "paid",
            },
        ];
    },
});
```

The host guarantees that:

- Without the `PAYMENT` permission the plugin fails to load.
- The id must be the plugin's name or start with `<plugin name>-`, and can
  never be one the host ships (`square`). A second processor with the same id
  is refused and the plugin fails to load.
- The processor is removed again if its plugin is unloaded.
- `POST /webhooks/<id>` hands the request to `handleWebhook` with the raw body
  and the public URL, before any parsing. Throw for anything unsigned: the
  host answers a bare 401 and never shows or logs the error to the caller.
  Event ids must be stable across redeliveries; the host drops repeats.
- Only the operations that `capabilities` lists are called. Whatever a
  processor returns from `handleWebhook` is validated before it is used.
- Card data never passes through the host. A processor sends the shopper to a
  hosted page or invoice and reports the result by webhook.

## Gateway: principal, source, scopes and operations

Orders created through a gateway credential reach the same hooks and events as
staff orders. Every hook handler gets `(input, ctx)` and every event listener
gets `ctx` as its last argument, with `ctx.principal` (the caller, or `null`
when nothing authenticated caused it, such as a processor webhook) and
`ctx.source` (the credential's name for an online order, `null` at a till).

```ts
plugin.hook(hooks.beforeOrderCreate, (order, ctx) =>
    ctx.source !== null && total(order) < MINIMUM
        ? { ok: false, reason: "Online orders start at 10.00" }
        : { ok: true, value: order },
);
```

| Surface | Name                                                                                                                           | Notes                                                                                                                                                       |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hook    | `hooks.beforeInvoiceCreate`                                                                                                    | Input `InvoiceCreateRequest`; may change `dueDate`, `delivery`, `message` or block. Holds customer contact details: only called for plugins with `CUSTOMER` |
| Event   | `events.invoiceCreated`, `invoiceSent`, `invoiceViewed`, `invoicePaid`, `invoiceOverdue`, `invoiceCanceled`, `invoiceRefunded` | `(invoice, order, ctx)`                                                                                                                                     |

Plugin API handlers receive the caller as `ctx.principal`: a staff user, or a
gateway credential when the route is exposed through the gateway. A handler
that throws gets a generic 500; its message is never returned.

### Exposing a route through the gateway

A plugin API route stays internal unless its mount carries a `gateway`
descriptor. The descriptor names the operation, the scope, where the location
travels, and zod schemas for the request and response (wire form: amounts and
quantities are strings). `zod` is an **optional peer dependency** of the SDK;
install it in the plugin only if it declares gateway operations.

```ts
plugin.register("api", {
    route: "/customers/:customerId/summary",
    method: PluginApiMethod.GET,
    gateway: {
        operationId: "loyalty-sidebar.customerSummary",
        scope: "plugin:loyalty-sidebar:read",
        summary: "Loyalty points earned by one customer",
        location: "none", // "path" | "query" | "body" | "none"
        response: z.object({ orders: z.number(), points: z.number() }),
    },
    handler: async (req, ctx) => ({
        body: await summaryFor(req.params.customerId, ctx),
    }),
});
```

The route is then served at
`/gateway/v1/plugins/<plugin name>/<route>`, appears in the credential's
OpenAPI document and generated client, and gets the gateway's location and
rate-limit enforcement.

Manifest and naming rules, enforced when the plugin loads:

- List every scope the plugin uses in `tessellate.gatewayScopes`, each written
  `plugin:<plugin name>:<verb>` (verb: lowercase letters, digits, dashes). A
  plugin cannot declare or use a core scope, `*`, or another plugin's scope.
- An operation may use only scopes listed there, and its `operationId` must
  start with `<plugin name>.`.
- Owners grant these scopes to credentials like any other.

```json
{
    "tessellate": {
        "permissions": ["CUSTOMER"],
        "gatewayScopes": ["plugin:loyalty-sidebar:read"]
    }
}
```

### Calling the gateway (`@tessellatepos/plugin-sdk/gateway`)

For stores and integrations, not plugins. The subpath imports no React or Vite.

| Export                                                          | Purpose                                                                                                                   |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `createGatewayClient({ baseUrl, clientId, clientSecret? })`     | Sends the credential as HTTP Basic; throws `GatewayError` on non-2xx                                                      |
| `verifyWebhook(rawBody, header, secret, options?)`              | Verifies `Tessellate-Signature` against the raw body and returns the event; throws `WebhookVerificationError`             |
| `tessellate-gateway generate --url … --client-id … [--out dir]` | Writes a typed client from the credential's OpenAPI document (secret via `--client-secret` or `TESSELLATE_CLIENT_SECRET`) |

See the Gateway page of the Tessellate docs for credentials, scopes and webhooks.

## Hosting plugins

The frontend hands its own module instances to plugins so that the host and plugins only have one copy of the modules, before it imports any plugin bundle:

```ts
import * as React from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as sdk from "@tessellatepos/sdk";
import * as pluginSdk from "@tessellatepos/plugin-sdk";
import { exposeSharedModules } from "@tessellatepos/plugin-sdk/host";

exposeSharedModules({
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "@tessellatepos/sdk": sdk,
    "@tessellatepos/plugin-sdk": pluginSdk,
});
```

If the host's copy lacks an export the plugin was built against (an older
SDK), the plugin logs a warning naming it.
