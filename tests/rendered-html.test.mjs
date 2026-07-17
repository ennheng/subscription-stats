import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const PORT = 18831;
const baseUrl = `http://localhost:${PORT}`;
const runId = `${Date.now().toString(36)}${Math.floor(Math.random() * 1_000).toString(36)}`;
const testUserPrefix = `rt${runId}`;

let serverProcess;
let serverLog = "";

async function waitForServer(timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${baseUrl}/`, { signal: AbortSignal.timeout(2_000) });
      if (response.status > 0) return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 600));
    }
  }
  throw new Error(`server did not start.\n--- log ---\n${serverLog}\n--- error ---\n${lastError?.message}`);
}

function cookieHeader(response) {
  const values = typeof response.headers.getSetCookie === "function"
    ? response.headers.getSetCookie()
    : [response.headers.get("set-cookie")].filter(Boolean);
  return values.map((value) => value.split(";", 1)[0]).join("; ");
}

async function createAccount(suffix) {
  const username = `${testUserPrefix}${suffix}`.toLowerCase();
  const password = `Local-test-password-${runId}-${suffix}`;
  const response = await fetch(`${baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: baseUrl },
    body: JSON.stringify({
      name: username,
      username,
      email: `${username}@account.subscription-stats.invalid`,
      password,
    }),
  });
  if (response.status !== 200) {
    assert.fail(`account creation failed with ${response.status}: ${await response.text()}`);
  }
  const cookie = cookieHeader(response);
  assert.match(cookie, /session_token/i);
  return { username, password, cookie };
}

function authenticated(cookie, init = {}) {
  return {
    ...init,
    headers: {
      ...init.headers,
      Cookie: cookie,
      Origin: baseUrl,
    },
  };
}

test.before(async () => {
  serverProcess = spawn("npx", ["vinext", "dev", "--port", String(PORT)], {
    cwd: root,
    detached: process.platform !== "win32",
    stdio: ["ignore", "pipe", "pipe"],
    shell: process.platform === "win32",
    env: { ...process.env, WRANGLER_LOG_PATH: ".wrangler/wrangler.log" },
  });
  serverProcess.stdout.on("data", (chunk) => (serverLog += chunk));
  serverProcess.stderr.on("data", (chunk) => (serverLog += chunk));
  await waitForServer();
});

test.after(async () => {
  if (serverProcess) {
    if (process.platform === "win32") {
      spawnSync("taskkill", ["/PID", String(serverProcess.pid), "/T", "/F"], {
        stdio: "ignore",
        shell: true,
      });
    } else {
      const closed = serverProcess.exitCode === null
        ? Promise.race([
            once(serverProcess, "close"),
            new Promise((resolve) => setTimeout(resolve, 5_000)),
          ])
        : Promise.resolve();
      try { process.kill(-serverProcess.pid, "SIGKILL"); }
      catch { try { serverProcess.kill("SIGKILL"); } catch {} }
      await closed;
    }
  }

  const escapedPrefix = testUserPrefix.replaceAll("'", "''");
  spawnSync(
    "npx",
    [
      "wrangler",
      "d1",
      "execute",
      "site-creator-d1",
      "--local",
      "--command",
      `DELETE FROM user WHERE username LIKE '${escapedPrefix}%';`,
    ],
    { cwd: root, stdio: "ignore", shell: process.platform === "win32" },
  );
});

test("public landing and guest mode are bilingual and do not require an account", async () => {
  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  const homeHtml = await home.text();
  assert.match(homeHtml, /<title>订阅统计 · Subscription Stats<\/title>/);
  assert.match(homeHtml, /登录并云端同步/);
  assert.match(homeHtml, /游客使用/);
  assert.match(homeHtml, /当前不收集邮箱/);
  assert.match(homeHtml, /viewport-fit=cover/);

  const english = await fetch(`${baseUrl}/`, {
    headers: { Cookie: "subscription_stats_locale=en" },
  });
  const englishHtml = await english.text();
  assert.match(englishHtml, /Sign in and sync/);
  assert.match(englishHtml, /Continue as guest/);

  const guest = await fetch(`${baseUrl}/guest`);
  assert.equal(guest.status, 200);
  const guestHtml = await guest.text();
  assert.match(guestHtml, /仅存本机/);
  assert.match(guestHtml, /游客数据只保存在这个浏览器/);

  for (const route of ["/api/subscriptions", "/calendar.ics"]) {
    const response = await fetch(`${baseUrl}${route}`);
    assert.equal(response.status, 401);
  }
});

test("cloud accounts are isolated across list, edit, payment, delete, and ICS", async () => {
  const userA = await createAccount("a");
  const userB = await createAccount("b");

  const name = `PrivateSub-${runId}`;
  const create = await fetch(
    `${baseUrl}/api/subscriptions`,
    authenticated(userA.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        ownerContact: "private-contact",
        totalPrice: "68",
        share: "17",
        cycle: "yearly",
        nextDueDate: "2027-01-15",
        note: "private-note",
      }),
    }),
  );
  if (create.status !== 201) {
    assert.fail(`subscription creation failed with ${create.status}: ${await create.text()}`);
  }
  const { subscription } = await create.json();
  const id = subscription.id;
  assert.equal(subscription.shareCents, 1700);
  assert.ok(subscription.userId);

  const dashboardA = await (await fetch(`${baseUrl}/`, authenticated(userA.cookie))).text();
  assert.match(dashboardA, new RegExp(name));
  assert.match(dashboardA, /预计年支出/);
  assert.match(dashboardA, /按当前订阅折算年度占比/);

  const listB = await fetch(`${baseUrl}/api/subscriptions`, authenticated(userB.cookie));
  assert.equal(listB.status, 200);
  const bodyB = await listB.json();
  assert.ok(!bodyB.subscriptions.some((item) => item.id === id));

  for (const [method, path, body] of [
    ["GET", `/api/subscriptions/${id}`, undefined],
    ["PATCH", `/api/subscriptions/${id}`, JSON.stringify({
      name: "stolen",
      ownerContact: "",
      totalPrice: "68",
      share: "17",
      cycle: "yearly",
      nextDueDate: "2027-01-15",
      note: "",
    })],
    ["POST", `/api/subscriptions/${id}/pay`, undefined],
    ["DELETE", `/api/subscriptions/${id}`, undefined],
  ]) {
    const response = await fetch(
      `${baseUrl}${path}`,
      authenticated(userB.cookie, {
        method,
        ...(body ? { headers: { "Content-Type": "application/json" }, body } : {}),
      }),
    );
    assert.equal(response.status, 404, `${method} ${path} must not cross tenant boundaries`);
  }

  const icsB = await fetch(`${baseUrl}/calendar.ics`, authenticated(userB.cookie));
  assert.equal(icsB.status, 200);
  assert.doesNotMatch(await icsB.text(), new RegExp(name));

  const exportB = await fetch(`${baseUrl}/api/export`, authenticated(userB.cookie));
  assert.equal(exportB.status, 200);
  assert.doesNotMatch(await exportB.text(), new RegExp(name));

  const exportA = await fetch(`${baseUrl}/api/export`, authenticated(userA.cookie));
  assert.equal(exportA.status, 200);
  assert.match(exportA.headers.get("content-disposition") ?? "", /subscription-stats-data\.json/);
  assert.match(await exportA.text(), new RegExp(name));

  const payA = await fetch(
    `${baseUrl}/api/subscriptions/${id}/pay`,
    authenticated(userA.cookie, { method: "POST" }),
  );
  assert.equal(payA.status, 200);
  assert.equal((await payA.json()).subscription.nextDueDate, "2028-01-15");

  const icsA = await fetch(`${baseUrl}/calendar.ics?lang=en`, authenticated(userA.cookie));
  assert.equal(icsA.status, 200);
  assert.match(icsA.headers.get("content-type") ?? "", /^text\/calendar\b/i);
  const calendarA = await icsA.text();
  assert.match(calendarA, new RegExp(name));
  assert.match(calendarA, /X-WR-CALNAME:Subscription Stats/);

  const removeA = await fetch(
    `${baseUrl}/api/subscriptions/${id}`,
    authenticated(userA.cookie, { method: "DELETE" }),
  );
  assert.equal(removeA.status, 200);
});

test("authenticated validation rejects invalid payloads", async () => {
  const user = await createAccount("validation");
  const response = await fetch(
    `${baseUrl}/api/subscriptions`,
    authenticated(user.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "", share: "abc", cycle: "weekly" }),
    }),
  );
  assert.equal(response.status, 400);
  assert.equal(typeof (await response.json()).error, "string");

  const deletion = await fetch(
    `${baseUrl}/api/auth/delete-user`,
    authenticated(user.cookie, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: user.password }),
    }),
  );
  assert.equal(deletion.status, 200, await deletion.text());
  assert.equal(
    (await fetch(`${baseUrl}/api/subscriptions`, authenticated(user.cookie))).status,
    401,
  );
});

test("serves the complete PWA surface and service icons", async () => {
  for (const iconPath of [
    "/service-icons/chatgpt.jpg",
    "/service-icons/lightroom.png",
    "/service-icons/windy.jpg",
  ]) {
    assert.equal((await fetch(`${baseUrl}${iconPath}`)).status, 200);
  }

  const manifestResponse = await fetch(`${baseUrl}/manifest.webmanifest`);
  assert.equal(manifestResponse.status, 200);
  const manifest = await manifestResponse.json();
  assert.equal(manifest.id, "/");
  assert.equal(manifest.start_url, "/");
  assert.equal(manifest.scope, "/");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192" && icon.purpose === "any"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose === "maskable"));

  const worker = await (await fetch(`${baseUrl}/sw.js`)).text();
  assert.match(worker, /addEventListener\("fetch"/);
  assert.match(worker, /\/api\//);
  assert.match(worker, /offline\.html/);
  assert.match(worker, /url\.pathname\.startsWith\("\/guest"\)/);
  assert.match(worker, /private server-rendered data/);

  const offline = await (await fetch(`${baseUrl}/offline.html`)).text();
  assert.match(offline, /当前网络不可用/);
  assert.match(offline, /Offline right now/);
});
