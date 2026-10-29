# @tessellatepos/plugin-sdk

Contract surface for Tessellate POS plugins: types, mount points, hooks and
events, plus the build tooling plugins use and the helper the host uses to
load them.

| Entry                              | Used by                 | Contents                                                                                          |
| ---------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `@tessellatepos/plugin-sdk`        | Plugin client code      | `PluginContext`, `PluginUIMountPoint`, `PluginApiMethod`, `FrontendPlugin`, database column types |
| `@tessellatepos/plugin-sdk/server` | Plugin server entry     | `ServerPlugin`, `PluginServerContext`, `hooks`, `events`, `defineAuthProvider`                    |
| `@tessellatepos/plugin-sdk/vite`   | Plugin `vite.config.ts` | `tessellatePlugin()`                                                                              |
| `@tessellatepos/plugin-sdk/host`   | Tessellate frontend     | `exposeSharedModules()`                                                                           |

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
