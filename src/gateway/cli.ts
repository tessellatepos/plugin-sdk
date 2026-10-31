#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import openapiTS, { astToString } from "openapi-typescript";
import { generateClientSource, listOperations } from "./codegen.ts";

const USAGE = `Usage: tessellate-gateway generate --url <store url> --client-id <id>
         [--client-secret <secret>] [--out <dir>]

Reads <store url>/gateway/v1/openapi.json as the credential and writes
gateway.d.ts and client.ts into <dir> (default ./tessellate).
The secret can also come from TESSELLATE_CLIENT_SECRET.`;

function parseArgs(argv: string[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg.startsWith("--") && argv[i + 1] !== undefined) {
            out[arg.slice(2)] = argv[++i];
        }
    }
    return out;
}

async function main(): Promise<void> {
    const [command, ...rest] = process.argv.slice(2);
    const args = parseArgs(rest);
    const secret =
        args["client-secret"] ?? process.env.TESSELLATE_CLIENT_SECRET;
    if (command !== "generate" || !args.url || !args["client-id"] || !secret) {
        console.error(USAGE);
        process.exit(1);
    }
    const base = args.url.replace(/\/+$/, "");
    const root = base.endsWith("/gateway/v1") ? base : `${base}/gateway/v1`;
    const auth = Buffer.from(`${args["client-id"]}:${secret}`).toString(
        "base64",
    );
    const res = await fetch(`${root}/openapi.json`, {
        headers: { Authorization: `Basic ${auth}` },
    });
    if (!res.ok) {
        console.error(
            `Could not read the OpenAPI document (HTTP ${res.status})`,
        );
        process.exit(1);
    }
    const doc = (await res.json()) as Record<string, unknown>;
    const out = resolve(args.out ?? "tessellate");
    await mkdir(out, { recursive: true });
    const types = astToString(await openapiTS(doc as never));
    await writeFile(join(out, "gateway.d.ts"), types);
    await writeFile(
        join(out, "client.ts"),
        generateClientSource(listOperations(doc)),
    );
    console.log(
        `Wrote ${join(out, "gateway.d.ts")} and ${join(out, "client.ts")}`,
    );
}

main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
});
