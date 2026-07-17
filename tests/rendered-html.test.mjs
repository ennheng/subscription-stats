import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
// Dev server (Miniflare) provides a real local D1 — mirrors production behavior.
// `vinext start` is a plain-Node server with no D1 binding, so we test via dev.
// NOTE: Vite binds `localhost` (IPv6 ::1 on Windows); 127.0.0.1 is refused.
const PORT = 18831;
const baseUrl = `http://localhost:${PORT}`;

let serverProcess;
let serverLog = "";
const createdSubscriptionIds = new Set();

async function waitForServer(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(2_000) });
      // 200 (ok) or 500 (route error) both mean the server is up; only connection
      // refusal means still starting. Accept any HTTP response.
      if (response.status > 0) return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  throw new Error(
    `server did not start.\n--- log ---\n${serverLog}\n--- error ---\n${lastError?.message}`,
  );
}

test.before(async () => {
  serverProcess = spawn("npx", ["vinext", "dev", "--port", String(PORT)], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
  });
  serverProcess.stdout.on("data", (chunk) => (serverLog += chunk));
  serverProcess.stderr.on("data", (chunk) => (serverLog += chunk));
  await waitForServer();
});

test.after(() => {
  if (!serverProcess) return;
  // `shell: true` wraps the real server in cmd.exe; killing the wrapper leaves
  // the Miniflare child alive on Windows. taskkill /T kills the whole tree.
  if (process.platform === "win32") {
    try {
      spawn("taskkill", ["/PID", String(serverProcess.pid), "/T", "/F"], {
        stdio: "ignore",
        shell: true,
      });
    } catch {}
  } else {
    try {
      serverProcess.kill("SIGKILL");
    } catch {}
  }
});

test.afterEach(async () => {
  for (const id of createdSubscriptionIds) {
    await fetch(`${baseUrl}/api/subscriptions/${id}`, { method: "DELETE" }).catch(() => null);
  }
  createdSubscriptionIds.clear();
});

test("dashboard renders and full subscription lifecycle works", async () => {
  // dashboard renders (local dev DB may already contain rows)
  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.match(homeHtml, /<title>合租订阅<\/title>/);
  assert.match(homeHtml, /月均/);
  assert.match(homeHtml, /新增订阅/);
  assert.match(homeHtml, /导出日历/);
  assert.match(homeHtml, /安装/);
  assert.match(homeHtml, /viewport-fit=cover/);

  // create a yearly subscription (unique name so re-runs stay unambiguous)
  const name = `TestSub-${Date.now()}`;
  const create = await fetch(`${baseUrl}/api/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name,
      ownerContact: "微信-小明",
      totalPrice: "68",
      share: "17",
      cycle: "yearly",
      nextDueDate: "2027-01-15",
      note: "",
    }),
  });
  assert.equal(create.status, 201);
  const { subscription } = await create.json();
  assert.equal(subscription.shareCents, 1700);
  assert.equal(subscription.nextDueDate, "2027-01-15");
  const id = subscription.id;
  createdSubscriptionIds.add(id);

  // dashboard lists it
  const listed = await (await fetch(`${baseUrl}/`)).text();
  assert.match(listed, new RegExp(name));

  // mark paid advances the due date by one year
  const pay = await fetch(`${baseUrl}/api/subscriptions/${id}/pay`, { method: "POST" });
  assert.equal(pay.status, 200);
  const { subscription: paid } = await pay.json();
  assert.equal(paid.nextDueDate, "2028-01-15");

  // 月均支出只属于顶部概览,不要在「累计已付」图表标题区重复展示。
  const paidHome = await (await fetch(`${baseUrl}/`)).text();
  const spendingSection = paidHome.match(
    /<section[^>]*data-testid="spending-chart"[^>]*>[\s\S]*?<\/section>/,
  )?.[0];
  assert.ok(spendingSection, "累计已付图表应在存在付款记录时显示");
  assert.doesNotMatch(spendingSection, /月均/);

  // ics export contains the subscription
  const icsResponse = await fetch(`${baseUrl}/calendar.ics`);
  assert.equal(icsResponse.status, 200);
  assert.match(icsResponse.headers.get("content-type") ?? "", /^text\/calendar\b/i);
  const ics = await icsResponse.text();
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /END:VCALENDAR/);

  // delete removes it; deleting again 404s
  const del = await fetch(`${baseUrl}/api/subscriptions/${id}`, { method: "DELETE" });
  assert.equal(del.status, 200);
  createdSubscriptionIds.delete(id);
  const delAgain = await fetch(`${baseUrl}/api/subscriptions/${id}`, { method: "DELETE" });
  assert.equal(delAgain.status, 404);
});

test("rejects invalid payloads with 400", async () => {
  const response = await fetch(`${baseUrl}/api/subscriptions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "", share: "abc", cycle: "weekly" }),
  });
  assert.equal(response.status, 400);
  const body = await response.json();
  assert.ok(typeof body.error === "string");
});

test("serves a complete installable PWA surface", async () => {
  const manifestResponse = await fetch(`${baseUrl}/manifest.webmanifest`);
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.orientation, "any");
  assert.equal(manifest.prefer_related_applications, false);
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "any"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));
  assert.ok(manifest.shortcuts.some((shortcut) => shortcut.url === "/subscriptions/new"));

  const workerResponse = await fetch(`${baseUrl}/sw.js`);
  assert.equal(workerResponse.status, 200);
  const worker = await workerResponse.text();
  assert.match(worker, /addEventListener\("fetch"/);
  assert.match(worker, /\/api\//);
  assert.match(worker, /offline\.html/);

  const offlineResponse = await fetch(`${baseUrl}/offline.html`);
  assert.equal(offlineResponse.status, 200);
  const offline = await offlineResponse.text();
  assert.match(offline, /当前网络不可用/);
  assert.match(offline, /viewport-fit=cover/);
});
