# @tessellatepos/plugin-sdk

Contract surface for Tessellate POS plugins: types, mount points, hooks and
events, plus the build tooling plugins use and the helper the host uses to
load them.

| Entry | Used by | Contents |
|---|---|---|
| `@tessellatepos/plugin-sdk` | Plugin client code | `PluginContext`, `PluginUIMountPoint`, `PluginApiMethod`, `FrontendPlugin`, database column types |
| `@tessellatepos/plugin-sdk/server` | Plugin server entry | `ServerPlugin`, `PluginServerContext`, `hooks`, `events` |
| `@tessellatepos/plugin-sdk/vite` | Plugin `vite.config.ts` | `tessellatePlugin()` |
| `@tessellatepos/plugin-sdk/host` | Tessellate frontend | `exposeSharedModules()` |


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
