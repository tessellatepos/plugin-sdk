import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        "src/index": "src/index.ts",
        "src/server/index": "src/server/index.ts",
        "src/host/index": "src/host/index.ts",
        "src/vite/index": "src/vite/index.ts",
        "src/gateway/index": "src/gateway/index.ts",
        "src/gateway/cli": "src/gateway/cli.ts",
    },
    format: ["esm"],
    dts: true,
    outDir: "lib",
    clean: true,
    sourcemap: true,
});
