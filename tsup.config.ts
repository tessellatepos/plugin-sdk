import { defineConfig } from "tsup";

export default defineConfig({
    entry: {
        "src/index": "src/index.ts",
        "src/server/index": "src/server/index.ts",
    },
    format: ["esm"],
    dts: true,
    outDir: "lib",
    clean: true,
    sourcemap: true,
});
