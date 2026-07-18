import vinext from "vinext";
import { defineConfig } from "vite";
import hostingConfig from "./.openai/hosting.json";
import { sites } from "./build/sites-vite-plugin";

const PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";

// Inline bindings are only for the local dev server. At build time they must
// stay out of the generated deploy config, where wrangler.jsonc already
// declares the same bindings (duplicate binding names fail `wrangler deploy`).
// compatibility_flags is likewise declared only in wrangler.jsonc — repeating
// it here gets merged twice and workerd rejects the duplicate.
function localBindingConfig(command: "serve" | "build") {
  const isDev = command === "serve";
  return {
    main: "./worker/index.ts",
    d1_databases:
      d1 && isDev
        ? [
            {
              binding: d1,
              database_name: "subscription-stats-d1",
              database_id: PLACEHOLDER_DATABASE_ID,
            },
          ]
        : [],
    r2_buckets:
      r2 && isDev
        ? [
            {
              binding: r2,
              bucket_name: "site-creator-r2",
            },
          ]
        : [],
  };
}

export default defineConfig(async ({ command }) => {
  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: isCodexSeatbeltSandbox
      ? { watch: { useFsEvents: false, usePolling: true } }
      : undefined,
    plugins: [
      vinext(),
      sites(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        config: localBindingConfig(command),
      }),
    ],
  };
});
