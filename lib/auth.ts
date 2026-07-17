import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { username } from "better-auth/plugins";
import { headers } from "next/headers";
import { getDb } from "../db";
import * as schema from "../db/schema";

export async function getAuth() {
  const [{ env }, db] = await Promise.all([
    import("cloudflare:workers"),
    getDb(),
  ]);
  const runtimeEnv = env as unknown as { BETTER_AUTH_SECRET?: string };
  const secret = runtimeEnv.BETTER_AUTH_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "BETTER_AUTH_SECRET is missing or shorter than 32 characters. Configure it in .dev.vars locally and as a secret in production.",
    );
  }

  return betterAuth({
    appName: "Subscription Stats",
    secret,
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
      transaction: false,
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 10,
      maxPasswordLength: 128,
      autoSignIn: true,
    },
    user: {
      deleteUser: { enabled: true },
    },
    plugins: [username({ minUsernameLength: 3, maxUsernameLength: 30 })],
    trustedOrigins: (request) => {
      if (!request) return [];
      return [new URL(request.url).origin];
    },
  });
}

export async function getServerSession() {
  const requestHeaders = new Headers(await headers());
  return getSessionForHeaders(requestHeaders);
}

export async function getSessionForHeaders(requestHeaders: Headers) {
  const auth = await getAuth();
  return auth.api.getSession({ headers: requestHeaders });
}
